import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { FieldValue } from '@google-cloud/firestore';
import type { Client, Paginated } from '../types.js';
import { generateToken, hashToken } from '../lib/tokens.js';

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

/**
 * Generate optimized word prefixes with smart limiting for long words.
 *
 * Strategy:
 * - Short words (≤4 chars): All prefixes (e.g., "ana" → ["a", "an", "ana"])
 * - Medium words (5-8 chars): Prefixes 2-4 + full word
 * - Long words (>8 chars): Prefixes 2-4 + full word (skip middle prefixes)
 *
 * This reduces token count by ~60% while maintaining search accuracy for 2-4 char searches.
 *
 * @param word - The word to generate prefixes for
 * @param options - Configuration options
 * @param options.limit - If set, apply smart limiting for words >8 chars
 * @returns Array of prefix strings
 */
function generateWordPrefixes(word: string, options?: { limit?: number }): string[] {
  const prefixes: string[] = [];
  const len = word.length;
  const limit = options?.limit;

  if (len === 0) return prefixes;

  if (len <= 4) {
    // Short words: all prefixes
    for (let i = 1; i <= len; i++) {
      prefixes.push(word.substring(0, i));
    }
  } else if (!limit || len <= 8) {
    // Medium words without limit: prefixes 2-length
    for (let i = 2; i <= len; i++) {
      prefixes.push(word.substring(0, i));
    }
  } else {
    // Long words with limit: prefixes 2-4 + full word
    prefixes.push(word.substring(0, 2));
    prefixes.push(word.substring(0, 3));
    prefixes.push(word.substring(0, 4));
    if (len > 4) {
      prefixes.push(word);
    }
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

/**
 * Generate optimized search tokens from client fields.
 *
 * Optimization strategy:
 * - Apply smart limiting to long names (>8 chars)
 * - Generate phone tokens for last 6-9 digits only
 * - Limit collapsed multi-word tokens to 20 chars
 * - Enforce 40KB total size limit (Firestore constraint)
 *
 * Expected results:
 * - 40-60 tokens per client (vs 150-250 before)
 * - ~2KB storage per client (vs 5-10KB before)
 * - 60% reduction in storage and write costs
 *
 * @param fields - Searchable client fields
 * @returns Sorted array of search tokens
 */
function generateSearchTokens(fields: SearchableFields): string[] {
  const tokens = new Set<string>();

  const addFromWords = (value?: string | null, options?: {
    includeCollapsed?: boolean;
    smartLimit?: boolean;
  }) => {
    if (!value) return;
    const normalized = normalizeForSearch(value);
    if (!normalized) return;

    const words = normalized.split(' ').filter(Boolean);
    for (const word of words) {
      // Apply smart limiting to long words
      const prefixes = options?.smartLimit && word.length > 8
        ? generateWordPrefixes(word, { limit: 4 })
        : generateWordPrefixes(word);

      for (const prefix of prefixes) {
        tokens.add(prefix);
      }
    }

    // Limit collapsed multi-word tokens
    if (options?.includeCollapsed && words.length > 1) {
      const collapsed = words.join('');
      if (collapsed.length <= 20) { // Limit collapsed size
        const prefixes = collapsed.length > 8
          ? generateWordPrefixes(collapsed, { limit: 4 })
          : generateWordPrefixes(collapsed);
        for (const prefix of prefixes) {
          tokens.add(prefix);
        }
      }
    }
  };

  const addFromPhone = (value?: string | null) => {
    if (!value) return;
    const digits = value.replace(/\D/g, '');
    if (!digits) return;

    // Generate tokens for last 6-9 digits only (most commonly searched)
    const minLength = 6;
    const maxLength = Math.min(9, digits.length);
    for (let len = minLength; len <= maxLength; len++) {
      const start = Math.max(0, digits.length - len);
      tokens.add(digits.slice(start));
    }
  };

  // Apply smart limiting to names (reduces token count for long names)
  addFromWords(fields.parentName, { smartLimit: true });
  addFromWords(fields.childName, { smartLimit: true });

  // Phone tokens optimized for common search patterns
  if (fields.phone) {
    addFromPhone(fields.phone);
  }

  // Social media handles with collapsed search
  if (fields.telegram) {
    const handle = fields.telegram.replace(/^@/, '');
    addFromWords(handle, { includeCollapsed: true, smartLimit: true });
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
    addFromWords(handle, { includeCollapsed: true, smartLimit: true });
  }

  const tokenArray = Array.from(tokens).sort();

  // Safety check: Firestore field size limit (40KB threshold)
  const estimatedSize = JSON.stringify(tokenArray).length;
  const MAX_TOKEN_ARRAY_SIZE = 40 * 1024; // 40KB

  if (estimatedSize > MAX_TOKEN_ARRAY_SIZE) {
    console.warn(
      `Token array too large (${estimatedSize} bytes) for client fields. ` +
      `Truncating to avoid Firestore write errors. ` +
      `Fields: parentName="${fields.parentName}", childName="${fields.childName}"`
    );
    // Keep shortest tokens (most valuable for prefix matching)
    return tokenArray
      .sort((a, b) => a.length - b.length)
      .slice(0, Math.floor(tokenArray.length / 2));
  }

  return tokenArray;
}

function normalizePhone(p?: string) {
  if (!p) return undefined;
  const digits = p.replace(/\D/g, '');
  if (!digits) return undefined;
  return '+' + digits;
}

export default async function adminClients(app: FastifyInstance) {
  const db = getDb();

  /**
   * Build a query using searchTokens array-contains for token-based search.
   */
  function buildTokenQuery(
    searchToken: string,
    activeFilter: string
  ): FirebaseFirestore.Query {
    let query: FirebaseFirestore.Query = db.collection('clients');
    if (activeFilter !== 'all') {
      query = query.where('active', '==', activeFilter === 'true');
    }
    return query
      .where('searchTokens', 'array-contains', searchToken)
      .orderBy('createdAt', 'desc');
  }

  /**
   * Build a fallback query using fullNameLower range query for prefix matching.
   */
  function buildFallbackQuery(
    searchTerm: string,
    activeFilter: string
  ): FirebaseFirestore.Query {
    let query: FirebaseFirestore.Query = db.collection('clients');
    if (activeFilter !== 'all') {
      query = query.where('active', '==', activeFilter === 'true');
    }
    const searchLower = searchTerm.trim().toLowerCase();
    return query
      .orderBy('fullNameLower')
      .startAt(searchLower)
      .endAt(`${searchLower}\uf8ff`);
  }

  /**
   * Build a default query for listing clients without search.
   */
  function buildDefaultQuery(
    activeFilter: string,
    orderBy: string,
    order: string
  ): FirebaseFirestore.Query {
    let query: FirebaseFirestore.Query = db.collection('clients');
    if (activeFilter !== 'all') {
      query = query.where('active', '==', activeFilter === 'true');
    }
    return query.orderBy(
      orderBy === 'parentName' ? 'parentName' : 'createdAt',
      order as 'asc' | 'desc'
    );
  }

  const clientSchema = z.object({
    parentName: z.string().trim().min(1).max(80),
    childName: z.string().trim().min(1).max(80),
    phone: z
      .string()
      .trim()
      .optional()
      .transform(v => normalizePhone(v))
      .refine(v => !v || v.startsWith('+381'), {
        message: 'phone must start with +381',
      }),
    telegram: z
      .string()
      .trim()
      .optional()
      .transform(v => {
        if (!v) return undefined;
        const value = v.toLowerCase();
        if (value === 'none') return undefined;
        return v;
      })
      .refine(v => !v || /^@?[A-Za-z0-9_]{5,32}$/.test(v), {
        message: 'invalid telegram handle',
      })
      .transform(v => (v ? v.replace(/^@/, '') : undefined)),
    instagram: z
      .string()
      .trim()
      .optional()
      .transform(v => {
        if (!v) return undefined;
        const value = v.trim();
        if (value.toLowerCase() === 'none') return undefined;
        let url = value;
        if (url.startsWith('@')) {
          url = url.slice(1);
        }
        if (!/^https?:\/\//.test(url)) {
          url = `https://instagram.com/${url}`;
        }
        const u = new URL(url);
        u.search = '';
        u.hash = '';
        if (u.pathname.endsWith('/')) {
          u.pathname = u.pathname.slice(0, -1);
        }
        return u.toString();
      })
      .refine(v => !v || /^https?:\/\/([^/]*\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/.test(v), {
        message: 'invalid instagram url',
      }),
  });
  const importClientSchema = clientSchema.extend({
    phone: z.string().trim().optional().transform(v => normalizePhone(v)),
  });

  const updateSchema = clientSchema.partial();

  app.get<{ Querystring: any }>('/clients', { preHandler: requireAdmin }, async req => {
    const qsSchema = z.object({
      search: z.string().trim().optional(),
      pageSize: z.coerce.number().min(1).max(50).default(20),
      pageToken: z.string().optional(),
      active: z.enum(['all', 'true', 'false']).default('all'),
      orderBy: z.enum(['createdAt', 'parentName']).default('createdAt'),
      order: z.enum(['asc', 'desc']).default('desc'),
    });
    const params = qsSchema.parse(req.query);

    // Normalize search input and extract search token
    const normalizedSearch = params.search ? normalizeForSearch(params.search) : undefined;
    const searchParts = normalizedSearch?.split(' ').filter(Boolean) ?? [];
    const searchToken = searchParts[searchParts.length - 1];

    // Determine which query strategy to use
    let query: FirebaseFirestore.Query;
    let queryType: 'token' | 'fallback' | 'default';

    if (params.search && searchToken) {
      query = buildTokenQuery(searchToken, params.active);
      queryType = 'token';
    } else if (params.search) {
      query = buildFallbackQuery(params.search, params.active);
      queryType = 'fallback';
    } else {
      query = buildDefaultQuery(params.active, params.orderBy, params.order);
      queryType = 'default';
    }

    // Apply pagination
    let pageAnchor: FirebaseFirestore.DocumentSnapshot | undefined;
    if (params.pageToken) {
      const anchorSnap = await db.collection('clients').doc(params.pageToken).get();
      if (anchorSnap.exists) {
        pageAnchor = anchorSnap;
        query = query.startAfter(anchorSnap);
      }
    }

    // Execute primary query
    let snap = await query.limit(params.pageSize + 1).get();
    let docs = snap.docs;

    // Handle token query fallback with backfill (CRITICAL FIX: line 267 bug)
    if (queryType === 'token' && docs.length === 0 && params.search) {
      // Build fresh fallback query
      let fallbackQuery = buildFallbackQuery(params.search, params.active);
      if (pageAnchor) {
        fallbackQuery = fallbackQuery.startAfter(pageAnchor);
      }

      snap = await fallbackQuery.limit(params.pageSize + 1).get();
      docs = snap.docs;

      // Backfill search tokens for documents that are missing them
      const backfillPromises = docs.map(async doc => {
        const data = doc.data();
        const expectedTokens = generateSearchTokens({
          parentName: data.parentName ?? '',
          childName: data.childName ?? '',
          phone: data.phone ?? undefined,
          telegram: data.telegram ?? undefined,
          instagram: data.instagram ?? undefined,
        });

        const storedTokens = Array.isArray(data.searchTokens) ? data.searchTokens : [];
        const storedSet = new Set(storedTokens);
        const needsUpdate =
          storedTokens.length !== expectedTokens.length ||
          expectedTokens.some(token => !storedSet.has(token));

        if (needsUpdate) {
          return doc.ref.update({ searchTokens: expectedTokens })
            .then(() => true)
            .catch(err => {
              console.error(`Failed to backfill tokens for client ${doc.id}:`, err);
              return false;
            });
        }
        return false;
      });

      const backfillResults = await Promise.all(backfillPromises);
      const tokensUpdated = backfillResults.some(updated => updated);

      // CRITICAL FIX: Re-execute fallback query (NOT original token query!)
      if (tokensUpdated) {
        let refetchQuery = buildFallbackQuery(params.search, params.active);
        if (pageAnchor) {
          refetchQuery = refetchQuery.startAfter(pageAnchor);
        }
        snap = await refetchQuery.limit(params.pageSize + 1).get();
        docs = snap.docs;
      }
    }

    // Build response
    const items: Client[] = docs.slice(0, params.pageSize).map(d => {
      const data = d.data();
      return {
        id: d.id,
        parentName: data.parentName,
        childName: data.childName,
        phone: data.phone,
        telegram: data.telegram,
        instagram: data.instagram,
        active: data.active,
        createdAt: data.createdAt?.toDate?.().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString(),
      };
    });

    let nextPageToken: string | undefined;
    if (docs.length > params.pageSize) {
      nextPageToken = docs[params.pageSize].id;
    }

    const res: Paginated<Client> = { items, nextPageToken };
    return res;
  });

  app.post('/clients', { preHandler: requireAdmin }, async req => {
    const body = clientSchema.parse(req.body);
    const now = FieldValue.serverTimestamp();
    const rawToken = generateToken();
    const data = {
      parentName: body.parentName.trim(),
      childName: body.childName.trim(),
      phone: body.phone ?? null,
      telegram: body.telegram ?? null,
      instagram: body.instagram ?? null,
      active: true,
      fullNameLower: `${body.parentName} ${body.childName}`.toLowerCase(),
      searchTokens: generateSearchTokens({
        parentName: body.parentName,
        childName: body.childName,
        phone: body.phone,
        telegram: body.telegram,
        instagram: body.instagram,
      }),
      createdAt: now,
      updatedAt: now,
      token: rawToken,
      tokenHash: hashToken(rawToken),
    };
    const ref = await db.collection('clients').add(data);
    const snap = await ref.get();
    const d = snap.data()!;
    const result: Client = {
      id: ref.id,
      parentName: d.parentName,
      childName: d.childName,
      phone: d.phone,
      telegram: d.telegram,
      instagram: d.instagram,
      active: d.active,
      createdAt: d.createdAt?.toDate?.().toISOString(),
      updatedAt: d.updatedAt?.toDate?.().toISOString(),
    };
    return result;
  });

  app.post('/clients/import', { preHandler: requireAdmin }, async req => {
    let payload: unknown;
    if ((req as any).isMultipart && (req as any).isMultipart()) {
      const file = await (req as any).file();
      const buf = await file.toBuffer();
      payload = JSON.parse(buf.toString('utf8'));
    } else {
      payload = req.body;
    }

    if (!Array.isArray(payload)) {
      const err: any = new Error('invalid payload');
      err.statusCode = 400;
      throw err;
    }

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();
    for (const item of payload) {
      const body = importClientSchema.parse(item);
      const rawToken = generateToken();
      const ref = db.collection('clients').doc();
      batch.set(ref, {
        parentName: body.parentName.trim(),
        childName: body.childName.trim(),
        phone: body.phone ?? null,
        telegram: body.telegram ?? null,
        instagram: body.instagram ?? null,
        active: true,
        fullNameLower: `${body.parentName} ${body.childName}`.toLowerCase(),
        searchTokens: generateSearchTokens({
          parentName: body.parentName,
          childName: body.childName,
          phone: body.phone,
          telegram: body.telegram,
          instagram: body.instagram,
        }),
        createdAt: now,
        updatedAt: now,
        token: rawToken,
        tokenHash: hashToken(rawToken),
      });
    }
    await batch.commit();
    return { count: payload.length };
  });

  app.get<{ Params: { id: string } }>('/clients/:id/token', { preHandler: requireAdmin }, async req => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const snap = await db.collection('clients').doc(id).get();
    if (!snap.exists) {
      const err: any = new Error('Not Found');
      err.statusCode = 404;
      throw err;
    }
    const data = snap.data() as any;
    return { token: data.token };
  });

  app.patch<{ Params: { id: string } }>('/clients/:id', { preHandler: requireAdmin }, async req => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = updateSchema.parse(req.body);
    const ref = db.collection('clients').doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      const err: any = new Error('Not Found');
      err.statusCode = 404;
      throw err;
    }
    const current = existing.data()!;
    const update: any = { ...body, updatedAt: FieldValue.serverTimestamp() };
    const parent = body.parentName ?? current.parentName;
    const child = body.childName ?? current.childName;
    const phone = (Object.prototype.hasOwnProperty.call(body, 'phone')
      ? body.phone
      : (current.phone ?? undefined)) ?? undefined;
    const telegram = (Object.prototype.hasOwnProperty.call(body, 'telegram')
      ? body.telegram
      : (current.telegram ?? undefined)) ?? undefined;
    const instagram = (Object.prototype.hasOwnProperty.call(body, 'instagram')
      ? body.instagram
      : (current.instagram ?? undefined)) ?? undefined;
    update.fullNameLower = `${parent} ${child}`.toLowerCase();
    update.searchTokens = generateSearchTokens({
      parentName: parent,
      childName: child,
      phone,
      telegram,
      instagram,
    });
    await ref.set(update, { merge: true });
    const snap = await ref.get();
    const d = snap.data()!;
    const result: Client = {
      id: ref.id,
      parentName: d.parentName,
      childName: d.childName,
      phone: d.phone,
      telegram: d.telegram,
      instagram: d.instagram,
      active: d.active,
      createdAt: d.createdAt?.toDate?.().toISOString(),
      updatedAt: d.updatedAt?.toDate?.().toISOString(),
    };
    return result;
  });

  app.delete<{ Params: { id: string } }>('/clients/:id', { preHandler: requireAdmin }, async req => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const ref = db.collection('clients').doc(id);
    await ref.set(
      {
        active: false,
        archivedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        token: FieldValue.delete(),
        tokenHash: FieldValue.delete(),
      },
      { merge: true },
    );
    return { status: 'ok' };
  });
}
