import { z } from 'zod';

export const CreateAutomationSchema = z.object({
  triggers: z.record(z.unknown()),
  actions: z.record(z.unknown()),
  policy: z.record(z.unknown()).optional(),
  enabled: z.boolean().default(true),
});

export const AutomationResponseSchema = z.object({
  id: z.string(),
  triggers: z.record(z.unknown()),
  actions: z.record(z.unknown()),
  policy: z.record(z.unknown()).optional(),
  enabled: z.boolean(),
});

export type CreateAutomation = z.infer<typeof CreateAutomationSchema>;
export type AutomationResponse = z.infer<typeof AutomationResponseSchema>;
