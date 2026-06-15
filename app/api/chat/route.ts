import { NextRequest } from 'next/server';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { openrouter } from '@/lib/ai';
import { getCorsairClient } from '@/lib/corsair';
import { prisma } from '@/lib/prisma';
import { getRefreshTokenCookie, verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
    }

    // Map UIMessages to CoreMessages using the official SDK utility
    const coreMessages = await convertToModelMessages(messages);

    // Try to get the current authenticated user
    let user = await prisma.user.findFirst(); // HARDCODED FOR TESTING
    /*
    const token = await getRefreshTokenCookie();
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        user = await prisma.user.findUnique({ where: { id: payload.userId } });
      }
    }
    */

    // Prepare system prompt parameters
    const userName = user?.name || 'User';
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const systemPrompt = `You are a highly capable AI assistant inside a Superhuman clone.
User's Name: ${userName}
Current Date: ${dateStr}
Current Time: ${timeStr}
Timezone: ${tz}

You have access to MCP tools powered by Corsair. Use these tools to perform actions like searching the web (Tavily), managing tasks (Linear), scheduling (Calendar), and communicating (Slack/Gmail).
Be concise, proactive, and always maintain a professional yet approachable tone.
Never invent information if you can use a tool to fetch it.`;

    let tools = {};

    // If the user has a connected Corsair account, fetch the MCP tools
    if (user && user.corsairUserId) {
      try {
        const tenant = await getCorsairClient(user.corsairUserId);
        const mcpClient = await tenant.mcp.createVercelClient();
        tools = await mcpClient.tools();
      } catch (err) {
        console.warn('Failed to retrieve Corsair MCP tools:', err);
      }
    }

    const result = await streamText({
      model: openrouter('anthropic/claude-3-haiku'),
      system: systemPrompt,
      messages: coreMessages,
      tools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('API Agent route error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
