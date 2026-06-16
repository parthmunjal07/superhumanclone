import { createMistral } from '@ai-sdk/mistral';
import { embed } from 'ai';

// 1. Initialize the Mistral Provider
export const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// 2. REAL Vector Embeddings Fix
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: mistral.embedding('mistral-embed'),
    value: text,
  });
  return embedding;
}

// 3. Sanitization Utility
export function sanitizeLongText(text: string | null | undefined, maxLength: number = 300): string {
  if (!text) return "";
  const cleaned = text.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + "..." : cleaned;
}
