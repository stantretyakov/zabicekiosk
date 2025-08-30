import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { FieldValue } from '@google-cloud/firestore';

export default async function publicKiosk(app: FastifyInstance) {
  const db = getDb();
  app.post('/kiosks/register', async req => {
    const body = z
      .object({
        kioskId: z.string(),
        location: z.string().optional(),
        description: z.string().optional(),
        version: z.string().optional(),
      })
      .parse(req.body);

    const ref = db.collection('kiosks').doc(body.kioskId);
    const now = FieldValue.serverTimestamp();
    const data: any = { registeredAt: now, lastSeen: now };
    if (body.location) data.location = body.location;
    if (body.description) data.description = body.description;
    if (body.version) data.version = body.version;
    await ref.set(data, { merge: true });
    return { status: 'ok' };
  });
}
