import { FastifyInstance } from 'fastify';

export default async function adminPasses(app: FastifyInstance) {
  app.get('/passes', async () => {
    return { items: [] };
  });
}
