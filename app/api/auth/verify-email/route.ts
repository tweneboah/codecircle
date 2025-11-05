import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with the verification token
    const user = await User.findOne({
      'security.emailVerificationToken': token,
      'security.emailVerificationExpires': { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if email is already verified
    if (user.security.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      );
    }

    // Update user to mark email as verified
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'security.emailVerified': true,
        isVerified: true
      },
      $unset: {
        'security.emailVerificationToken': 1,
        'security.emailVerificationExpires': 1
      }
    });

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET request for email verification via URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with the verification token
    const user = await User.findOne({
      'security.emailVerificationToken': token,
      'security.emailVerificationExpires': { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if email is already verified
    if (user.security.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      );
    }

    // Update user to mark email as verified
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'security.emailVerified': true,
        isVerified: true
      },
      $unset: {
        'security.emailVerificationToken': 1,
        'security.emailVerificationExpires': 1
      }
    });

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}