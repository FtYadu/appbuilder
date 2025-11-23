import { z } from 'zod';

export const ChatWebhookSchema = z.object({
  // Channel-specific payload - varies by provider
  // Will be normalized into MessageEnvelope
  body: z.record(z.unknown()),
});

export const MessageEnvelopeSchema = z.object({
  channel: z.enum(['telegram', 'whatsapp', 'email', 'sms']),
  direction: z.enum(['inbound', 'outbound']),
  content: z.string(),
  attachments: z.array(z.string()).optional(),
  meta: z.record(z.unknown()).optional(),
});

export type ChatWebhook = z.infer<typeof ChatWebhookSchema>;
export type MessageEnvelope = z.infer<typeof MessageEnvelopeSchema>;
