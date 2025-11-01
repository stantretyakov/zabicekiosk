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
    const items = await Promise.all(
      docs.slice(0, pageSize).map(async d => {
        const data = d.data() as any;
        let client: any;
        if (data.clientId) {
          const clientSnap = await db.collection('clients').doc(data.clientId).get();
          const c = clientSnap.data();
          if (c) {
            client = {
              id: data.clientId,
              parentName: c.parentName,
              childName: c.childName,
              phone: c.phone,
              telegram: c.telegram,
              instagram: c.instagram,
              active: c.active,
              createdAt: c.createdAt?.toDate?.().toISOString(),
              updatedAt: c.updatedAt?.toDate?.().toISOString(),
            };
          }
        }
        return {
          id: d.id,
          ts: data.ts?.toDate?.().toISOString(),
          kind: data.kind,
          clientId: data.clientId,
          delta: data.delta,
          priceRSD: data.priceRSD,
          note: data.note,
          client,
        };
      })
    );
    let nextPageToken: string | undefined;
    if (docs.length > pageSize) {
      nextPageToken = docs[pageSize].id;
    }
    return { items, nextPageToken };
  });
}

