import { FastifyInstance } from 'fastify';

export default async function adminBookings(app: FastifyInstance) {
  app.get('/bookings', async () => {
    return { items: [] };
  });
}
