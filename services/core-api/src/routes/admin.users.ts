import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore';

export default async function adminUsers(app: FastifyInstance) {
  const db = getDb();

  app.post('/users', async req => {
    const schema = z.object({ uid: z.string(), email: z.string().email() });
    const data = schema.parse(req.body);
    await db.collection('admins').doc(data.uid).set({ email: data.email }, { merge: true });
    return { status: 'ok' };
  });
}
