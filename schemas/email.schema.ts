import { z } from 'zod';

export const SendEmailSchema = z.object({
  to: z.string().email({ message: "Invalid email address" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  body: z.string().min(1, { message: "Body is required" }),
});

export const SearchEmailSchema = z.object({
  query: z.string().min(1, { message: "Search query is required" }),
});

// We can add other schemas here as needed for other email-related operations.
