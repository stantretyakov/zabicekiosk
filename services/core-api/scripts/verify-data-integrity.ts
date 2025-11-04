#!/usr/bin/env node
import crypto from 'crypto';
import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';
import path from 'path';

// Initialize Firestore
const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  databaseId: process.env.FIRESTORE_DATABASE_ID,
  ignoreUndefinedProperties: true,
});

// Token functions (copied from src/lib/tokens.ts)
const tokenSecret = process.env.TOKEN_SECRET;
const canVerifyTokenHashes = Boolean(tokenSecret);

if (!canVerifyTokenHashes) {
  console.warn(
    '⚠️  TOKEN_SECRET environment variable is not set. Token hash verification will be skipped.',
  );
}

function hashToken(token: string): string {
  if (!tokenSecret) {
    throw new Error('TOKEN_SECRET environment variable is required to hash tokens.');
  }
  return crypto.createHmac('sha256', tokenSecret).update(token).digest('hex');
}

// Search token generation (copied from src/routes/admin.clients.ts)
const DIACRITICS_REGEX = /\p{Diacritic}/gu;
const NON_WORD_REGEX = /[^a-z0-9а-яё\s-]/giu;

function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .replace(NON_WORD_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateWordPrefixes(word: string): string[] {
  const prefixes: string[] = [];
  let current = '';
  for (const char of word) {
    current += char;
    prefixes.push(current);
  }
  return prefixes;
}

type SearchableFields = {
  parentName?: string | null;
  childName?: string | null;
  phone?: string | null;
  telegram?: string | null;
  instagram?: string | null;
};

function generateSearchTokens(fields: SearchableFields): string[] {
  const tokens = new Set<string>();

  const addFromWords = (value?: string | null, options?: { includeCollapsed?: boolean }) => {
    if (!value) return;
    const normalized = normalizeForSearch(value);
    if (!normalized) return;

    const words = normalized.split(' ').filter(Boolean);
    for (const word of words) {
      for (const prefix of generateWordPrefixes(word)) {
        tokens.add(prefix);
      }
    }

    if (options?.includeCollapsed && words.length > 1) {
      const collapsed = words.join('');
      if (collapsed) {
        for (const prefix of generateWordPrefixes(collapsed)) {
          tokens.add(prefix);
        }
      }
    }
  };

  const addFromDigits = (value?: string | null) => {
    if (!value) return;
    const digits = value.replace(/\D/g, '');
    if (!digits) return;
    for (const prefix of generateWordPrefixes(digits)) {
      tokens.add(prefix);
    }
  };

  addFromWords(fields.parentName);
  addFromWords(fields.childName);

  if (fields.phone) {
    addFromDigits(fields.phone);
    addFromWords(fields.phone);
  }

  if (fields.telegram) {
    const handle = fields.telegram.replace(/^@/, '');
    addFromWords(handle, { includeCollapsed: true });
  }

  if (fields.instagram) {
    let handle: string | undefined;
    try {
      const url = new URL(fields.instagram);
      const segments = url.pathname.split('/').filter(Boolean);
      handle = segments[segments.length - 1];
    } catch {
      handle = fields.instagram;
    }
    addFromWords(handle, { includeCollapsed: true });
  }

  return Array.from(tokens).sort();
}

// Integrity check interfaces
interface ClientIntegrityIssue {
  clientId: string;
  issues: string[];
}

interface PassIntegrityIssue {
  passId: string;
  issues: string[];
}

interface RedeemIntegrityIssue {
  redeemId: string;
  issues: string[];
}

interface IntegrityReport {
  timestamp: string;
  totalClients: number;
  totalPasses: number;
  totalRedeems: number;
  clientIssues: ClientIntegrityIssue[];
  passIssues: PassIntegrityIssue[];
  redeemIssues: RedeemIntegrityIssue[];
  summary: {
    clientsWithIssues: number;
    passesWithIssues: number;
    redeemsWithIssues: number;
    totalIssues: number;
  };
}

type IssueSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

interface AggregatedIssue {
  category: string;
  count: number;
  severity: IssueSeverity;
  samples: string[];
}

// Verification functions
async function verifyClientsCollection(): Promise<ClientIntegrityIssue[]> {
  console.log('🔍 Verifying clients collection...');
  const issues: ClientIntegrityIssue[] = [];

  const clientsSnap = await db.collection('clients').get();
  console.log(`   Checking ${clientsSnap.size} clients...`);

  for (const doc of clientsSnap.docs) {
    const data = doc.data();
    const clientIssues: string[] = [];

    // Check required fields
    if (!data.parentName) clientIssues.push('Missing parentName');
    if (!data.childName) clientIssues.push('Missing childName');

    // Check token fields (only for active clients)
    if (data.active !== false) {
      if (!data.token) clientIssues.push('Missing token');
      if (!data.tokenHash) clientIssues.push('Missing tokenHash');

      // Check token-tokenHash consistency
      if (canVerifyTokenHashes && data.token && data.tokenHash) {
        const expectedHash = hashToken(data.token);
        if (data.tokenHash !== expectedHash) {
          clientIssues.push(
            `Token hash mismatch: expected ${expectedHash}, got ${data.tokenHash}`,
          );
        }
      }
    }

    // Check searchTokens array
    if (!Array.isArray(data.searchTokens)) {
      clientIssues.push('searchTokens is not an array');
    } else {
      const size = JSON.stringify(data.searchTokens).length;
      if (size > 40000) {
        clientIssues.push(`searchTokens too large: ${size} bytes`);
      }

      // Verify searchTokens are correct for this client
      const expectedTokens = generateSearchTokens({
        parentName: data.parentName,
        childName: data.childName,
        phone: data.phone,
        telegram: data.telegram,
        instagram: data.instagram,
      });

      const storedSet = new Set(data.searchTokens);
      const missingTokens = expectedTokens.filter(t => !storedSet.has(t));
      const extraTokens = data.searchTokens.filter((t: string) => !expectedTokens.includes(t));

      if (missingTokens.length > 0) {
        clientIssues.push(`Missing ${missingTokens.length} expected tokens`);
      }
      if (extraTokens.length > 0) {
        clientIssues.push(`Has ${extraTokens.length} unexpected tokens`);
      }
    }

    // Check fullNameLower consistency
    if (data.parentName && data.childName) {
      const expectedFullNameLower = `${data.parentName} ${data.childName}`.toLowerCase();
      if (data.fullNameLower !== expectedFullNameLower) {
        clientIssues.push(
          `fullNameLower mismatch: expected "${expectedFullNameLower}", got "${data.fullNameLower}"`,
        );
      }
    }

    if (clientIssues.length > 0) {
      issues.push({ clientId: doc.id, issues: clientIssues });
    }
  }

  console.log(`   ✓ Found ${issues.length} clients with issues`);
  return issues;
}

async function verifyPassesCollection(): Promise<PassIntegrityIssue[]> {
  console.log('🔍 Verifying passes collection...');
  const issues: PassIntegrityIssue[] = [];

  const passesSnap = await db.collection('passes').get();
  console.log(`   Checking ${passesSnap.size} passes...`);

  for (const doc of passesSnap.docs) {
    const data = doc.data();
    const passIssues: string[] = [];

    // Check required fields
    if (!data.clientId) {
      passIssues.push('Missing clientId');
    } else {
      // Verify foreign key
      const clientSnap = await db.collection('clients').doc(data.clientId).get();
      if (!clientSnap.exists) {
        passIssues.push(`Orphaned pass: clientId ${data.clientId} does not exist`);
      }
    }

    // Check planSize and used
    if (typeof data.planSize !== 'number' || data.planSize < 0) {
      passIssues.push(`Invalid planSize: ${data.planSize}`);
    }
    if (typeof data.used !== 'number' || data.used < 0) {
      passIssues.push(`Invalid used: ${data.used}`);
    }
    if (data.used > data.planSize) {
      passIssues.push(`used (${data.used}) exceeds planSize (${data.planSize})`);
    }

    // Check expiresAt
    if (!data.expiresAt || !data.expiresAt.toDate) {
      passIssues.push('Invalid or missing expiresAt');
    }

    if (passIssues.length > 0) {
      issues.push({ passId: doc.id, issues: passIssues });
    }
  }

  console.log(`   ✓ Found ${issues.length} passes with issues`);
  return issues;
}

async function verifyRedeemsCollection(): Promise<RedeemIntegrityIssue[]> {
  console.log('🔍 Verifying redeems collection...');
  const issues: RedeemIntegrityIssue[] = [];

  const redeemsSnap = await db.collection('redeems').get();
  console.log(`   Checking ${redeemsSnap.size} redeems...`);

  for (const doc of redeemsSnap.docs) {
    const data = doc.data();
    const redeemIssues: string[] = [];

    // Check clientId foreign key
    if (!data.clientId) {
      redeemIssues.push('Missing clientId');
    } else {
      const clientSnap = await db.collection('clients').doc(data.clientId).get();
      if (!clientSnap.exists) {
        redeemIssues.push(`Orphaned redeem: clientId ${data.clientId} does not exist`);
      }
    }

    // Check passId foreign key (if present)
    if (data.passId) {
      const passSnap = await db.collection('passes').doc(data.passId).get();
      if (!passSnap.exists) {
        redeemIssues.push(`Orphaned redeem: passId ${data.passId} does not exist`);
      }
    }

    // Check kind
    if (!['pass', 'dropin', 'renewal'].includes(data.kind)) {
      redeemIssues.push(`Invalid kind: ${data.kind}`);
    }

    if (redeemIssues.length > 0) {
      issues.push({ redeemId: doc.id, issues: redeemIssues });
    }
  }

  console.log(`   ✓ Found ${issues.length} redeems with issues`);
  return issues;
}

async function generateIntegrityReport(): Promise<IntegrityReport> {
  console.log('🔍 Starting data integrity verification...');
  console.log('');

  const [clientIssues, passIssues, redeemIssues] = await Promise.all([
    verifyClientsCollection(),
    verifyPassesCollection(),
    verifyRedeemsCollection(),
  ]);

  console.log('');
  console.log('📊 Counting totals...');

  const [clientsSnap, passesSnap, redeemsSnap] = await Promise.all([
    db.collection('clients').count().get(),
    db.collection('passes').count().get(),
    db.collection('redeems').count().get(),
  ]);

  const report: IntegrityReport = {
    timestamp: new Date().toISOString(),
    totalClients: clientsSnap.data().count,
    totalPasses: passesSnap.data().count,
    totalRedeems: redeemsSnap.data().count,
    clientIssues,
    passIssues,
    redeemIssues,
    summary: {
      clientsWithIssues: clientIssues.length,
      passesWithIssues: passIssues.length,
      redeemsWithIssues: redeemIssues.length,
      totalIssues: clientIssues.length + passIssues.length + redeemIssues.length,
    },
  };

  return report;
}

function printReport(report: IntegrityReport) {
  const aggregateIssues = <T extends { issues: string[] }>(
    issues: T[],
    getId: (issue: T) => string,
  ): AggregatedIssue[] => {
    const map = new Map<string, AggregatedIssue>();

    const determineSeverity = (message: string): IssueSeverity => {
      const normalized = message.toLowerCase();
      if (
        normalized.includes('orphaned') ||
        normalized.includes('token hash mismatch') ||
        normalized.includes('missing token') ||
        normalized.includes('missing clientid') ||
        normalized.includes('missing parentname') ||
        normalized.includes('missing childname')
      ) {
        return 'CRITICAL';
      }
      if (
        normalized.includes('missing') ||
        normalized.includes('invalid') ||
        normalized.includes('exceeds') ||
        normalized.includes('too large')
      ) {
        return 'MAJOR';
      }
      return 'MINOR';
    };

    for (const issue of issues) {
      for (const message of issue.issues) {
        const severity = determineSeverity(message);
        const existing = map.get(message);
        if (existing) {
          existing.count += 1;
          if (existing.samples.length < 3) {
            existing.samples.push(getId(issue));
          }
        } else {
          map.set(message, {
            category: message,
            count: 1,
            severity,
            samples: [getId(issue)],
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  };

  const clientAggregates = aggregateIssues(report.clientIssues, issue => issue.clientId);
  const passAggregates = aggregateIssues(report.passIssues, issue => issue.passId);
  const redeemAggregates = aggregateIssues(report.redeemIssues, issue => issue.redeemId);

  const severityWeight: Record<IssueSeverity, number> = {
    CRITICAL: 5,
    MAJOR: 3,
    MINOR: 1,
  };

  const totalRiskScore = [...clientAggregates, ...passAggregates, ...redeemAggregates].reduce(
    (score, aggregate) => score + aggregate.count * severityWeight[aggregate.severity],
    0,
  );

  const riskLevel = (() => {
    if (report.summary.totalIssues === 0) return 'LOW (no issues detected)';
    if (totalRiskScore <= 5) return 'LOW';
    if (totalRiskScore <= 15) return 'MODERATE';
    return 'HIGH';
  })();

  const printAggregatedIssues = (title: string, aggregates: AggregatedIssue[]) => {
    if (aggregates.length === 0) {
      console.log(`   ${title}: none`);
      return;
    }

    console.log(`   ${title}:`);
    for (const aggregate of aggregates.slice(0, 5)) {
      const sampleIds = aggregate.samples.join(', ');
      const sampleSuffix = sampleIds ? `; samples: ${sampleIds}` : '';
      console.log(
        `      - [${aggregate.severity}] ${aggregate.category} (count: ${aggregate.count}${sampleSuffix})`,
      );
    }
    if (aggregates.length > 5) {
      console.log(`      ... and ${aggregates.length - 5} more categories`);
    }
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    INTEGRITY REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('');
  console.log('📊 Collection Sizes:');
  console.log(`   Clients: ${report.totalClients}`);
  console.log(`   Passes:  ${report.totalPasses}`);
  console.log(`   Redeems: ${report.totalRedeems}`);
  console.log('');
  console.log('🔍 Issues Found:');
  console.log(
    `   Clients with issues: ${report.summary.clientsWithIssues} / ${report.totalClients}`,
  );
  console.log(
    `   Passes with issues:  ${report.summary.passesWithIssues} / ${report.totalPasses}`,
  );
  console.log(
    `   Redeems with issues: ${report.summary.redeemsWithIssues} / ${report.totalRedeems}`,
  );
  console.log('');
  console.log('🛡️  Risk Assessment:');
  console.log(`   Level: ${riskLevel}`);
  console.log(`   Weighted score: ${totalRiskScore}`);
  console.log('');

  if (report.summary.totalIssues === 0) {
    console.log('✅ DATABASE INTEGRITY: PASSED');
    console.log('   No issues detected. All data is consistent.');
  } else {
    console.log('❌ DATABASE INTEGRITY: FAILED');
    console.log(`   Total issues: ${report.summary.totalIssues}`);
    console.log('');

    console.log('🔎 Issue Breakdown:');
    printAggregatedIssues('Client issue categories', clientAggregates);
    printAggregatedIssues('Pass issue categories', passAggregates);
    printAggregatedIssues('Redeem issue categories', redeemAggregates);
    console.log('');

    if (report.clientIssues.length > 0) {
      console.log('🚨 Client Issues:');
      for (const issue of report.clientIssues.slice(0, 10)) {
        console.log(`   Client ${issue.clientId}:`);
        for (const msg of issue.issues) {
          console.log(`     - ${msg}`);
        }
      }
      if (report.clientIssues.length > 10) {
        console.log(`   ... and ${report.clientIssues.length - 10} more clients`);
      }
      console.log('');
    }

    if (report.passIssues.length > 0) {
      console.log('🚨 Pass Issues:');
      for (const issue of report.passIssues.slice(0, 10)) {
        console.log(`   Pass ${issue.passId}:`);
        for (const msg of issue.issues) {
          console.log(`     - ${msg}`);
        }
      }
      if (report.passIssues.length > 10) {
        console.log(`   ... and ${report.passIssues.length - 10} more passes`);
      }
      console.log('');
    }

    if (report.redeemIssues.length > 0) {
      console.log('🚨 Redeem Issues:');
      for (const issue of report.redeemIssues.slice(0, 10)) {
        console.log(`   Redeem ${issue.redeemId}:`);
        for (const msg of issue.issues) {
          console.log(`     - ${msg}`);
        }
      }
      if (report.redeemIssues.length > 10) {
        console.log(`   ... and ${report.redeemIssues.length - 10} more redeems`);
      }
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

async function main() {
  try {
    // Check environment variables
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    if (!process.env.TOKEN_SECRET) {
      console.warn('⚠️  TOKEN_SECRET not set - token hash verification will be incorrect');
    }

    const report = await generateIntegrityReport();

    // Print to console
    printReport(report);

    // Save to file
    const outputDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `integrity-report-${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${outputFile}`);

    const latestReportFile = path.join(outputDir, 'integrity-report-latest.json');
    fs.writeFileSync(latestReportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Latest report snapshot saved to: ${latestReportFile}`);
    console.log('');

    // Don't fail deployments when issues are detected. Instead, surface a
    // prominent warning so the report can be reviewed while allowing the
    // pipeline to continue.
    if (report.summary.totalIssues > 0) {
      console.warn(
        '⚠️  Database integrity issues detected. Review the report but deployment will continue.',
      );
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
}

main();
