import { z } from 'zod';

export const CreateTaskSchema = z.object({
  project_id: z.string(),
  due_at: z.string().datetime(),
  status: z.string(),
  source: z.string(),
});

export const TaskResponseSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  due_at: z.string(),
  status: z.string(),
  source: z.string(),
  approvals: z.record(z.unknown()).optional(),
});

export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
