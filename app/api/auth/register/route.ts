import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    
    // Create the unverified user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        authProvider: 'local',
      },
    });

    // Generate Verification Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expiresAt,
      },
    });

    // Send Email via Resend
    const verifyLink = `${appUrl}/api/auth/verify?token=${token}`;
    
    // Always log the link to the terminal so you can copy-paste it if the email fails
    console.log('\n=== VERIFICATION LINK ===');
    console.log(verifyLink);
    console.log('=========================\n');
    
    if (process.env.RESEND_API_KEY) {
      const { data, error } = await resend.emails.send({
        from: 'noreply@meridian.parthmunjal.in', // Resend's default testing email
        to: email,
        subject: 'Verify your email address',
        html: `<p>Please verify your email by clicking the link below:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
      });

      if (error) {
        console.error('Resend failed to send email:', error);
      } else {
        console.log('Email sent successfully via Resend:', data);
      }
    } else {
      console.log('Mock email sent (no RESEND_API_KEY):', verifyLink);
    }

    return NextResponse.json({
      message: 'User created successfully. Please check your email to verify your account before logging in.',
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
