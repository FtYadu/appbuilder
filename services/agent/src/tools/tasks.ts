import { z } from 'zod';

export const createTaskSchema = z.object({
  projectId: z.string().optional().describe("The ID of the project this task belongs to."),
  title: z.string().describe("The title of the task."),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo').describe("The status of the task."),
  source: z.string().optional().describe("The source from which this task was created (e.g., 'email', 'chat')."),
});

export const tasksTool = {
  name: 'create_task',
  description: 'Creates a new task.',
  input: createTaskSchema,
  execute: async (input: z.infer<typeof createTaskSchema>) => {
    // In a real implementation, this would interact with a task management system.
    console.log('Creating task:', input);
    return { success: true, taskId: `task_${Date.now()}` };
  },
};