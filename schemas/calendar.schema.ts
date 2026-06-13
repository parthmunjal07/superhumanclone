import { z } from 'zod';

export const calendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  start: z.string().min(1, 'Start time is required'),
  end: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  description: z.string().optional(),
  attendees: z.array(z.string().email('Invalid email')).optional()
});

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;

export const freeBusySchema = z.object({
  timeMin: z.string().min(1, 'timeMin is required'),
  timeMax: z.string().min(1, 'timeMax is required'),
  items: z.array(z.string().email('Invalid email')).min(1, 'At least one attendee is required')
});

export type FreeBusyInput = z.infer<typeof freeBusySchema>;
