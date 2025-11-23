import Fastify from 'fastify';

const server = Fastify({
  logger: true,
});

// Health check route
server.get('/health', async (_request, _reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    server.log.info(`Server listening on http://localhost:3001`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
