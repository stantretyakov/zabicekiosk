#!/usr/bin/env node
import crypto from 'crypto';
import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore
const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  databaseId: process.env.FIRESTORE_DATABASE_ID,
  ignoreUndefinedProperties: true,
});

// Token functions (copied from src/lib/tokens.ts)
function hashToken(token: string): string {
  const secret = process.env.TOKEN_SECRET || '';
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
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

async function repairSearchTokens(dryRun: boolean = false): Promise<number> {
  console.log('🔧 Repairing searchTokens for clients...');
  if (dryRun) {
    console.log('   (DRY RUN MODE - no changes will be made)');
  }
  console.log('');

  const clientsSnap = await db.collection('clients').get();
  console.log(`   Checking ${clientsSnap.size} clients...`);

  const batch = db.batch();
  let repairCount = 0;
  let batchCount = 0;

  for (const doc of clientsSnap.docs) {
    const data = doc.data();

    // Regenerate correct tokens
    const correctTokens = generateSearchTokens({
      parentName: data.parentName,
      childName: data.childName,
      phone: data.phone,
      telegram: data.telegram,
      instagram: data.instagram,
    });

    // Check if repair needed
    const storedTokens = Array.isArray(data.searchTokens) ? data.searchTokens : [];
    const needsRepair =
      storedTokens.length !== correctTokens.length ||
      correctTokens.some(t => !storedTokens.includes(t));

    if (needsRepair) {
      console.log(`   Repairing client ${doc.id}:`);
      console.log(`     - Old tokens: ${storedTokens.length}`);
      console.log(`     - New tokens: ${correctTokens.length}`);

      if (!dryRun) {
        batch.update(doc.ref, { searchTokens: correctTokens });
        batchCount++;
      }
      repairCount++;

      // Firestore batch has a limit of 500 operations
      if (batchCount >= 500) {
        console.log('   Committing batch...');
        await batch.commit();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0 && !dryRun) {
    console.log('   Committing final batch...');
    await batch.commit();
  }

  return repairCount;
}

async function repairFullNameLower(dryRun: boolean = false): Promise<number> {
  console.log('🔧 Repairing fullNameLower for clients...');
  if (dryRun) {
    console.log('   (DRY RUN MODE - no changes will be made)');
  }
  console.log('');

  const clientsSnap = await db.collection('clients').get();
  console.log(`   Checking ${clientsSnap.size} clients...`);

  const batch = db.batch();
  let repairCount = 0;
  let batchCount = 0;

  for (const doc of clientsSnap.docs) {
    const data = doc.data();

    if (!data.parentName || !data.childName) continue;

    const expectedFullNameLower = `${data.parentName} ${data.childName}`.toLowerCase();

    if (data.fullNameLower !== expectedFullNameLower) {
      console.log(`   Repairing client ${doc.id}:`);
      console.log(`     - Old: "${data.fullNameLower}"`);
      console.log(`     - New: "${expectedFullNameLower}"`);

      if (!dryRun) {
        batch.update(doc.ref, { fullNameLower: expectedFullNameLower });
        batchCount++;
      }
      repairCount++;

      // Firestore batch has a limit of 500 operations
      if (batchCount >= 500) {
        console.log('   Committing batch...');
        await batch.commit();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0 && !dryRun) {
    console.log('   Committing final batch...');
    await batch.commit();
  }

  return repairCount;
}

async function repairTokenHashes(dryRun: boolean = false): Promise<number> {
  console.log('🔧 Repairing token hashes for clients...');
  if (dryRun) {
    console.log('   (DRY RUN MODE - no changes will be made)');
  }
  console.log('');

  const clientsSnap = await db.collection('clients').get();
  console.log(`   Checking ${clientsSnap.size} clients...`);

  const batch = db.batch();
  let repairCount = 0;
  let batchCount = 0;

  for (const doc of clientsSnap.docs) {
    const data = doc.data();

    // Skip inactive clients (they don't need tokens)
    if (data.active === false) continue;

    if (!data.token) {
      console.log(`   ⚠️  Client ${doc.id} is missing token (cannot auto-repair)`);
      continue;
    }

    if (!data.tokenHash) {
      console.log(`   ⚠️  Client ${doc.id} is missing tokenHash (cannot auto-repair)`);
      continue;
    }

    const expectedHash = hashToken(data.token);
    if (data.tokenHash !== expectedHash) {
      console.log(`   Repairing client ${doc.id}:`);
      console.log(`     - Old hash: ${data.tokenHash}`);
      console.log(`     - New hash: ${expectedHash}`);

      if (!dryRun) {
        batch.update(doc.ref, { tokenHash: expectedHash });
        batchCount++;
      }
      repairCount++;

      // Firestore batch has a limit of 500 operations
      if (batchCount >= 500) {
        console.log('   Committing batch...');
        await batch.commit();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0 && !dryRun) {
    console.log('   Committing final batch...');
    await batch.commit();
  }

  return repairCount;
}

async function main() {
  try {
    // Check environment variables
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    if (!process.env.TOKEN_SECRET) {
      console.warn('⚠️  TOKEN_SECRET not set - token hash repair will be incorrect');
      console.warn('');
    }

    const dryRun = process.argv.includes('--dry-run');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    DATA INTEGRITY REPAIR');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
      console.log('   Remove --dry-run flag to apply repairs');
      console.log('');
    } else {
      console.log('⚠️  LIVE MODE - Changes will be applied to the database');
      console.log('');
    }

    // Run all repair operations
    const searchTokensRepaired = await repairSearchTokens(dryRun);
    console.log('');

    const fullNameLowerRepaired = await repairFullNameLower(dryRun);
    console.log('');

    const tokenHashesRepaired = await repairTokenHashes(dryRun);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                         SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    const totalRepaired = searchTokensRepaired + fullNameLowerRepaired + tokenHashesRepaired;

    if (totalRepaired === 0) {
      console.log('✅ All data is correct, no repairs needed');
    } else {
      console.log(`Repairs ${dryRun ? 'needed' : 'completed'}:`);
      console.log(`   - SearchTokens: ${searchTokensRepaired} clients`);
      console.log(`   - FullNameLower: ${fullNameLowerRepaired} clients`);
      console.log(`   - TokenHashes: ${tokenHashesRepaired} clients`);
      console.log(`   - Total: ${totalRepaired} repairs`);

      if (dryRun) {
        console.log('');
        console.log('🔄 Run again without --dry-run to apply repairs');
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during repair:', error);
    process.exit(1);
  }
}

main();
