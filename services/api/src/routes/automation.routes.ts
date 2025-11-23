import { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import { CreateAutomationSchema } from '../schemas';

const automationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: unknown }>('/v1/automations', async (request, reply) => {
    const automationData = request.validate(CreateAutomationSchema, request.body);

    const automation = await fastify.prisma.automation.create({
      data: {
        triggers: automationData.triggers as Prisma.InputJsonValue,
        actions: automationData.actions as Prisma.InputJsonValue,
        policy: (automationData.policy || {}) as Prisma.InputJsonValue,
        enabled: automationData.enabled,
      },
    });

    return reply.status(201).send({
      id: automation.id,
      triggers: automation.triggers,
      actions: automation.actions,
      policy: automation.policy,
      enabled: automation.enabled,
    });
  });
};

export default automationRoutes;
