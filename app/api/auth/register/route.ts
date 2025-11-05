import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, getDefaultPermissions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, name, bio, location, skills } = body;

    // Validation
    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { error: 'Email, password, username, and name are required' },
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

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { 'profile.username': username.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with auto-verification (no email verification required)
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: {
        name,
        username: username.toLowerCase(),
        bio: bio || '',
        location: location || '',
        skills: skills || [],
        avatar: '',
        socialLinks: {
          github: '',
          portfolio: '',
          linkedin: '',
          twitter: ''
        }
      },
      role: 'user',
      permissions: getDefaultPermissions('user'),
      isVerified: true, // Auto-verify users
      isActive: true
    });

    await user.save();

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.profile.name,
          username: user.profile.username,
          email: user.email
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}