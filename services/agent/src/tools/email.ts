import { z } from 'zod';

export const draftEmailSchema = z.object({
  to: z.array(z.string().email()).describe("A list of recipient email addresses."),
  subject: z.string().describe("The subject of the email."),
  body: z.string().describe("The body content of the email."),
});

export const emailTool = {
  name: 'draft_email',
  description: 'Drafts an email to be sent.',
  input: draftEmailSchema,
  execute: async (input: z.infer<typeof draftEmailSchema>) => {
    // In a real implementation, this would save the draft to an email service (e.g., Gmail).
    console.log('Drafting email:', input);
    return { success: true, draftId: `draft_${Date.now()}` };
  },
};