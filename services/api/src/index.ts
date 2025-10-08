import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { z } from 'zod';

const server = Fastify({
  logger: true,
});

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check route
server.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const memorySearchSchema = z.object({
  q: z.string(),
});

// Memory search route
server.get('/v1/memory/search', async (request, reply) => {
  try {
    const { q } = memorySearchSchema.parse(request.query);

    // 1. Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: q,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // 2. Perform vector search in the database
    const results = await prisma.$queryRaw`
      SELECT
        id,
        entity_ref,
        provenance,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM "MemoryChunk"
      ORDER BY similarity DESC
      LIMIT 5;
    `;

    return results;
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.status(400).send({ error: 'Invalid query parameter', details: error.errors });
    } else {
      server.log.error(error);
      reply.status(500).send({ error: 'Failed to perform memory search' });
    }
  }
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