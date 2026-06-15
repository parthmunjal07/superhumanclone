import { createClient } from "@corsair-dev/app";

async function main() {
  const corsair = createClient({ apiKey: process.env.CORSAIR_DEV_KEY });
  const instanceId = "6425f9a871a54402bf90ddad68e18cf7";

  const detail = await corsair.instance(instanceId).get();
  console.log("Detail:", JSON.stringify(detail, null, 2));
}

main().catch(console.error);
