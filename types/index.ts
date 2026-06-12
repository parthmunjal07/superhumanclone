import { z } from 'zod';
import { SendEmailSchema, SearchEmailSchema } from '../schemas/email.schema';

export type SendEmailInput = z.infer<typeof SendEmailSchema>;
export type SearchEmailInput = z.infer<typeof SearchEmailSchema>;
