import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';

export default async function adminRedeems(app: FastifyInstance) {
  const db = getDb();

  app.get('/redeems', { preHandler: requireAdmin }, async req => {
    const qsSchema = z.object({
      pageSize: z.coerce.number().min(1).max(50).default(20),
      pageToken: z.string().optional(),
    });
    const { pageSize, pageToken } = qsSchema.parse(req.query);

    let query: FirebaseFirestore.Query = db
      .collection('redeems')
      .orderBy('ts', 'desc');
    if (pageToken) {
      const snap = await db.collection('redeems').doc(pageToken).get();
      if (snap.exists) query = query.startAfter(snap);
    }
    const snap = await query.limit(pageSize + 1).get();
    const docs = snap.docs;
    const items = docs.slice(0, pageSize).map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        ts: data.ts?.toDate?.().toISOString(),
        kind: data.kind,
        clientId: data.clientId,
        delta: data.delta,
        priceRSD: data.priceRSD,
      };
    });
    let nextPageToken: string | undefined;
    if (docs.length > pageSize) {
      nextPageToken = docs[pageSize].id;
    }
    return { items, nextPageToken };
  });
}

