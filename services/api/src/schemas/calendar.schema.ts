import { z } from 'zod';

export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  attendees: z.array(z.string().email()).optional(),
});

export const CalendarEventResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  attendees: z.array(z.string()),
  conflicts: z
    .array(
      z.object({
        event_id: z.string(),
        title: z.string(),
        start_time: z.string(),
        end_time: z.string(),
      })
    )
    .optional(),
});

export type CreateCalendarEvent = z.infer<typeof CreateCalendarEventSchema>;
export type CalendarEventResponse = z.infer<typeof CalendarEventResponseSchema>;
