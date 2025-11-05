import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { compose, requireAdmin, rateLimit, logRequest } from '@/lib/middleware';

// Apply middleware
const middleware = compose(
  logRequest,
  rateLimit({ windowMs: 60000, maxRequests: 100 }), // 100 requests per minute
  requireAdmin
);

// GET /api/admin/users - List all users with pagination and filtering
export async function GET(request: NextRequest) {
  const middlewareResult = await middleware(request);
  if (middlewareResult) return middlewareResult;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build filter query
    const filter: any = {};

    if (search) {
      filter.$or = [
        { 'profile.name': { $regex: search, $options: 'i' } },
        { 'profile.username': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      switch (status) {
        case 'active':
          filter.isActive = true;
          filter.isBanned = false;
          break;
        case 'inactive':
          filter.isActive = false;
          break;
        case 'banned':
          filter.isBanned = true;
          break;
        case 'unverified':
          filter['security.emailVerified'] = false;
          break;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password -security.passwordResetToken -security.emailVerificationToken')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get summary statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $and: ['$isActive', { $not: '$isBanned' }] }, 1, 0] } },
          bannedUsers: { $sum: { $cond: ['$isBanned', 1, 0] } },
          unverifiedUsers: { $sum: { $cond: [{ $not: '$security.emailVerified' }, 1, 0] } },
          adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          moderatorUsers: { $sum: { $cond: [{ $eq: ['$role', 'moderator'] }, 1, 0] } }
        }
      }
    ]);

    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        unverifiedUsers: 0,
        adminUsers: 0,
        moderatorUsers: 0
      }
    });

  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  const middlewareResult = await middleware(request);
  if (middlewareResult) return middlewareResult;

  try {
    const body = await request.json();
    const { email, password, username, name, role = 'user', permissions = [] } = body;

    // Validation
    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { error: 'Email, password, username, and name are required' },
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
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Create user (similar to registration but with admin privileges)
    const user = new User({
      email: email.toLowerCase(),
      password: await require('@/lib/auth').hashPassword(password),
      profile: {
        name,
        username: username.toLowerCase(),
        bio: '',
        location: '',
        skills: [],
        avatar: '',
        socialLinks: {
          github: '',
          portfolio: '',
          linkedin: '',
          twitter: ''
        }
      },
      role,
      permissions: permissions.length > 0 ? permissions : require('@/lib/auth').getDefaultPermissions(role),
      security: {
        emailVerified: true, // Admin-created users are auto-verified
        emailVerificationToken: null,
        emailVerificationExpires: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        loginAttempts: 0,
        lockUntil: null
      },
      isVerified: true
    });

    await user.save();

    // Return user without sensitive data
    const { password: _, security, ...userResponse } = user.toObject();
    const { passwordResetToken, emailVerificationToken, twoFactorSecret, ...safeSecurity } = security;

    return NextResponse.json({
      message: 'User created successfully',
      user: { ...userResponse, security: safeSecurity }
    }, { status: 201 });

  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}