import { toNextJsHandler } from 'corsair';
import { corsair } from '@/lib/corsair';

const handler = toNextJsHandler(corsair, {
  basePath: '/api/corsair',
});

export { handler as GET, handler as POST };
