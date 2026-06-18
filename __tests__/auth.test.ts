import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Use your local dev server URL for integration testing
const API_URL = 'http://localhost:3000';

describe('Auth & Protected Routes', () => {
  it('should reject unauthenticated access to the Agent route', async () => {
    const response = await request(API_URL)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hello' }] });

    // Expecting 401 Unauthorized because no refresh_token cookie was sent
    expect(response.status).toBe(401);
    expect(response.text).toMatch(/Unauthorized|UNAUTHORIZED/i);
  });

  it('should reject unauthenticated access to the Digest GET route', async () => {
    const response = await request(API_URL).get('/api/digest');

    expect(response.status).toBe(401);
  });
});
