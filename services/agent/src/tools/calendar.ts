import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().describe("The title of the calendar event."),
  startTime: z.string().datetime().describe("The start time of the event in ISO 8601 format."),
  endTime: z.string().datetime().describe("The end time of the event in ISO 8601 format."),
  attendees: z.array(z.string().email()).optional().describe("A list of attendee email addresses."),
});

export const calendarTool = {
  name: 'create_calendar_event',
  description: 'Creates a new event in the user\'s calendar.',
  input: createEventSchema,
  execute: async (input: z.infer<typeof createEventSchema>) => {
    // In a real implementation, this would interact with a calendar API (e.g., Google Calendar).
    console.log('Creating calendar event:', input);
    return { success: true, eventId: `evt_${Date.now()}` };
  },
};