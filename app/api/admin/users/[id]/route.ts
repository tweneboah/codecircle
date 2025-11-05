import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { compose, requireAdmin, rateLimit, logRequest } from '@/lib/middleware';
import { getDefaultPermissions } from '@/lib/auth';

// Apply middleware
const middleware = compose(
  logRequest,
  rateLimit({ windowMs: 60000, maxRequests: 100 }),
  requireAdmin
);

// GET /api/admin/users/[id] - Get specific user details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const middlewareResult = await middleware(request);
  if (middlewareResult) return middlewareResult;

  try {
    await connectDB();

    const { id } = await context.params;
    const user = await User.findById(id)
      .select('-password -security.passwordResetToken -security.emailVerificationToken -security.twoFactorSecret')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user details
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const middlewareResult = await middleware(request);
  if (middlewareResult) return middlewareResult;

  try {
    const body = await request.json();
    const { 
      email, 
      profile, 
      role, 
      permissions, 
      isActive, 
      isBanned, 
      isVerified 
    } = body;

    await connectDB();

    const { id } = await context.params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from demoting themselves
    const currentUser = (request as any).user;
    if (user._id.toString() === currentUser._id.toString() && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    // Update fields
    const updateData: any = {};

    if (email && email !== user.email) {
      // Check if new email is already taken
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 409 }
        );
      }
      
      updateData.email = email.toLowerCase();
      updateData['security.emailVerified'] = false; // Require re-verification
    }

    if (profile) {
      // Check if new username is already taken
      if (profile.username && profile.username !== user.profile.username) {
        const existingUser = await User.findOne({ 
          'profile.username': profile.username.toLowerCase(),
          _id: { $ne: id }
        });
        
        if (existingUser) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 409 }
          );
        }
      }

      updateData.profile = { ...user.profile, ...profile };
      if (profile.username) {
        updateData.profile.username = profile.username.toLowerCase();
      }
    }

    if (role && role !== user.role) {
      updateData.role = role;
      // Update permissions based on new role if not explicitly provided
      if (!permissions) {
        updateData.permissions = getDefaultPermissions(role);
      }
    }

    if (permissions) {
      updateData.permissions = permissions;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (typeof isBanned === 'boolean') {
      updateData.isBanned = isBanned;
      // Clear lockout if unbanning
      if (!isBanned) {
        updateData['security.loginAttempts'] = 0;
        updateData['security.lockUntil'] = null;
      }
    }

    if (typeof isVerified === 'boolean') {
      updateData.isVerified = isVerified;
      updateData['security.emailVerified'] = isVerified;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -security.passwordResetToken -security.emailVerificationToken -security.twoFactorSecret');

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user account
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const middlewareResult = await middleware(request);
  if (middlewareResult) return middlewareResult;

  try {
    await connectDB();

    const { id } = await context.params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deleting themselves
    const currentUser = (request as any).user;
    if (user._id.toString() === currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Partial user updates (ban/unban, activate/deactivate)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const middlewareResult = await middleware(request);
  if (middlewareResult) return middlewareResult;

  try {
    const body = await request.json();
    const { action } = body;

    await connectDB();

    const { id } = await context.params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from affecting themselves
    const currentUser = (request as any).user;
    if (user._id.toString() === currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'Cannot perform this action on your own account' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'ban':
        updateData = { 
          isBanned: true,
          'security.loginAttempts': 0,
          'security.lockUntil': null
        };
        message = 'User banned successfully';
        break;

      case 'unban':
        updateData = { 
          isBanned: false,
          'security.loginAttempts': 0,
          'security.lockUntil': null
        };
        message = 'User unbanned successfully';
        break;

      case 'activate':
        updateData = { isActive: true };
        message = 'User activated successfully';
        break;

      case 'deactivate':
        updateData = { isActive: false };
        message = 'User deactivated successfully';
        break;

      case 'verify':
        updateData = { 
          isVerified: true,
          'security.emailVerified': true
        };
        message = 'User verified successfully';
        break;

      case 'unverify':
        updateData = { 
          isVerified: false,
          'security.emailVerified': false
        };
        message = 'User verification removed successfully';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password -security.passwordResetToken -security.emailVerificationToken -security.twoFactorSecret');

    return NextResponse.json({
      message,
      user: updatedUser
    });

  } catch (error) {
    console.error('Admin patch user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
