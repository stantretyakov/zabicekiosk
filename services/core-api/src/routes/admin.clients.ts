import { FastifyInstance } from 'fastify';

export default async function adminClients(app: FastifyInstance) {
  app.get('/clients', async () => {
    return { items: [] };
  });
}
