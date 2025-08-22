import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { hashToken } from '../lib/tokens.js';

export default async function publicCard(app: FastifyInstance) {
  const db = getDb();

  app.get('/card', async (req, reply) => {
    const qsSchema = z.object({ token: z.string() });
    const { token } = qsSchema.parse(req.query);

    const tokenHash = hashToken(token);
    const snap = await db
      .collection('passes')
      .where('tokenHash', '==', tokenHash)
      .where('revoked', '==', false)
      .limit(1)
      .get();

    if (snap.empty) {
      reply.code(404);
      return { status: 'error', message: 'Not found' };
    }

    const pass = snap.docs[0].data() as any;
    const clientSnap = await db.collection('clients').doc(pass.clientId).get();
    const client = clientSnap.data() as any;

    return {
      name: client?.childName || client?.parentName || '',
      planSize: pass.planSize,
      used: pass.used,
      remaining: pass.planSize - pass.used,
      expiresAt: pass.expiresAt.toDate().toISOString(),
    };
  });
}
