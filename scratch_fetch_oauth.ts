import { createClient } from '@corsair-dev/app';

async function main() {
  const client = createClient({ apiKey: 'ch_rPz8TKRv1RFtzOKqrgYlWhiOsad8EE2CRJgCq9mi7WM' });
  const { instances } = await client.instances.list();
  if (instances.length === 0) return;
  const detail = await client.instance(instances[0].id).get();
  console.log('OAuth Callback URL:', detail.oauthCallbackUrl);
}
main();
