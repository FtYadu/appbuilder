import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

// Plugins
import errorHandler from './plugins/error-handler';
import validation from './plugins/validation';
import prisma from './plugins/prisma';

// Routes
import chatRoutes from './routes/chat.routes';
import taskRoutes from './routes/task.routes';
import calendarRoutes from './routes/calendar.routes';
import automationRoutes from './routes/automation.routes';
import mediaRoutes from './routes/media.routes';
import actionRoutes from './routes/action.routes';
import memoryRoutes from './routes/memory.routes';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

const start = async () => {
  try {
    // Register plugins
    await server.register(cors, {
      origin: process.env.CORS_ORIGIN || '*',
    });
    await server.register(sensible);
    await server.register(errorHandler);
    await server.register(validation);
    await server.register(prisma);

    // Health check route
    server.get('/health', async (_request, _reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // Register routes
    await server.register(chatRoutes);
    await server.register(taskRoutes);
    await server.register(calendarRoutes);
    await server.register(automationRoutes);
    await server.register(mediaRoutes);
    await server.register(actionRoutes);
    await server.register(memoryRoutes);

    const port = Number(process.env.PORT || 3001);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    server.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async () => {
  server.log.info('Shutting down gracefully...');
  await server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

export { server };
