import { FastifyInstance } from 'fastify';

export default async function adminSettings(app: FastifyInstance) {
  app.get('/settings', async () => {
    return { bookingEnabled: false };
  });
}
