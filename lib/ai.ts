import { createOpenAI } from '@ai-sdk/openai';
import { embed } from 'ai';

// 1. Initialize OpenRouter Client
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Superhuman Clone',
  }
});

// Initialize official OpenAI Client for embeddings
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. Sanitization Utility
export function sanitizeLongText(text: string | null | undefined, maxLength: number = 300): string {
  if (!text) return '';
  // Strip HTML tags using a simple regex
  const plainText = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + '...';
}

/**
 * Generates an embedding for the given text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}
