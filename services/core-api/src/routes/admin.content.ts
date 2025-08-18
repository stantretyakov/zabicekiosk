import { FastifyInstance } from 'fastify';

export default async function adminContent(app: FastifyInstance) {
  app.get('/pages', async () => {
    return { items: [] };
  });
}
