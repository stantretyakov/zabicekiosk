import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';

export default async function adminSchedule(app: FastifyInstance) {
  const db = getDb();
  const scheduleSchema = z.record(z.any());

  app.get('/schedule', async () => {
    const snap = await db.collection('schedule').doc('global').get();
    return snap.exists ? snap.data() : {};
  });

  app.put('/schedule', async req => {
    const body = scheduleSchema.parse(req.body);
    await db.collection('schedule').doc('global').set(body, { merge: true });
    return { status: 'ok' };
  });
}
