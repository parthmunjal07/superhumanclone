import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { prisma } from '@/lib/prisma'; // Adjust import based on your alias

const API_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test-integration@meridian.com',
  password: 'SecurePassword123!',
  name: 'Integration Tester'
};

describe('Full Authentication Flow', () => {
  // Cleanup any left-over test user before starting
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  });

  // Cleanup after tests finish
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  });

  let authCookie: string[] = [];

  it('should successfully register a new user', async () => {
    const response = await request(API_URL)
      .post('/api/auth/register')
      .send(TEST_USER);

    // Depending on the implementation, it could be 200 or 201
    expect([200, 201]).toContain(response.status); 
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(TEST_USER.email);
  });

  it('should successfully log in and return a refresh token cookie', async () => {
    const response = await request(API_URL)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(response.status).toBe(200);
    
    // Capture the Set-Cookie header for subsequent requests
    authCookie = response.headers['set-cookie'];
    expect(authCookie).toBeDefined();
    expect(authCookie[0]).toContain('refresh_token'); 
  });

  it('should access a protected route using the valid cookie', async () => {
    const response = await request(API_URL)
      .get('/api/auth/me') // Or any route that calls verifyToken()
      .set('Cookie', authCookie); // Inject the captured cookie

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(TEST_USER.email);
  });
});
