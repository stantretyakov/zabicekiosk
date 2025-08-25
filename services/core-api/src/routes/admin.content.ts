import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { FieldValue } from '@google-cloud/firestore';

function serializeContent(id: string, data: any) {
  return {
    id,
    title: data.title,
    message: data.message,
    type: data.type,
    priority: data.priority,
    active: data.active,
    targetAudience: data.targetAudience,
    createdAt: data.createdAt?.toDate?.().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString(),
    expiresAt: data.expiresAt?.toDate?.().toISOString(),
  };
}

export default async function adminContent(app: FastifyInstance) {
  const db = getDb();
  const contentSchema = z.object({
    title: z.string().trim().min(1),
    message: z.string().trim().optional(),
    type: z.string().trim().default('info'),
    priority: z.number().int().default(0),
    active: z.boolean().default(true),
    expiresAt: z.coerce.date().optional(),
    targetAudience: z.string().trim().optional(),
  });

  app.get('/content', { preHandler: requireAdmin }, async () => {
    const snap = await db.collection('promoContent').orderBy('priority', 'desc').get();
    const items = snap.docs.map(d => serializeContent(d.id, d.data()));
    return { items };
  });

  app.post('/content', { preHandler: requireAdmin }, async req => {
    const body = contentSchema.parse(req.body);
    const now = FieldValue.serverTimestamp();
    const data: any = {
      title: body.title,
      message: body.message,
      type: body.type,
      priority: body.priority,
      active: body.active,
      targetAudience: body.targetAudience,
      createdAt: now,
      updatedAt: now,
    };
    if (body.expiresAt) data.expiresAt = body.expiresAt;
    const ref = await db.collection('promoContent').add(data);
    const snap = await ref.get();
    return serializeContent(ref.id, snap.data()!);
  });

  app.patch<{ Params: { id: string } }>('/content/:id', { preHandler: requireAdmin }, async req => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = contentSchema.partial().parse(req.body);
    const update: any = { ...body, updatedAt: FieldValue.serverTimestamp() };
    if (body.expiresAt) update.expiresAt = body.expiresAt;
    const ref = db.collection('promoContent').doc(id);
    await ref.set(update, { merge: true });
    const snap = await ref.get();
    if (!snap.exists) {
      const err: any = new Error('Not Found');
      err.statusCode = 404;
      throw err;
    }
    return serializeContent(id, snap.data()!);
  });
}
