import { toNextJsHandler } from 'corsair';
import { corsair } from '@/lib/corsair';

const handler = toNextJsHandler(corsair, {
  basePath: '/api/corsair',
});

export async function GET(req: Request) {
  return handler.GET(req);
}

export async function POST(req: Request) {
  return handler.POST(req);
}
