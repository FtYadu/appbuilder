import Fastify from 'fastify';
import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import { Langfuse } from 'langfuse';
import { calendarTool } from './tools/calendar';
import { tasksTool } from './tools/tasks';
import { emailTool } from './tools/email';

const server = Fastify({
  logger: true,
});

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
});

const assistant = new Agent({
  name: 'Synapsy Assistant',
  description: 'A personal assistant that can manage tasks, calendars, and emails.',
  tools: [calendarTool, tasksTool, emailTool],
  instructions: 'You are a helpful assistant. Use the available tools to fulfill the user\'s request.',
});

server.post('/agent', async (request, reply) => {
  const { message } = request.body as { message: string };

  if (!message) {
    reply.status(400).send({ error: 'Message is required' });
    return;
  }

  const trace = langfuse.trace({
    name: 'agent-request',
    input: { message },
  });

  try {
    const response = await run({
      agent: assistant,
      messages: [{ role: 'user', content: message }],
    });

    trace.update({
      output: response,
    });

    reply.send(response);
  } catch (error) {
    trace.update({
      level: 'ERROR',
      output: { error: error.message },
    });
    server.log.error(error);
    reply.status(500).send({ error: 'Agent failed to process the request' });
  }
});

const start = async () => {
  try {
    await server.listen({ port: 3002, host: '0.0.0.0' });
    server.log.info(`Agent service listening on http://localhost:3002`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();