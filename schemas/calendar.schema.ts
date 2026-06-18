import { z } from 'zod';

export const calendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required').describe("Title of the event"),
  start: z.string().min(1, 'Start time is required').describe("Start time as an ISO string (e.g., 2026-06-17T17:00:00.000Z)"),
  end: z.string().min(1, 'End time is required').describe("End time as an ISO string (e.g., 2026-06-17T18:00:00.000Z)"),
  location: z.string().optional().describe("Location of the event"),
  description: z.string().optional().describe("Description of the event"),
  attendees: z.array(z.string().email('Invalid email')).optional().describe("List of attendee email addresses"),
  colorId: z.string().optional().describe("Color ID of the event"),
  recurrence: z.array(z.string()).optional().describe("Recurrence rules"),
  addMeetLink: z.boolean().optional().describe("Whether to add a Google Meet link")
});

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;

export const freeBusySchema = z.object({
  timeMin: z.string().min(1, 'timeMin is required'),
  timeMax: z.string().min(1, 'timeMax is required'),
  items: z.array(z.string().email('Invalid email')).min(1, 'At least one attendee is required')
});

export type FreeBusyInput = z.infer<typeof freeBusySchema>;
