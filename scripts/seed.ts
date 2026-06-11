import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding mock emails...');

  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Ensure there is at least one regular user
  let user = await prisma.user.findFirst({ where: { email: 'test@corsair.dev' }});
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@corsair.dev',
        name: 'Test User',
        authProvider: 'local',
        passwordHash,
        role: 'FREE',
        emailVerifiedAt: new Date(),
      }
    });
    console.log('Created test user:', user.email, 'with password: password123');
  }

  // Ensure there is a super admin
  let admin = await prisma.user.findFirst({ where: { email: 'admin@corsair.dev' }});
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@corsair.dev',
        name: 'Super Admin',
        authProvider: 'local',
        passwordHash,
        role: 'SUPER_ADMIN',
        emailVerifiedAt: new Date(),
      }
    });
    console.log('Created super admin:', admin.email, 'with password: password123');
  }

  // Clear existing emails (optional, but good for clean seed)
  await prisma.email.deleteMany({ where: { userId: user.id } });

  const priorities = ['High', 'Normal', 'Low', null];
  const senders = [
    { name: 'Alice Smith', email: 'alice@example.com' },
    { name: 'Bob Jones', email: 'bob@example.com' },
    { name: 'Corsair Team', email: 'hello@corsair.dev' },
    { name: 'GitHub', email: 'noreply@github.com' },
    { name: 'Stripe', email: 'receipts@stripe.com' }
  ];

  const emailsToCreate = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const sender = senders[i % senders.length];
    // Spread dates over the last 30 days
    const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const priorityLevel = priorities[Math.floor(Math.random() * priorities.length)];
    const isRead = Math.random() > 0.3; // 70% chance of being read

    emailsToCreate.push({
      userId: user.id,
      corsairId: `mock_corsair_${crypto.randomBytes(8).toString('hex')}`,
      subject: `Mock Email Thread ${i + 1}`,
      body: `This is the body of mock email ${i + 1}. It contains some text that can be used as a preview in the inbox list view. The quick brown fox jumps over the lazy dog.`,
      from: `${sender.name} <${sender.email}>`,
      to: user.email,
      date,
      priorityLevel,
      isRead,
    });
  }

  // Sort dates descending before inserting so our seed looks somewhat realistic sequentially, 
  // though we random sort them above, let's just insert them.
  emailsToCreate.sort((a, b) => b.date.getTime() - a.date.getTime());

  await prisma.email.createMany({
    data: emailsToCreate,
  });

  console.log(`Successfully seeded ${emailsToCreate.length} mock emails.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
