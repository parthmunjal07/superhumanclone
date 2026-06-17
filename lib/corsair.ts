import { createClient } from '@corsair-dev/app';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// The core self-hosted Corsair engine
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const corsair = createCorsair({
  database: pool,
  kek: process.env.CORSAIR_KEK || 'default-kek-development',
  plugins: [
    gmail({
      credentials: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }
    } as any), 
    googlecalendar({
      credentials: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }
    } as any)
  ],
  multiTenancy: true,
});

// The client SDK pointed to our local self-hosted engine
export const globalCorsairClient = createClient({
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/corsair` : 'http://localhost:3000/api/corsair',
  apiKey: process.env.CORSAIR_API_KEY || 'local',
});

export class CorsairNotConnectedError extends Error {
  constructor(message = 'User is not connected to Corsair') {
    super(message);
    this.name = 'CorsairNotConnectedError';
  }
}

export const getCorsairClient = async (corsairUserId: string | null | undefined) => {
  if (!corsairUserId) throw new CorsairNotConnectedError();
  
  return corsair.withTenant(corsairUserId);
};