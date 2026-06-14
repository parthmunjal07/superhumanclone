const https = require('https');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'api.corsair.dev',
      path,
      method,
      headers: {
        'Authorization': `Bearer ch_rPz8TKRv1RFtzOKqrgYlWhiOsad8EE2CRJgCq9mi7WM`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, res => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(resData ? JSON.parse(resData) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${resData}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  try {
    const instancesRes = await request('GET', '/v1/instances');
    const instanceId = instancesRes.instances[0].id;
    
    console.log(`Getting authorizeUrl for instance ${instanceId}...`);
    // POST /v1/instances/{instanceId}/tenants/{tenantId}/plugins/{pluginId}/oauth/authorize_url
    const res = await request('POST', `/v1/instances/${instanceId}/tenants/test-user/plugins/gmail/oauth/authorize_url`, {
      return_to: 'http://localhost:3000/callback'
    });
    console.log(res);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
main();
