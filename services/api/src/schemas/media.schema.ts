import { z } from 'zod';

export const MediaIngestSchema = z.object({
  filename: z.string().min(1),
  content_type: z.string().min(1),
});

export const MediaIngestResponseSchema = z.object({
  id: z.string(),
  upload_url: z.string().url(),
  expires_at: z.string().datetime(),
});

export const MediaProcessRequestSchema = z.object({
  operations: z
    .array(z.enum(['proxy', 'asr', 'vision-tagging']))
    .min(1)
    .optional()
    .default(['proxy', 'asr']),
});

export const MediaProcessResponseSchema = z.object({
  job_id: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
});

export type MediaIngest = z.infer<typeof MediaIngestSchema>;
export type MediaIngestResponse = z.infer<typeof MediaIngestResponseSchema>;
export type MediaProcessRequest = z.infer<typeof MediaProcessRequestSchema>;
export type MediaProcessResponse = z.infer<typeof MediaProcessResponseSchema>;
