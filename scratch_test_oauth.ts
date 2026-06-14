import { createClient } from '@corsair-dev/app';

async function main() {
  try {
    const client = createClient({ apiKey: 'ch_rPz8TKRv1RFtzOKqrgYlWhiOsad8EE2CRJgCq9mi7WM' });
    const { instances } = await client.instances.list();
    if (instances.length === 0) return;
    const instanceId = instances[0].id;
    const tenant = client.instance(instanceId).tenant('test-user-id');
    const res = await tenant.plugins.oauth.authorizeUrl('gmail', 'http://localhost:3000/callback');
    console.log(res);
  } catch (err: any) {
    console.log('Error:', err.response?.data || err.message);
  }
}

main();
