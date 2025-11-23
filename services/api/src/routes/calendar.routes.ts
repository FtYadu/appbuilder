import { FastifyPluginAsync } from 'fastify';
import { CreateCalendarEventSchema } from '../schemas';

const calendarRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: unknown }>('/v1/calendar/events', async (request, reply) => {
    const eventData = request.validate(CreateCalendarEventSchema, request.body);

    // Check for conflicts
    // In a real implementation, this would query a calendar events table
    // For now, we'll return an empty conflicts array
    const conflicts: Array<{
      event_id: string;
      title: string;
      start_time: string;
      end_time: string;
    }> = [];

    // Create calendar event (mocked - would use a calendar service/table)
    const event = {
      id: `evt_${Date.now()}`,
      title: eventData.title,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      attendees: eventData.attendees || [],
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };

    return reply.status(201).send(event);
  });
};

export default calendarRoutes;
