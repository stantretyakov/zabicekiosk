import { FastifyInstance } from 'fastify';
import { getDb } from '../lib/firestore.js';

export default async function publicContent(app: FastifyInstance) {
  const db = getDb();
  app.get('/content/active', async () => {
    const snap = await db.collection('promoContent').where('active', '==', true).get();
    const now = Date.now();
    const items = snap.docs
      .map(d => {
        const data = d.data();
        const expires = data.expiresAt?.toDate?.().getTime();
        if (expires && expires < now) return null;
        return {
          id: d.id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          targetAudience: data.targetAudience,
          expiresAt: data.expiresAt?.toDate?.().toISOString(),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
    return { items };
  });
}
