import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate } from '../lib/validation.js';
import { redeem } from '../lib/business.js';
import { getDb } from '../lib/firestore.js';
import { FieldValue } from '@google-cloud/firestore';

const RedeemRequestSchema = z
  .object({
    token: z.string().optional(),
    clientId: z.string().optional(),
    kioskId: z.string(),
    ts: z.string(),
  })
  .refine(d => d.token || d.clientId, {
    message: 'token or clientId required',
    path: ['token'],
  });

export default async function publicRedeem(app: FastifyInstance) {
  app.post('/redeem', async (req) => {
    const body = validate(RedeemRequestSchema, req.body);
    const eventId = req.headers['idempotency-key'];
    const ip = req.ip;
    const db = getDb();
    const kioskRef = db.collection('kiosks').doc(body.kioskId);
    const kioskSnap = await kioskRef.get();
    if (!kioskSnap.exists) {
      return { status: 'error', code: 'KIOSK_NOT_REGISTERED', message: 'Kiosk not registered' };
    }
    await kioskRef.set({ lastSeen: FieldValue.serverTimestamp() }, { merge: true });
    const result = await redeem({ ...body, eventId: String(eventId ?? ''), ip });
    return result;
  });
}
