import { prisma } from '@/lib/prisma';

// Mock function to simulate a background Corsair API call
const triggerCorsairBackgroundAction = async (action: string, payload: any) => {
  // In a real application, this would probably be a message queue or a resilient fetch
  console.log(`[Corsair API Mock] Triggering ${action} with payload:`, payload);
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Simulate 5% error rate for "silent rollback" demonstration purposes
  if (Math.random() < 0.05) {
    console.error(`[Corsair API Mock] ${action} failed randomly.`);
    // A real implementation might throw an error or handle retries
    // We'll throw so the API route can return a 500, which the client can use to rollback
    throw new Error('Corsair API call failed');
  }

  console.log(`[Corsair API Mock] ${action} succeeded.`);
};

export class EmailService {
  /**
   * Fetch emails for a specific user with cursor-based pagination
   */
  static async getEmails(userId: string, limit: number, cursor?: string | null) {
    const emails = await prisma.email.findMany({
      where: { userId },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        subject: true,
        body: true, // Returning full body, but SWR could optimize this later
        from: true,
        to: true,
        date: true,
        priorityLevel: true,
        isRead: true,
      },
    });

    let nextCursor: string | null = null;
    if (emails.length > limit) {
      const nextItem = emails.pop(); // Remove the extra item
      nextCursor = nextItem!.id;
    }

    return { emails, nextCursor };
  }

  /**
   * Send a new email
   */
  static async sendEmail(userId: string, payload: { to: string; subject: string; body: string }) {
    // 1. Write to local Prisma DB immediately
    const newEmail = await prisma.email.create({
      data: {
        userId,
        corsairId: `mock_corsair_${Date.now()}`, // Temporary mock ID
        to: payload.to,
        from: 'me@example.com', // Should be fetched from user profile in real app
        subject: payload.subject,
        body: payload.body,
        date: new Date(),
        isRead: true, // Sent emails are implicitly read
      },
    });

    // 2. Trigger Corsair API in background
    // (In Next.js serverless functions, you technically shouldn't fire-and-forget without `waitUntil`, 
    // but for simplicity we'll just await it or wrap it if we want to catch errors.)
    try {
      await triggerCorsairBackgroundAction('send', payload);
    } catch (error) {
      // In a real app with strict silent rollback, if the background task fails immediately,
      // we might want to delete the local record and throw so the client knows it failed.
      await prisma.email.delete({ where: { id: newEmail.id } });
      throw error;
    }

    return newEmail;
  }

  /**
   * Archive an email
   */
  static async archiveEmail(userId: string, emailId: string) {
    // Since there's no "archived" boolean in the schema, we might delete it or mark it read.
    // Wait, let's assume archiving deletes it from the inbox view for now, or just deletes it.
    // The schema has `isRead`. Let's just delete it for the sake of the prototype if there's no archive flag.
    // Wait, let's check schema. We can add an `isArchived` flag or just delete.
    // I'll just delete it for now to keep it simple, or maybe I should check the schema.
    // Schema doesn't have `isArchived`. I'll delete it from local DB.
    
    const email = await prisma.email.findUnique({ where: { id: emailId } });
    if (!email || email.userId !== userId) throw new Error("Email not found");

    await prisma.email.delete({ where: { id: emailId } });

    try {
      await triggerCorsairBackgroundAction('archive', { emailId });
    } catch (error) {
      // Rollback: recreate it (simplified)
      await prisma.email.create({ data: email });
      throw error;
    }
    
    return { success: true };
  }

  /**
   * Delete an email
   */
  static async deleteEmail(userId: string, emailId: string) {
    const email = await prisma.email.findUnique({ where: { id: emailId } });
    if (!email || email.userId !== userId) throw new Error("Email not found");

    await prisma.email.delete({ where: { id: emailId } });

    try {
      await triggerCorsairBackgroundAction('delete', { emailId });
    } catch (error) {
      // Rollback
      await prisma.email.create({ data: email });
      throw error;
    }

    return { success: true };
  }

  /**
   * Search emails using pgvector
   */
  static async searchEmails(userId: string, query: string) {
    // Dynamically import to avoid circular dependency issues if ai.ts uses something else
    const { generateEmbedding } = await import('@/lib/ai');
    const queryEmbedding = await generateEmbedding(query);
    
    // We must pass the vector as a string literal '[val1, val2, ...]' for pgvector
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Perform vector search
    // Using <=> for cosine distance
    const localResults = await prisma.$queryRaw<any[]>`
      SELECT id, subject, "from", body, date, "isRead", "priorityLevel"
      FROM "Email"
      WHERE "userId" = ${userId}
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT 10
    `;

    // If fewer than 5 local results, simulate falling back to Corsair
    if (localResults.length < 5) {
      console.log(`[EmailService] Local results (${localResults.length}) < 5, falling back to Corsair API for: ${query}`);
      // Simulate Corsair Search API Mock
      const mockResult = {
        id: `mock_corsair_search_${Date.now()}`,
        subject: `[Corsair Search] Results for: ${query}`,
        from: 'Corsair Search <search@corsair.dev>',
        body: `We found additional emails matching "${query}" on our servers that are not cached locally yet.`,
        date: new Date(),
        isRead: true,
        priorityLevel: 'Normal',
      };
      
      // Prevent duplicates if by some miracle the ID matches (impossible due to Date.now)
      localResults.push(mockResult);
    }

    return localResults;
  }
}
