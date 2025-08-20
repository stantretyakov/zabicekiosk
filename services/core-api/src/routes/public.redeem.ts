import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate } from '../lib/validation.js';
import { redeem } from '../lib/business.js';

const RedeemRequestSchema = z.object({
  token: z.string(),
  kioskId: z.string(),
  ts: z.string(),
});

export default async function publicRedeem(app: FastifyInstance) {
  app.post('/redeem', async (req) => {
    const body = validate(RedeemRequestSchema, req.body);
    const eventId = req.headers['idempotency-key'];
    const ip = req.ip;
    const result = await redeem({ ...body, eventId: String(eventId ?? ''), ip });
    return result;
  });
}
