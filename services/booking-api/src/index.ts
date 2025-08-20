import Fastify from 'fastify';
import cors from '@fastify/cors';

export async function buildServer() {
  const app = Fastify({ logger: true });
  const allowedOrigins = ['https://zabice-kiosk-web.web.app', 'https://zabice-admin-web.web.app'];
  await app.register(cors, { origin: allowedOrigins });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(import('./routes/public.sessions.js'), { prefix: '/v1' });
  await app.register(import('./routes/public.book.js'), { prefix: '/v1' });
  await app.register(import('./routes/admin.schedule.js'), { prefix: '/v1/admin' });
  await app.register(import('./routes/admin.bookings.js'), { prefix: '/v1/admin' });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer().then(app => {
    const port = Number(process.env.PORT) || 8081;
    app.listen({ port, host: '0.0.0.0' });
  });
}
