import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { prisma } from '@/lib/prisma';

const API_URL = 'http://localhost:3000';

describe('Webhook Idempotency', () => {
  const mockWebhookPayload = {
    id: 'evt_test_12345',
    userId: 'demo-user', // Make sure it links to an existing user for the DB insert
    type: 'email.received',
    data: {
      messageId: 'msg_abc_987',
      subject: 'New Lead'
    }
  };

  it('should process the webhook successfully the first time', async () => {
    const response = await request(API_URL)
      .post('/api/webhooks/email') // Adjust to your actual webhook route
      .send(mockWebhookPayload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('received', true);
  });

  it('should safely ignore the exact same webhook the second time (Idempotency)', async () => {
    const response = await request(API_URL)
      .post('/api/webhooks/email')
      .send(mockWebhookPayload);

    // It should still return 200 OK so the third-party provider stops retrying,
    // but internally it should have skipped database creation.
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('duplicate', true); // Webhook sets duplicate: true
  });
});
