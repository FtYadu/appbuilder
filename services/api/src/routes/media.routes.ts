import { FastifyPluginAsync } from 'fastify';
import { MediaIngestSchema, MediaProcessRequestSchema } from '../schemas';

const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /v1/media/ingest - Request presigned URL and register asset
  fastify.post<{ Body: unknown }>('/v1/media/ingest', async (request, reply) => {
    const ingestData = request.validate(MediaIngestSchema, request.body);

    // Generate presigned URL (mocked - would use S3/MinIO client)
    const assetId = `media_${Date.now()}`;
    const uploadUrl = `https://storage.example.com/upload/${assetId}?filename=${encodeURIComponent(
      ingestData.filename
    )}`;
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    // Register media asset
    await fastify.prisma.mediaAsset.create({
      data: {
        id: assetId,
        uri: uploadUrl,
        checksum: 'pending',
        tags: { content_type: ingestData.content_type, filename: ingestData.filename },
      },
    });

    return reply.status(201).send({
      id: assetId,
      upload_url: uploadUrl,
      expires_at: expiresAt,
    });
  });

  // POST /v1/media/:id/process - Enqueue processing pipeline
  fastify.post<{
    Params: { id: string };
    Body: unknown;
  }>('/v1/media/:id/process', async (request, reply) => {
    const { id } = request.params;
    const processData = request.validate(MediaProcessRequestSchema, request.body);

    // Verify media asset exists
    const mediaAsset = await fastify.prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!mediaAsset) {
      throw fastify.httpErrors.notFound(`Media asset ${id} not found`);
    }

    // Create processing job
    const job = await fastify.prisma.job.create({
      data: {
        type: 'media.process',
        status: 'queued',
        metrics: { operations: processData.operations, media_id: id },
      },
    });

    // In a real implementation, this would enqueue to BullMQ
    fastify.log.info({ jobId: job.id, mediaId: id }, 'Media processing job queued');

    return reply.status(202).send({
      job_id: job.id,
      status: 'queued',
    });
  });
};

export default mediaRoutes;
