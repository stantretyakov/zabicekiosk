import { FastifyInstance } from 'fastify';

export default async function publicSessions(app: FastifyInstance) {
  app.get('/sessions', async () => {
    return { items: [] };
  });
}
