import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { FieldValue } from '@google-cloud/firestore';

export default async function publicKiosk(app: FastifyInstance) {
  const db = getDb();
  app.post('/kiosks/register', async req => {
    const { kioskId } = z.object({ kioskId: z.string() }).parse(req.body);
    const ref = db.collection('kiosks').doc(kioskId);
    const now = FieldValue.serverTimestamp();
    await ref.set({ registeredAt: now, lastSeen: now }, { merge: true });
    return { status: 'ok' };
  });
}
