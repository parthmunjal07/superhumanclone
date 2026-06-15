async function main() {
  const apiKey = process.env.CORSAIR_DEV_KEY;
  const instanceId = "6425f9a871a54402bf90ddad68e18cf7"; // from user trace
  const tenantId = "cmqdzxyju000004jrnqii62zy"; // from user trace

  const url = `https://api.corsair.dev/mcp/${instanceId}?tenantId=${tenantId}`;
  console.log("Fetching", url);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "text/event-stream",
      "Authorization": `Bearer ${apiKey}`,
      "X-Corsair-Tenant-Id": tenantId
    }
  });

  console.log(res.status, res.statusText);
  const text = await res.text();
  console.log(text);
}

main().catch(console.error);
