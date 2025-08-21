import Fastify from 'fastify';
import cors from '@fastify/cors';

export async function buildServer() {
  const app = Fastify({ logger: true });
  const allowedOrigins = ['https://zabice-kiosk-web.web.app', 'https://zabice-admin-web.web.app'];
  await app.register(cors, { origin: allowedOrigins });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(import('./routes/public.card.js'), { prefix: '/v1' });
  await app.register(import('./routes/public.redeem.js'), { prefix: '/v1' });

  const adminClients = (await import('./routes/admin.clients.js')).default;
  const adminPasses = (await import('./routes/admin.passes.js')).default;
  const adminSettings = (await import('./routes/admin.settings.js')).default;
  const adminContent = (await import('./routes/admin.content.js')).default;
  const adminUsers = (await import('./routes/admin.users.js')).default;

  await app.register(adminClients, { prefix: '/v1/admin' });
  await app.register(adminClients, { prefix: '/api/v1/admin' });

  await app.register(adminPasses, { prefix: '/v1/admin' });
  await app.register(adminPasses, { prefix: '/api/v1/admin' });

  await app.register(adminSettings, { prefix: '/v1/admin' });
  await app.register(adminSettings, { prefix: '/api/v1/admin' });

  await app.register(adminContent, { prefix: '/v1/admin' });
  await app.register(adminContent, { prefix: '/api/v1/admin' });

  await app.register(adminUsers, { prefix: '/v1/admin' });
  await app.register(adminUsers, { prefix: '/api/v1/admin' });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer().then(app => {
    const port = Number(process.env.PORT) || 8080;
    app.listen({ port, host: '0.0.0.0' });
  });
}
