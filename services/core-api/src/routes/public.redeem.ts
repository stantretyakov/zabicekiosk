import { FastifyInstance } from 'fastify';

export default async function publicRedeem(app: FastifyInstance) {
  app.post('/redeem', async () => {
    return { status: 'ok', message: 'not implemented' };
  });
}
