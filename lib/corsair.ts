import { createClient } from '@corsair-dev/app';

if (!process.env.CORSAIR_API_KEY) {
  throw new Error('CORSAIR_API_KEY is not set');
}

// Global Corsair client, never use this directly to make user calls!
export const globalCorsairClient = createClient({
  apiKey: process.env.CORSAIR_API_KEY,
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