import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { generateToken, hashToken } from '../lib/tokens.js';
import { Timestamp, FieldValue } from '@google-cloud/firestore';

export default async function adminPasses(app: FastifyInstance) {
  const db = getDb();

  app.get('/passes', { preHandler: requireAdmin }, async () => {
    return { items: [] };
  });

  app.post('/passes', { preHandler: requireAdmin }, async req => {
    const bodySchema = z.object({
      clientId: z.string(),
      planSize: z.coerce.number().min(1),
      purchasedAt: z.string().datetime(),
    });
    const body = bodySchema.parse(req.body);

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    const purchasedAt = Timestamp.fromDate(new Date(body.purchasedAt));
    const expiresAt = Timestamp.fromDate(
      new Date(purchasedAt.toDate().getTime() + 30 * 24 * 60 * 60 * 1000)
    );

    await db.collection('passes').add({
      clientId: body.clientId,
      planSize: body.planSize,
      used: 0,
      purchasedAt,
      expiresAt,
      tokenHash,
      revoked: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { rawToken };
  });
}
