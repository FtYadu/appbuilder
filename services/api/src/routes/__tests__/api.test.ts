import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

// Plugins
import errorHandler from '../../plugins/error-handler';
import validation from '../../plugins/validation';

// Routes
import chatRoutes from '../chat.routes';
import taskRoutes from '../task.routes';
import calendarRoutes from '../calendar.routes';
import automationRoutes from '../automation.routes';
import mediaRoutes from '../media.routes';
import actionRoutes from '../action.routes';
import memoryRoutes from '../memory.routes';

// Mock Prisma Client
const mockPrismaClient = {
  message: {
    create: vi.fn(),
  },
  task: {
    create: vi.fn(),
  },
  automation: {
    create: vi.fn(),
  },
  mediaAsset: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  job: {
    create: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

describe('API Endpoints', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify({ logger: false });

    // Register plugins
    await server.register(cors);
    await server.register(sensible);
    await server.register(errorHandler);
    await server.register(validation);

    // Mock Prisma
    server.decorate('prisma', mockPrismaClient);

    // Register routes
    await server.register(chatRoutes);
    await server.register(taskRoutes);
    await server.register(calendarRoutes);
    await server.register(automationRoutes);
    await server.register(mediaRoutes);
    await server.register(actionRoutes);
    await server.register(memoryRoutes);

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /v1/chat/:channel', () => {
    it('should accept and normalize webhook from telegram channel', async () => {
      mockPrismaClient.message.create.mockResolvedValueOnce({
        id: 'msg_123',
        channel: 'telegram',
        direction: 'inbound',
        content: '{"message":"test"}',
        attachments: [],
        meta: {},
      });

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/telegram',
        payload: { message: 'test' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message_id');
      expect(body.status).toBe('received');
    });

    it('should validate invalid channel', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/invalid-channel',
        payload: { message: 'test' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /v1/tasks', () => {
    it('should create a new task', async () => {
      mockPrismaClient.task.create.mockResolvedValueOnce({
        id: 'task_123',
        projectId: 'proj_123',
        due_at: new Date('2025-12-31'),
        status: 'pending',
        source: 'api',
        approvals: null,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/v1/tasks',
        payload: {
          project_id: 'proj_123',
          due_at: '2025-12-31T00:00:00Z',
          status: 'pending',
          source: 'api',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('task_123');
      expect(body.project_id).toBe('proj_123');
    });

    it('should reject invalid task data', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/tasks',
        payload: {
          project_id: 'proj_123',
          // Missing required fields
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /v1/calendar/events', () => {
    it('should create a calendar event', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/calendar/events',
        payload: {
          title: 'Team Meeting',
          start_time: '2025-12-01T10:00:00Z',
          end_time: '2025-12-01T11:00:00Z',
          attendees: ['user@example.com'],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.title).toBe('Team Meeting');
      expect(body).toHaveProperty('id');
    });

    it('should validate email format for attendees', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/calendar/events',
        payload: {
          title: 'Meeting',
          start_time: '2025-12-01T10:00:00Z',
          end_time: '2025-12-01T11:00:00Z',
          attendees: ['invalid-email'],
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /v1/automations', () => {
    it('should create an automation rule', async () => {
      mockPrismaClient.automation.create.mockResolvedValueOnce({
        id: 'auto_123',
        triggers: { event: 'message.received' },
        actions: { type: 'notify' },
        policy: {},
        enabled: true,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/v1/automations',
        payload: {
          triggers: { event: 'message.received' },
          actions: { type: 'notify' },
          enabled: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('auto_123');
      expect(body.enabled).toBe(true);
    });
  });

  describe('POST /v1/media/ingest', () => {
    it('should generate presigned URL and register media asset', async () => {
      mockPrismaClient.mediaAsset.create.mockResolvedValueOnce({
        id: 'media_123',
        uri: 'https://storage.example.com/upload/media_123',
        checksum: 'pending',
        proxy_uri: null,
        tags: {},
        transcripts: null,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/v1/media/ingest',
        payload: {
          filename: 'video.mp4',
          content_type: 'video/mp4',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('upload_url');
      expect(body).toHaveProperty('expires_at');
    });
  });

  describe('POST /v1/media/:id/process', () => {
    it('should enqueue media processing job', async () => {
      mockPrismaClient.mediaAsset.findUnique.mockResolvedValueOnce({
        id: 'media_123',
        uri: 'https://storage.example.com/media_123',
        checksum: 'abc123',
        proxy_uri: null,
        tags: {},
        transcripts: null,
      });

      mockPrismaClient.job.create.mockResolvedValueOnce({
        id: 'job_123',
        type: 'media.process',
        status: 'queued',
        metrics: {},
        error: null,
        started_at: new Date(),
        ended_at: null,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/v1/media/media_123/process',
        payload: {
          operations: ['proxy', 'asr'],
        },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.job_id).toBe('job_123');
      expect(body.status).toBe('queued');
    });

    it('should return 404 for non-existent media', async () => {
      mockPrismaClient.mediaAsset.findUnique.mockResolvedValueOnce(null);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/media/nonexistent/process',
        payload: {},
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /v1/actions/send', () => {
    it('should queue an action with approval gate', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/actions/send',
        payload: {
          action_type: 'send_email',
          payload: { to: 'user@example.com', subject: 'Test' },
        },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('pending_approval');
      expect(body).toHaveProperty('action_id');
    });
  });

  describe('GET /v1/memory/search', () => {
    it('should perform semantic search', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/memory/search',
        query: { q: 'project deadline' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('results');
      expect(body).toHaveProperty('total');
      expect(Array.isArray(body.results)).toBe(true);
    });

    it('should require search query', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/memory/search',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should respect limit parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/memory/search',
        query: { q: 'test', limit: '5' },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
