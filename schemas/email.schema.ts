import { z } from 'zod';

export const SendEmailSchema = z.object({
  to: z.string().email({ message: "Invalid email address" }).describe("The email address of the recipient"),
  subject: z.string().min(1, { message: "Subject is required" }).describe("The subject of the email"),
  body: z.string().min(1, { message: "Body is required" }).describe("The plain text body of the email"),
});

export const SearchEmailSchema = z.object({
  query: z.string().min(1, { message: "Search query is required" }),
});

// We can add other schemas here as needed for other email-related operations.
