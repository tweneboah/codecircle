import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generatePasswordResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with that email exists, we have sent a password reset link.';

    if (!user) {
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );
    }

    // Check if account is banned or inactive
    if (user.isBanned || !user.isActive) {
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );
    }

    // Generate password reset token
    const { token, expires } = generatePasswordResetToken();

    // Update user with reset token
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'security.passwordResetToken': token,
        'security.passwordResetExpires': expires
      }
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, token, user.profile.name);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json(
      { message: successMessage },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}