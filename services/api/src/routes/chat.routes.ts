import { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import { ChatWebhookSchema, MessageEnvelopeSchema } from '../schemas';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Params: { channel: string };
    Body: unknown;
  }>('/v1/chat/:channel', async (request, reply) => {
    const { channel } = request.params;

    // Validate webhook payload
    const webhook = request.validate(ChatWebhookSchema, { body: request.body });

    // Normalize webhook into message envelope
    // In a real implementation, this would use channel-specific normalizers
    const envelope = request.validate(MessageEnvelopeSchema, {
      channel,
      direction: 'inbound',
      content: JSON.stringify(webhook.body),
      attachments: [],
      meta: { raw_webhook: webhook.body },
    });

    // Store message in database
    const message = await fastify.prisma.message.create({
      data: {
        channel: envelope.channel,
        direction: envelope.direction,
        content: envelope.content,
        attachments: (envelope.attachments || []) as Prisma.InputJsonValue,
        meta: (envelope.meta || {}) as Prisma.InputJsonValue,
      },
    });

    return reply.status(201).send({
      message_id: message.id,
      status: 'received',
    });
  });
};

export default chatRoutes;
