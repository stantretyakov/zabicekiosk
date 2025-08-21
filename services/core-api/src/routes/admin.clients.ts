import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { FieldValue } from '@google-cloud/firestore';
import type { Client, Paginated } from '../types.js';

function normalizePhone(p?: string) {
  if (!p) return undefined;
  const digits = p.replace(/\D/g, '');
  if (!digits) return undefined;
  return '+' + digits;
}

export default async function adminClients(app: FastifyInstance) {
  const db = getDb();

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
        let url = v.trim();
        if (url.startsWith('@')) {
          url = url.slice(1);
        }
        if (!/^https?:\/\//.test(url)) {
          url = `https://instagram.com/${url}`;
        }
        return url;
      })
      .refine(v => !v || /^https?:\/\/([^/]*\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/.test(v), {
        message: 'invalid instagram url',
      }),
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

    let query: FirebaseFirestore.Query = db.collection('clients');
    if (params.active !== 'all') {
      query = query.where('active', '==', params.active === 'true');
    }

    if (params.search) {
      const s = params.search.toLowerCase();
      query = query
        .orderBy('fullNameLower')
        .startAt(s)
        .endAt(s + '\uf8ff');
    } else {
      query = query.orderBy(
        params.orderBy === 'parentName' ? 'parentName' : 'createdAt',
        params.order,
      );
    }

    if (params.pageToken) {
      const snap = await db.collection('clients').doc(params.pageToken).get();
      if (snap.exists) {
        query = query.startAfter(snap);
      }
    }

    const snap = await query.limit(params.pageSize + 1).get();
    const docs = snap.docs;
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
    const data = {
      parentName: body.parentName.trim(),
      childName: body.childName.trim(),
      phone: body.phone,
      telegram: body.telegram,
      instagram: body.instagram,
      active: true,
      fullNameLower: `${body.parentName} ${body.childName}`.toLowerCase(),
      createdAt: now,
      updatedAt: now,
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
    update.fullNameLower = `${parent} ${child}`.toLowerCase();
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
      { active: false, archivedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return { status: 'ok' };
  });
}
