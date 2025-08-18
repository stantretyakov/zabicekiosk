import { FastifyInstance } from 'fastify';

export default async function adminSchedule(app: FastifyInstance) {
  app.get('/schedule', async () => {
    return { items: [] };
  });
}
