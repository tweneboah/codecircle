import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Project from '../../../../models/Project';
import Like from '../../../../models/Like';
import Comment from '../../../../models/Comment';
import Follow from '../../../../models/Follow';

interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'project';
  message: string;
  timestamp: string;
  user?: string;
  projectTitle?: string;
  createdAt: Date;
}

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const activities: ActivityItem[] = [];

    // Get recent likes on user's projects
    const recentLikes = await Like.aggregate([
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
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'liker'
        }
      },
      {
        $match: {
          'project.authorId': userId
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      }
    ]);

    recentLikes.forEach(like => {
      if (like.project[0] && like.liker[0]) {
        activities.push({
          id: like._id.toString(),
          type: 'like',
          message: `${like.liker[0].name} liked your project "${like.project[0].title}"`,
          timestamp: formatTimestamp(like.createdAt),
          user: like.liker[0].name,
          projectTitle: like.project[0].title,
          createdAt: like.createdAt
        });
      }
    });

    // Get recent comments on user's projects
    const recentComments = await Comment.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'commenter'
        }
      },
      {
        $match: {
          'project.authorId': userId
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      }
    ]);

    recentComments.forEach(comment => {
      if (comment.project[0] && comment.commenter[0]) {
        activities.push({
          id: comment._id.toString(),
          type: 'comment',
          message: `${comment.commenter[0].name} commented on "${comment.project[0].title}"`,
          timestamp: formatTimestamp(comment.createdAt),
          user: comment.commenter[0].name,
          projectTitle: comment.project[0].title,
          createdAt: comment.createdAt
        });
      }
    });

    // Get recent followers
    const recentFollows = await Follow.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'followerId',
          foreignField: '_id',
          as: 'follower'
        }
      },
      {
        $match: {
          followingId: userId
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      }
    ]);

    recentFollows.forEach(follow => {
      if (follow.follower[0]) {
        activities.push({
          id: follow._id.toString(),
          type: 'follow',
          message: `${follow.follower[0].name} started following you`,
          timestamp: formatTimestamp(follow.createdAt),
          user: follow.follower[0].name,
          createdAt: follow.createdAt
        });
      }
    });

    // Get recent project publications
    const recentProjects = await Project.find({
      userId,
      status: 'published'
    })
    .sort({ createdAt: -1 })
    .limit(5);

    recentProjects.forEach(project => {
      activities.push({
        id: project._id.toString(),
        type: 'project',
        message: `You published "${project.title}"`,
        timestamp: formatTimestamp(project.createdAt),
        projectTitle: project.title,
        createdAt: project.createdAt
      });
    });

    // Sort all activities by creation date and limit
    const sortedActivities = activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map(activity => ({
        id: activity.id,
        type: activity.type,
        message: activity.message,
        timestamp: activity.timestamp,
        user: activity.user,
        projectTitle: activity.projectTitle
      }));

    return NextResponse.json({ activities: sortedActivities });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
