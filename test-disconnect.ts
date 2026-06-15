import { getCorsairClient } from './lib/corsair.ts';

async function main() {
  const tenantId = "cmqdzxyju000004jrnqii62zy";
  const tenant = await getCorsairClient(tenantId);
  try {
    await tenant.gmail.keys.set_access_token(null);
    console.log("Success");
  } catch(e: any) {
    console.error("Error:", e.message);
  }
}

main();
