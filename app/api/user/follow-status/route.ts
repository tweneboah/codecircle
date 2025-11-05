import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Follow from '@/models/Follow';
import mongoose from 'mongoose';

// GET /api/user/follow-status?userId=xxx - Check follow status with a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { error: 'Valid user ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Check if current user is following target user
    const isFollowing = await Follow.findOne({
      followerId: currentUser._id,
      followingId: new mongoose.Types.ObjectId(targetUserId)
    });

    // Check if target user is following current user (mutual follow)
    const isFollowedBy = await Follow.findOne({
      followerId: new mongoose.Types.ObjectId(targetUserId),
      followingId: currentUser._id
    });

    return NextResponse.json({
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
      isMutual: !!isFollowing && !!isFollowedBy,
      followersCount: targetUser.stats.followers,
      followingCount: targetUser.stats.following
    });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/follow-status - Batch check follow status for multiple users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Array of user IDs is required' },
        { status: 400 }
      );
    }

    // Validate all user IDs
    const validUserIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validUserIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid user IDs provided' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all follow relationships for current user
    const followingRelationships = await Follow.find({
      followerId: currentUser._id,
      followingId: { $in: validUserIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    const followedByRelationships = await Follow.find({
      followerId: { $in: validUserIds.map(id => new mongoose.Types.ObjectId(id)) },
      followingId: currentUser._id
    });

    // Create lookup maps
    const followingMap = new Map();
    followingRelationships.forEach(follow => {
      followingMap.set(follow.followingId.toString(), true);
    });

    const followedByMap = new Map();
    followedByRelationships.forEach(follow => {
      followedByMap.set(follow.followerId.toString(), true);
    });

    // Build response
    const followStatus = validUserIds.map(userId => ({
      userId,
      isFollowing: followingMap.has(userId) || false,
      isFollowedBy: followedByMap.has(userId) || false,
      isMutual: (followingMap.has(userId) && followedByMap.has(userId)) || false
    }));

    return NextResponse.json({ followStatus });

  } catch (error) {
    console.error('Error checking batch follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
