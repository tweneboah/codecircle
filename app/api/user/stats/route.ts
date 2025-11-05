import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Project from '@/models/Project';
import Comment from '@/models/Comment';
import Follow from '@/models/Follow';
import Like from '@/models/Like';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user ID
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user._id;

    // Fetch all statistics in parallel
    const [
      totalProjects,
      totalLikes,
      totalComments,
      totalFollowers,
      totalFollowing,
      profileViews
    ] = await Promise.all([
      // Count user's projects
      Project.countDocuments({ authorId: userId }),
      
      // Count total likes on user's projects
      Like.aggregate([
        {
          $match: {
            targetType: 'project'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'targetId',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $match: {
            'project.authorId': userId
          }
        },
        {
          $count: 'totalLikes'
        }
      ]).then(result => result[0]?.totalLikes || 0),
      
      // Count total comments on user's projects
      Comment.aggregate([
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $match: {
            'project.authorId': userId
          }
        },
        {
          $count: 'totalComments'
        }
      ]).then(result => result[0]?.totalComments || 0),
      
      // Count followers
      Follow.countDocuments({ followingId: userId }),
      
      // Count following
      Follow.countDocuments({ followerId: userId }),
      
      // Get profile views from user document
      user.profileViews || 0
    ]);

    const stats = {
      totalProjects,
      totalLikes,
      totalComments,
      totalFollowers,
      totalFollowing,
      profileViews
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}