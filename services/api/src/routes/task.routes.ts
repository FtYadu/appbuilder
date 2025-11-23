import { FastifyPluginAsync } from 'fastify';
import { CreateTaskSchema } from '../schemas';

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: unknown }>('/v1/tasks', async (request, reply) => {
    const taskData = request.validate(CreateTaskSchema, request.body);

    const task = await fastify.prisma.task.create({
      data: {
        projectId: taskData.project_id,
        due_at: new Date(taskData.due_at),
        status: taskData.status,
        source: taskData.source,
      },
    });

    return reply.status(201).send({
      id: task.id,
      project_id: task.projectId,
      due_at: task.due_at?.toISOString(),
      status: task.status,
      source: task.source,
      approvals: task.approvals,
    });
  });
};

export default taskRoutes;
