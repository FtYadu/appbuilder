import { z } from 'zod';

export const SendActionSchema = z.object({
  action_type: z.string().min(1),
  payload: z.record(z.unknown()),
});

export const ActionResponseSchema = z.object({
  action_id: z.string(),
  status: z.enum(['pending_approval', 'approved', 'rejected', 'sent']),
  action_type: z.string(),
  created_at: z.string().datetime(),
});

export type SendAction = z.infer<typeof SendActionSchema>;
export type ActionResponse = z.infer<typeof ActionResponseSchema>;
