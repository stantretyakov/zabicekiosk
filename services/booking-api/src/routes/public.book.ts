import { FastifyInstance } from 'fastify';

export default async function publicBook(app: FastifyInstance) {
  app.post('/book', async () => {
    return { status: 'ok', message: 'not implemented' };
  });
}
