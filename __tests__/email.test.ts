import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { EmailService } from '@/services/email.service';

const API_URL = 'http://localhost:3000';

// 🚨 MOCK THE SERVICE: We don't want to actually send an email to Google during tests
vi.mock('@/services/email.service', () => {
  return {
    EmailService: {
      sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-id-123' }),
    },
  };
});

describe('Email Sending API', () => {
  it('should reject email sending if missing parameters', async () => {
    // We are simulating a logged-in user by assuming we have a mock cookie
    // (If your local dev server requires real DB tokens, you'd integrate this with the auth flow above)
    const response = await request(API_URL)
      .post('/api/emails/send')
      .set('Cookie', ['corsair_refresh_token=demo-token']) // Use demo-token which is natively handled in auth.ts
      .send({ to: 'friend@example.com' }); // Missing subject and body

    expect(response.status).toBe(400); // Should fail Zod validation
    expect(response.body.error).toBeDefined();
  });

  it('should call EmailService.sendEmail when valid data is provided', async () => {
    const payload = {
      to: 'friend@example.com',
      subject: 'Integration Test',
      body: 'Hello world'
    };

    const response = await request(API_URL)
      .post('/api/emails/send')
      .set('Cookie', ['corsair_refresh_token=demo-token']) 
      .send(payload);

    // If auth is bypassed or mocked correctly, it should succeed
    expect(response.status).toBe(200);
    expect(EmailService.sendEmail).toHaveBeenCalled();
  });
});
