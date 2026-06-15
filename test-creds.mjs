import { createClient } from "@corsair-dev/app";

async function main() {
  const corsair = createClient({ apiKey: process.env.CORSAIR_DEV_KEY });
  const instanceId = "6425f9a871a54402bf90ddad68e18cf7";
  const tenantId = "cmqdzxyju000004jrnqii62zy";

  try {
    const creds = await corsair.instance(instanceId).plugins.credentials.list("gmail", tenantId);
    console.log("Gmail credentials:", JSON.stringify(creds, null, 2));
    
    const creds2 = await corsair.instance(instanceId).plugins.credentials.list("googlecalendar", tenantId);
    console.log("Calendar credentials:", JSON.stringify(creds2, null, 2));
  } catch(e) {
    console.error(e);
  }
}

main().catch(console.error);
