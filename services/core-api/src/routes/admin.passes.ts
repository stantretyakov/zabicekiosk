import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { generateToken, hashToken } from '../lib/tokens.js';
import { Timestamp, FieldValue } from '@google-cloud/firestore';

export default async function adminPasses(app: FastifyInstance) {
  const db = getDb();

  app.get('/passes', { preHandler: requireAdmin }, async req => {
    const qsSchema = z.object({
      pageSize: z.coerce.number().min(1).max(50).default(20),
      pageToken: z.string().optional(),
      clientId: z.string().optional(),
    });
    const { pageSize, pageToken, clientId } = qsSchema.parse(req.query);

    let query: FirebaseFirestore.Query = db.collection('passes').orderBy('purchasedAt', 'desc');
    if (clientId) query = query.where('clientId', '==', clientId);
    if (pageToken) {
      const snap = await db.collection('passes').doc(pageToken).get();
      if (snap.exists) query = query.startAfter(snap);
    }
    const snap = await query.limit(pageSize + 1).get();
    const docs = snap.docs;
    const items = await Promise.all(
      docs.slice(0, pageSize).map(async d => {
        const data = d.data() as any;
        const clientSnap = await db.collection('clients').doc(data.clientId).get();
        const c = clientSnap.data() || {};
        const item: any = {
          id: d.id,
          clientId: data.clientId,
          planSize: data.planSize,
          purchasedAt: data.purchasedAt?.toDate?.().toISOString(),
          remaining: data.planSize - data.used,
          type: data.planSize === 1 ? 'single' : 'subscription',
          lastVisit: data.lastRedeemTs?.toDate?.().toISOString(),
          client: {
            id: data.clientId,
            parentName: c.parentName,
            childName: c.childName,
            phone: c.phone,
            telegram: c.telegram,
            instagram: c.instagram,
            active: c.active,
            createdAt: c.createdAt?.toDate?.().toISOString(),
            updatedAt: c.updatedAt?.toDate?.().toISOString(),
          },
        };
        if (clientId) item.token = data.token;
        return item;
      })
    );
    let nextPageToken: string | undefined;
    if (docs.length > pageSize) {
      nextPageToken = docs[pageSize].id;
    }
    return { items, nextPageToken };
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
      token: rawToken,
      revoked: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { rawToken };
  });

  app.get<{ Params: { id: string } }>(
    '/passes/:id/token',
    { preHandler: requireAdmin },
    async req => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const snap = await db.collection('passes').doc(id).get();
      if (!snap.exists) {
        const err: any = new Error('Not Found');
        err.statusCode = 404;
        throw err;
      }
      const data = snap.data() as any;
      return { token: data.token };
    },
  );
}
