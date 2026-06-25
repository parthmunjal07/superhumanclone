import { getCorsairClient } from '@/lib/corsair';
import { prisma } from "@/lib/prisma";

export class EmailService {
  /**
   * Resolve internal userId to corsairUserId if needed
   */
  private static async resolveCorsairId(corsairUserId: string): Promise<string> {
    if (corsairUserId.startsWith('cm')) {
      const user = await prisma.user.findUnique({ where: { id: corsairUserId } });
      if (user?.corsairUserId) return user.corsairUserId;
    }
    return corsairUserId;
  }

  /**
   * Fetch emails using Corsair DB cache (gmail.db.messages.search).
   * The DB path returns flat fields: from, subject, to, body, snippet, etc.
   * Per Corsair docs: use *.db.* for reads, *.api.* for writes/refresh.
   */
  static async getEmails(corsairUserId: string, limit: number, cursor?: string | null, view: string = 'INBOX') {
    const finalCorsairId = await this.resolveCorsairId(corsairUserId);
    const t = await getCorsairClient(finalCorsairId);
    
    try {
      // First, use the API list to get message IDs with proper Gmail search/filtering
      const listData = await t.gmail.api.messages.list({
        maxResults: limit || 20, 
        pageToken: cursor || undefined, 
        q: view === 'SENT' ? 'in:sent' : view === 'SPAM' ? 'in:spam' : view === 'ARCHIVED' ? '-in:inbox -in:trash -in:spam' : 'in:inbox'
      });

      const msgIds: any[] = listData.messages || [];
      
      if (msgIds.length === 0) {
        return { emails: [], nextCursor: listData.nextPageToken || null };
      }

      // Fetch full details for each message from the DB cache
      // The DB cache has flattened fields: from, subject, to, body
      const dbResults = await t.gmail.db.messages.search({
        data: { 
          id: { in: msgIds.map((m: any) => m.id) }
        },
        limit: limit || 20,
        offset: 0
      });

      // Build a lookup map from DB results
      const dbMap = new Map<string, any>();
      const dbRows = (dbResults as any)?.data || dbResults || [];
      if (Array.isArray(dbRows)) {
        dbRows.forEach((row: any) => {
          if (row.id) dbMap.set(row.id, row);
        });
      }

      // For messages not found in DB cache, fall back to API get
      const messages = await Promise.all(
        msgIds.map(async (m: any) => {
          const dbRow = dbMap.get(m.id);
          
          if (dbRow) {
            // DB cache has flat fields
            return {
              id: dbRow.id || m.id,
              subject: dbRow.subject || '(No Subject)',
              body: dbRow.snippet || dbRow.body || '',
              from: dbRow.from || 'Unknown',
              to: dbRow.to || 'Me',
              date: dbRow.internalDate ? new Date(typeof dbRow.internalDate === 'string' ? parseInt(dbRow.internalDate) : dbRow.internalDate) : (dbRow.createdAt ? new Date(dbRow.createdAt) : new Date()),
              isRead: dbRow.labelIds ? !dbRow.labelIds.includes('UNREAD') : true,
              priorityLevel: 'Normal'
            };
          }

          // Fallback: fetch via API
          try {
            const apiMsg = await t.gmail.api.messages.get({ id: m.id, format: 'full' });
            const headers = apiMsg.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value;
            
            return {
              id: apiMsg.id || m.id,
              subject: getHeader('subject') || (apiMsg as any).subject || '(No Subject)',
              body: apiMsg.snippet || '',
              from: getHeader('from') || (apiMsg as any).from || 'Unknown',
              to: getHeader('to') || (apiMsg as any).to || 'Me',
              date: apiMsg.internalDate ? new Date(typeof apiMsg.internalDate === 'string' ? parseInt(apiMsg.internalDate) : apiMsg.internalDate) : new Date(),
              isRead: !((apiMsg.labelIds || []).includes('UNREAD')),
              priorityLevel: 'Normal'
            };
          } catch (err: any) {
            console.error("Error fetching msg:", m.id, err.message);
            return null;
          }
        })
      );

      return { 
        emails: messages.filter(m => m !== null), 
        nextCursor: listData.nextPageToken || null 
      };
    } catch (err: any) {
      console.error("[EmailService] Failed to fetch emails:", err.message);
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
  static async archiveEmail(corsairUserId: string, emailId: string) {
    const t = await getCorsairClient(corsairUserId);
    try {
      await t.gmail.api.messages.modify({
        id: emailId,
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
  static async deleteEmail(corsairUserId: string, emailId: string) {
    const t = await getCorsairClient(corsairUserId);
    try {
      await t.gmail.api.messages.trash({
        id: emailId
      });
      return { success: true };
    } catch (err: any) {
      throw new Error("Failed to delete email");
    }
  }

  /**
   * Search emails using Corsair DB cache
   */
  static async searchEmails(corsairUserId: string, query: string) {
    const finalCorsairId = await this.resolveCorsairId(corsairUserId);
    const t = await getCorsairClient(finalCorsairId);
    
    try {
      // Use API list to get matching message IDs via Gmail search
      const listData = await t.gmail.api.messages.list({
        q: query,
        maxResults: 10,
      });

      if (!listData.messages || listData.messages.length === 0) return [];

      const msgIds = listData.messages;

      // Try DB cache first
      const dbResults = await t.gmail.db.messages.search({
        data: {
          id: { in: msgIds.map((m: any) => m.id) }
        },
        limit: 10,
        offset: 0
      });

      const dbMap = new Map<string, any>();
      const dbRows = (dbResults as any)?.data || dbResults || [];
      if (Array.isArray(dbRows)) {
        dbRows.forEach((row: any) => {
          if (row.id) dbMap.set(row.id, row);
        });
      }

      const messages = await Promise.all(
        msgIds.map(async (m: any) => {
          const dbRow = dbMap.get(m.id);
          
          if (dbRow) {
            return {
              id: dbRow.id || m.id,
              subject: dbRow.subject || '(No Subject)',
              body: dbRow.snippet || dbRow.body || '',
              from: dbRow.from || 'Unknown',
              to: dbRow.to || 'Me',
              date: dbRow.internalDate ? new Date(typeof dbRow.internalDate === 'string' ? parseInt(dbRow.internalDate) : dbRow.internalDate) : (dbRow.createdAt ? new Date(dbRow.createdAt) : new Date()),
              isRead: dbRow.labelIds ? !dbRow.labelIds.includes('UNREAD') : true,
              priorityLevel: 'Normal'
            };
          }

          try {
            const apiMsg = await t.gmail.api.messages.get({ id: m.id, format: 'full' });
            const headers = apiMsg.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value;
            
            return {
              id: apiMsg.id || m.id,
              subject: getHeader('subject') || (apiMsg as any).subject || '(No Subject)',
              body: apiMsg.snippet || '',
              from: getHeader('from') || (apiMsg as any).from || 'Unknown',
              to: getHeader('to') || (apiMsg as any).to || 'Me',
              date: apiMsg.internalDate ? new Date(typeof apiMsg.internalDate === 'string' ? parseInt(apiMsg.internalDate) : apiMsg.internalDate) : new Date(),
              isRead: !((apiMsg.labelIds || []).includes('UNREAD')),
              priorityLevel: 'Normal'
            };
          } catch (err: any) {
            console.error("Error fetching msg:", m.id, err.message);
            return null;
          }
        })
      );

      return messages.filter(m => m !== null);
    } catch (err: any) {
      console.error("[EmailService] Search failed:", err.message);
      return [];
    }
  }
}
