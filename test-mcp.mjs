import { createMCPClient } from '@ai-sdk/mcp';

async function main() {
  const apiKey = process.env.CORSAIR_DEV_KEY;
  const instanceId = process.env.CORSAIR_INSTANCE_ID;
  const tenantId = "cmqdzxyju000004jrnqii62zy";

  console.log("Testing SSE transport with base URL");
  const url1 = `https://api.corsair.dev/mcp/${instanceId}?tenantId=${tenantId}`;
  try {
    const client1 = await createMCPClient({
      transport: { type: "sse", url: url1, headers: { "Authorization": `Bearer ${apiKey}`, "X-Corsair-Tenant-Id": tenantId } }
    });
    const tools = await client1.tools();
    console.log("Base URL worked! Tools:", tools.map(t => t.name));
  } catch (err) {
    console.error("Base URL failed:", err.message);
  }

  console.log("Testing SSE transport with /sse URL");
  const url2 = `https://api.corsair.dev/mcp/${instanceId}/sse?tenantId=${tenantId}`;
  try {
    const client2 = await createMCPClient({
      transport: { type: "sse", url: url2, headers: { "Authorization": `Bearer ${apiKey}`, "X-Corsair-Tenant-Id": tenantId } }
    });
    const tools2 = await client2.tools();
    console.log("/sse URL worked! Tools:", tools2.map(t => t.name));
  } catch (err) {
    console.error("/sse URL failed:", err.message);
  }
}

main().catch(console.error);
