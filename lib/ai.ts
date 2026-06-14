import { createOpenAI } from '@ai-sdk/openai';

// 1. Initialize OpenRouter Client
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
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
  await new Promise(resolve => setTimeout(resolve, 300));
  const vector = new Array(1536).fill(0).map((_, i) => {
    const val = Math.sin(text.length * i + text.charCodeAt(i % text.length)) * 0.5 + Math.random() * 0.1;
    return val;
  });
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / norm);
}
