import { FastifyInstance } from 'fastify';

export default async function publicCard(app: FastifyInstance) {
  app.get('/card', async () => {
    return { status: 'ok', message: 'not implemented' };
  });
}
