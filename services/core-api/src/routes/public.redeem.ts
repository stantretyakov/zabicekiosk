import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate } from '../lib/validation.js';
import { redeem } from '../lib/business.js';

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
    const result = await redeem({ ...body, eventId: String(eventId ?? ''), ip });
    return result;
  });
}
