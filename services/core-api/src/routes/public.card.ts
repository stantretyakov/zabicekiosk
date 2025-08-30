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
    const clientSnap = await db
      .collection('clients')
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (clientSnap.empty) {
      reply.code(404);
      return { status: 'error', message: 'Not found' };
    }

    const clientDoc = clientSnap.docs[0];
    const client = clientDoc.data() as any;

    const passSnap = await db
      .collection('passes')
      .where('clientId', '==', clientDoc.id)
      .get();

    let planSize = 1;
    let used = 0;
    let remaining = 1;
    let expiresAt = new Date().toISOString();

    const passes = passSnap.docs
      .filter(d => (d.data() as any).revoked !== true)
      .sort((a, b) => {
        const aTs = (a.data() as any).purchasedAt?.toMillis?.() || 0;
        const bTs = (b.data() as any).purchasedAt?.toMillis?.() || 0;
        return bTs - aTs;
      });

    if (passes.length > 0) {
      const p = passes[0].data() as any;
      const now = new Date();
      if (p.expiresAt.toDate() > now && p.used < p.planSize) {
        planSize = p.planSize;
        used = p.used;
        remaining = p.planSize - p.used;
        expiresAt = p.expiresAt.toDate().toISOString();
      }
    }

    return {
      name: client?.parentName || client?.childName || '',
      childName: client?.childName || '',
      planSize,
      used,
      remaining,
      expiresAt,
    };
  });
}
