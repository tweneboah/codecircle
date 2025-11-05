import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { 
          error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with the reset token
    const user = await User.findOne({
      'security.passwordResetToken': token,
      'security.passwordResetExpires': { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if account is banned or inactive
    if (user.isBanned || !user.isActive) {
      return NextResponse.json(
        { error: 'Account is not accessible' },
        { status: 403 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      $set: {
        password: hashedPassword
      },
      $unset: {
        'security.passwordResetToken': 1,
        'security.passwordResetExpires': 1,
        'security.loginAttempts': 1,
        'security.lockUntil': 1
      }
    });

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET request to validate reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with the reset token
    const user = await User.findOne({
      'security.passwordResetToken': token,
      'security.passwordResetExpires': { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Valid reset token', email: user.email },
      { status: 200 }
    );

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}