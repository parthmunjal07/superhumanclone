import { getCorsairClient } from '@/lib/corsair';
import { prisma } from "@/lib/prisma";

export class EmailService {
  /**
   * Fetch emails from Corsair DB Cache
   */
  static async getEmails(corsairUserId: string, limit: number, cursor?: string | null, view: string = 'INBOX') {
    // If the passed ID is an internal userId, fetch the corsairUserId first (fix for route.ts passing userId)
    let finalCorsairId = corsairUserId;
    if (corsairUserId.startsWith('cm')) {
      const user = await prisma.user.findUnique({ where: { id: corsairUserId } });
      if (user?.corsairUserId) {
        finalCorsairId = user.corsairUserId;
      }
    }
    
    const t = await getCorsairClient(finalCorsairId);
    
    try {
      const listResult = await t.run<{ messages: any[], nextPageToken?: string }>('gmail.api.messages.list', {
        maxResults: limit,
        pageToken: cursor || undefined,
        // Optional: pre-filter by view here using Gmail query syntax, e.g. q: 'in:inbox'
        // For simplicity we will filter locally or via q param
        q: view === 'SENT' ? 'in:sent' : view === 'SPAM' ? 'in:spam' : 'in:inbox'
      });

      if (!listResult.success) {
        throw new Error('Corsair auth failed or user not connected');
      }

      const msgIds = listResult.data.messages || [];
      const liveMsgs = await Promise.all(
        msgIds.map(async (m: any) => {
          const getResult = await t.run<any>('gmail.api.messages.get', { id: m.id });
          return getResult.success ? getResult.data : null;
        })
      );

      const validMsgs = liveMsgs.filter(m => m !== null);
      
      const messages = validMsgs.map((m: any) => {
        const headers = m.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;
        return {
          id: m.id,
          subject: getHeader('subject') || '(No Subject)',
          body: m.snippet || '',
          from: getHeader('from') || 'Unknown',
          to: getHeader('to') || 'Me',
          date: m.internalDate ? new Date(parseInt(m.internalDate)) : new Date(),
          isRead: !((m.labelIds || []).includes('UNREAD')),
          priorityLevel: 'Normal'
        };
      });

      return { 
        emails: messages, 
        nextCursor: listResult.data.nextPageToken || null 
      };
    } catch (err: any) {
      console.error("[EmailService] Failed to fetch emails from Corsair:", err.message);
      return { emails: [], nextCursor: null };
    }
  }

  
  /**
   * Send a new email using Corsair API
   */
  static async sendEmail(corsairUserId: string, payload: { to: string; subject: string; body: string }) {
    const t = await getCorsairClient(corsairUserId);
    
    const rawMessage = [
      `To: ${payload.to}`,
      `Subject: ${payload.subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      '',
      payload.body
    ].join('\r\n');

    const encodedRaw = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const result = await t.run<any>('gmail.api.messages.send', {
        raw: encodedRaw
      });
      if (!result.success) throw new Error("Corsair auth failed");
      return result.data;
    } catch (err: any) {
      console.error("[EmailService] Failed to send email:", err.message);
      throw new Error("Failed to send email via Corsair");
    }
  }

  /**
   * Archive an email by removing the INBOX label
   */
  static async archiveEmail(corsairUserId: string, emailId: string) {
    const t = await getCorsairClient(corsairUserId);
    try {
      const result = await t.run<any>('gmail.api.messages.modify', {
        id: emailId,
        removeLabelIds: ["INBOX"]
      });
      if (!result.success) throw new Error("Corsair auth failed");
      return { success: true };
    } catch (err: any) {
      throw new Error("Failed to archive email");
    }
  }

  /**
   * Move an email to trash
   */
  static async deleteEmail(corsairUserId: string, emailId: string) {
    const t = await getCorsairClient(corsairUserId);
    try {
      const result = await t.run<any>('gmail.api.messages.trash', {
        id: emailId
      });
      if (!result.success) throw new Error("Corsair auth failed");
      return { success: true };
    } catch (err: any) {
      throw new Error("Failed to delete email");
    }
  }

  /**
   * Search emails using live API
   */
  static async searchEmails(corsairUserId: string, query: string) {
    const t = await getCorsairClient(corsairUserId);
    
    try {
      const listResult = await t.run<{ messages: any[] }>('gmail.api.messages.list', {
        q: query,
        maxResults: 10,
      });

      if (!listResult.success || !listResult.data.messages) return [];

      const msgIds = listResult.data.messages;
      const liveMsgs = await Promise.all(
        msgIds.map(async (m: any) => {
          const getResult = await t.run<any>('gmail.api.messages.get', { id: m.id });
          return getResult.success ? getResult.data : null;
        })
      );

      const validMsgs = liveMsgs.filter(m => m !== null);
      
      return validMsgs.map((m: any) => {
        const headers = m.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;
        return {
          id: m.id,
          subject: getHeader('subject') || '(No Subject)',
          body: m.snippet || '',
          from: getHeader('from') || 'Unknown',
          to: getHeader('to') || 'Me',
          date: m.internalDate ? new Date(parseInt(m.internalDate)) : new Date(),
          isRead: !((m.labelIds || []).includes('UNREAD')),
          priorityLevel: 'Normal'
        };
      });
    } catch (err: any) {
      console.error("[EmailService] Search failed:", err.message);
      return [];
    }
  }
}
