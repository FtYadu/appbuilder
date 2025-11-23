import { FastifyPluginAsync } from 'fastify';
import { SendActionSchema } from '../schemas';

const actionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: unknown }>('/v1/actions/send', async (request, reply) => {
    const actionData = request.validate(SendActionSchema, request.body);

    // In a real implementation, this would:
    // 1. Create an approval request if needed
    // 2. Queue the action for execution
    // 3. Send to appropriate channel

    const actionId = `action_${Date.now()}`;
    const createdAt = new Date().toISOString();

    // For now, we'll mark actions as pending approval
    const action = {
      action_id: actionId,
      status: 'pending_approval' as const,
      action_type: actionData.action_type,
      created_at: createdAt,
    };

    fastify.log.info({ actionId, actionType: actionData.action_type }, 'Action queued');

    return reply.status(202).send(action);
  });
};

export default actionRoutes;
