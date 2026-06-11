/**
 * Generates an embedding for the given text.
 * In a production environment, this would call OpenAI's embedding API 
 * (e.g. text-embedding-ada-002) and return the 1536-dimensional float array.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Simulate network delay for embedding API
  await new Promise(resolve => setTimeout(resolve, 300));

  // Generate a mock 1536-dimensional vector for local testing with pgvector
  // Use a simple seeded random based on string length and characters
  // so the same text roughly points in the same direction, but adds enough variance.
  const vector = new Array(1536).fill(0).map((_, i) => {
    const val = Math.sin(text.length * i + text.charCodeAt(i % text.length)) * 0.5 + Math.random() * 0.1;
    return val;
  });

  // Normalize the vector (pgvector best practice for cosine distance)
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / norm);
}
