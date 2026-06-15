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
  plugins: [gmail(), googlecalendar()],
  multiTenancy: true,
});

// The client SDK pointed to our local self-hosted engine
export const globalCorsairClient = createClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/corsair` : 'http://localhost:3000/api/corsair',
  apiKey: process.env.CORSAIR_API_KEY || 'local',
});

export class CorsairNotConnectedError extends Error {
  constructor(message = 'User is not connected to Corsair') {
    super(message);
    this.name = 'CorsairNotConnectedError';
  }
}

let cachedInstanceId: string | null = process.env.CORSAIR_INSTANCE_ID || null;

export const getCorsairClient = async (corsairUserId: string | null | undefined) => {
  if (!corsairUserId) throw new CorsairNotConnectedError();
  
  if (!cachedInstanceId) {
    try {
      const { instances } = await globalCorsairClient.instances.list();
      if (instances.length === 0) {
        throw new Error("No Corsair instances found on this account.");
      }
      cachedInstanceId = instances[0].id;
    } catch (err: any) {
      throw new Error(`Failed to resolve Corsair instance ID: ${err.message}`);
    }
  }
  
  return globalCorsairClient.instance(cachedInstanceId).tenant(corsairUserId);
};