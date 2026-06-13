import { getTenant } from '@/lib/corsair';
import { prisma } from "@/lib/prisma";

export class EmailService {
  /**
   * Fetch emails from Corsair DB Cache
   */
  static async getEmails(userId: string, limit: number, cursor?: string | null, view: string = 'INBOX') {
    const t = await getTenant(userId);
    const offset = Number(cursor) || 0;
    
    try {
      // Read from the synced DB cache
      const dbMessages = await t.gmail.db.messages.search({
        limit: limit + 1,
        offset: offset,
      }) as any[];

      let messages = [];
      let nextCursorStr: string | null = null;

      if (dbMessages.length > 1) {
        let hasMore = dbMessages.length > limit;
        if (hasMore) dbMessages.pop(); // remove extra item

        // Filter based on view
        let filteredMessages = dbMessages;
        if (view === 'SENT') {
          filteredMessages = dbMessages.filter(m => (m.data?.labelIds || []).includes('SENT'));
        } else if (view === 'SPAM') {
          filteredMessages = dbMessages.filter(m => (m.data?.labelIds || []).includes('SPAM'));
        } else {
          filteredMessages = dbMessages.filter(m => !(m.data?.labelIds || []).includes('SENT') && !(m.data?.labelIds || []).includes('SPAM') && !(m.data?.labelIds || []).includes('TRASH'));
        }
        
        messages = filteredMessages.map((m: any) => ({
          id: m.data?.id || m.id,
          subject: m.data?.subject || m.data?.snippet?.substring(0, 50) || '(No Subject)',
          body: m.data?.body || m.data?.snippet || '',
          from: m.data?.from || 'Unknown',
          to: m.data?.to || 'Me',
          date: m.data?.date || m.created_at,
          isRead: !((m.data?.labelIds || []).includes('UNREAD')),
          priorityLevel: 'Normal'
        }));
        nextCursorStr = hasMore ? String(offset + limit) : null;
      } else {
        // Fallback to live API if DB sync hasn't run
        const res = await t.gmail.api.messages.list({
          maxResults: limit,
          pageToken: cursor || undefined,
        });
        
        const msgIds = res.messages || [];
        const liveMsgs = await Promise.all(
          msgIds.map((m: any) => t.gmail.api.messages.get({ id: m.id }))
        );

        let filteredLive = liveMsgs;
        if (view === 'SENT') {
          filteredLive = liveMsgs.filter(m => (m.labelIds || []).includes('SENT'));
        } else if (view === 'SPAM') {
          filteredLive = liveMsgs.filter(m => (m.labelIds || []).includes('SPAM'));
        } else {
          filteredLive = liveMsgs.filter(m => !(m.labelIds || []).includes('SENT') && !(m.labelIds || []).includes('SPAM') && !(m.labelIds || []).includes('TRASH'));
        }
        
        messages = filteredLive.map((m: any) => {
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
        nextCursorStr = res.nextPageToken || null;
      }

      return { 
        emails: messages, 
        nextCursor: nextCursorStr 
      };
    } catch (err: any) {
      console.error("[EmailService] Failed to fetch emails from Corsair:", err.message);
      return { emails: [], nextCursor: null };
    }
  }

  /**
   * Send a new email using Corsair API
   */
  static async sendEmail(userId: string, payload: { to: string; subject: string; body: string }) {
    const t = await getTenant(userId);
    
    // Construct raw RFC 2822 email
    const rawMessage = [
      `To: ${payload.to}`,
      `Subject: ${payload.subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      '',
      payload.body
    ].join('\r\n');

    // Base64url encode
    const encodedRaw = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const data = await t.gmail.api.messages.send({
        raw: encodedRaw
      });
      return data;
    } catch (err: any) {
      console.error("[EmailService] Failed to send email:", err.message);
      throw new Error("Failed to send email via Corsair");
    }
  }

  /**
   * Archive an email by removing the INBOX label
   */
  static async archiveEmail(userId: string, emailId: string) {
    const t = await getTenant(userId);
    try {
      // Resolve UUID to Gmail ID if a UUID was passed (handles stale frontend caches)
      let resolvedId = emailId;
      if (emailId.length > 20) {
        const dbEmail = await prisma.email.findUnique({ where: { id: emailId } });
        if (dbEmail?.corsairId) {
          resolvedId = dbEmail.corsairId;
        }
      }

      await t.gmail.api.messages.modify({
        id: resolvedId,
        removeLabelIds: ["INBOX"]
      });
      return { success: true };
    } catch (err: any) {
      throw new Error("Failed to archive email");
    }
  }

  /**
   * Move an email to trash
   */
  static async deleteEmail(userId: string, emailId: string) {
    const t = await getTenant(userId);
    try {
      // Resolve UUID to Gmail ID if a UUID was passed (handles stale frontend caches)
      let resolvedId = emailId;
      if (emailId.length > 20) {
        const dbEmail = await prisma.email.findUnique({ where: { id: emailId } });
        if (dbEmail?.corsairId) {
          resolvedId = dbEmail.corsairId;
        }
      }

      await t.gmail.api.messages.trash({
        id: resolvedId
      });
      return { success: true };
    } catch (err: any) {
      console.error("[EmailService] Failed to delete email:", err.message, err.response?.data);
      throw new Error("Failed to delete email");
    }
  }

  /**
   * Search emails using Corsair DB Cache
   */
  static async searchEmails(userId: string, query: string) {
    const t = await getTenant(userId);
    
    try {
      const messages = await t.gmail.db.messages.search({
        data: { snippet: { contains: query } },
        limit: 10,
        offset: 0,
      }) as any[];

      return messages.map((m: any) => ({
        id: m.data?.id || m.id,
        subject: m.data?.subject || m.data?.snippet?.substring(0, 50) || '(No Subject)',
        body: m.data?.body || m.data?.snippet || '',
        from: m.data?.from || 'Unknown',
        to: m.data?.to || 'Me',
        date: m.data?.date || m.created_at,
        isRead: !((m.data?.labelIds || []).includes('UNREAD')),
        priorityLevel: 'Normal'
      }));
    } catch (err: any) {
      console.error("[EmailService] Search failed:", err.message);
      return [];
    }
  }
}
