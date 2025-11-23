import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { ZodSchema } from 'zod';

declare module 'fastify' {
  interface FastifyRequest {
    validate<T>(schema: ZodSchema<T>, data: unknown): T;
  }
}

const validationPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('validate', function <T>(schema: ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      const error = fastify.httpErrors.badRequest('Validation failed');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).validation = result.error.errors;
      throw error;
    }
    return result.data;
  });
};

export default fp(validationPlugin, {
  name: 'validation-plugin',
});
