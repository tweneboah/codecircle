import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Follow from '@/models/Follow';
import mongoose from 'mongoose';

// GET /api/user/[userId]/followers - Get user's followers
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { userId } = params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build match query for search
    const matchQuery: any = {
      followingId: new mongoose.Types.ObjectId(userId)
    };

    // Get current user to check follow status
    const currentUser = await User.findOne({ email: session.user.email });

    // Get followers with user information
    const followersAggregation = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'followerId',
          foreignField: '_id',
          as: 'follower'
        }
      },
      {
        $unwind: '$follower'
      }
    ];

    // Add search filter if provided
    if (search) {
      followersAggregation.push({
        $match: {
          $or: [
            { 'follower.profile.name': { $regex: search, $options: 'i' } },
            { 'follower.profile.username': { $regex: search, $options: 'i' } }
          ]
        }
      } as any);
    }

    // Add lookup for current user's follow status
    if (currentUser) {
      followersAggregation.push({
        $lookup: {
          from: 'follows',
          let: { followerId: '$follower._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$followerId', currentUser._id] },
                    { $eq: ['$followingId', '$$followerId'] }
                  ]
                }
              }
            }
          ],
          as: 'currentUserFollows'
        }
      } as any);
    }

    followersAggregation.push(
      {
        $project: {
          createdAt: 1,
          follower: {
            _id: 1,
            profile: {
              name: 1,
              username: 1,
              profilePhoto: 1,
              bio: 1
            },
            stats: {
              followers: 1,
              following: 1,
              projects: 1
            },
            isVerified: 1
          },
          isFollowedByCurrentUser: {
            $gt: [{ $size: '$currentUserFollows' }, 0]
          }
        }
      } as any,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const followers = await Follow.aggregate(followersAggregation);

    // Get total count for pagination
    const totalFollowers = await Follow.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalFollowers / limit);

    return NextResponse.json({
      followers,
      pagination: {
        currentPage: page,
        totalPages,
        totalFollowers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
