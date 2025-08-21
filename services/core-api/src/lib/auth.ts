import { FastifyRequest } from 'fastify';

export async function verifyIdToken(token: string) {
  // TODO: verify Identity Platform token
  return { uid: 'demo', role: 'admin' } as const;
}

export async function requireAdmin(req: FastifyRequest) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    const err: any = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  const token = auth.slice(7);
  const user = await verifyIdToken(token);
  // TODO: role check later
  (req as any).user = user;
}
