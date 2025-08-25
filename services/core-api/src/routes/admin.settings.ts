import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { FieldValue } from '@google-cloud/firestore';

export default async function adminSettings(app: FastifyInstance) {
  const db = getDb();
  const settingsSchema = z.record(z.any());

  app.get('/settings', { preHandler: requireAdmin }, async () => {
    const snap = await db.collection('settings').doc('global').get();
    return snap.exists ? snap.data() : {};
  });

  app.put('/settings', { preHandler: requireAdmin }, async req => {
    const body = settingsSchema.parse(req.body);
    await db
      .collection('settings')
      .doc('global')
      .set({ ...body, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const snap = await db.collection('settings').doc('global').get();
    return snap.data();
  });
}
