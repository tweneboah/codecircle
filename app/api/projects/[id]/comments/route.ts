import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import Comment from '@/models/Comment';
import mongoose from 'mongoose';

// GET /api/projects/[id]/comments - Get comments for a project
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id: projectId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'createdAt', 'likes'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc', 'desc'

    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    if (sortBy === 'likes') {
      sort['stats.likes'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Get comments with author information
    const comments = await Comment.aggregate([
      {
        $match: {
          projectId: new mongoose.Types.ObjectId(projectId),
          parentCommentId: null, // Only top-level comments
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parentCommentId',
          as: 'replies'
        }
      },
      {
        $addFields: {
          repliesCount: { $size: '$replies' }
        }
      },
      {
        $project: {
          content: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
          // Return stats with replies count mapped into stats.replies for UI
          stats: {
            likes: '$stats.likes',
            replies: '$repliesCount'
          },
          author: {
            _id: '$author._id',
            name: '$author.profile.name',
            username: '$author.profile.username',
            profileImage: '$author.profile.profilePhoto',
            isVerified: '$author.isVerified'
          }
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalComments = await Comment.countDocuments({
      projectId: new mongoose.Types.ObjectId(projectId),
      parentCommentId: null,
      isActive: true
    });

    const totalPages = Math.ceil(totalComments / limit);

    return NextResponse.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages,
        totalComments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id: projectId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse request body
    const { content, parentCommentId } = await request.json();

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment content is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Validate parent comment if provided
    let depth = 0;
    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return NextResponse.json(
          { error: 'Invalid parent comment ID' },
          { status: 400 }
        );
      }

      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      if (parentComment.projectId.toString() !== projectId) {
        return NextResponse.json(
          { error: 'Parent comment does not belong to this project' },
          { status: 400 }
        );
      }

      depth = parentComment.metadata.depth + 1;
      if (depth > 5) {
        return NextResponse.json(
          { error: 'Maximum comment depth exceeded' },
          { status: 400 }
        );
      }
    }

    // Create new comment
    const newComment = new Comment({
      content: content.trim(),
      authorId: user._id,
      projectId: new mongoose.Types.ObjectId(projectId),
      parentCommentId: parentCommentId ? new mongoose.Types.ObjectId(parentCommentId) : null,
      stats: {
        likes: 0,
        replies: 0,
        reportCount: 0
      },
      metadata: {
        isEdited: false,
        isPinned: false,
        isHidden: false,
        depth
      },
      isActive: true
    });

    await newComment.save();

    // Update parent comment reply count if this is a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(
        parentCommentId,
        { $inc: { 'stats.replies': 1 } }
      );
    }

    // Get the created comment with author info
    const commentWithAuthor = await Comment.aggregate([
      { $match: { _id: newComment._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $project: {
          content: 1,
          stats: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
          author: {
            _id: '$author._id',
            name: '$author.profile.name',
            username: '$author.profile.username',
            profileImage: '$author.profile.profilePhoto',
            isVerified: '$author.isVerified'
          }
        }
      }
    ]);

    return NextResponse.json({
      message: 'Comment created successfully',
      comment: commentWithAuthor[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
