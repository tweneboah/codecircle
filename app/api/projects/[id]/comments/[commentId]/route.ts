import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET /api/projects/[id]/comments/[commentId] - Get a specific comment with replies
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { commentId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    // Get comment with author and replies
    const comment = await Comment.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(commentId),
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
          let: { commentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$parentCommentId', '$$commentId'] },
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
            },
            { $sort: { createdAt: 1 } }
          ],
          as: 'replies'
        }
      },
      {
        $project: {
          content: 1,
          stats: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
          replies: 1,
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

    if (!comment || comment.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ comment: comment[0] });

  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { commentId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user owns the comment
    if (comment.authorId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Parse request body
    const { content } = await request.json();

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

    // Update comment
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        content: content.trim(),
        'metadata.isEdited': true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedComment) {
      return NextResponse.json({ error: 'Comment not found after update' }, { status: 404 });
    }

    // Get updated comment with author info
    const commentWithAuthor = await Comment.aggregate([
      { $match: { _id: updatedComment._id } },
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
      message: 'Comment updated successfully',
      comment: commentWithAuthor[0]
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { commentId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user owns the comment or is admin
    if (comment.authorId.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Soft delete the comment (mark as inactive)
    await Comment.findByIdAndUpdate(commentId, {
      isActive: false,
      content: '[Comment deleted]',
      updatedAt: new Date()
    });

    // Update parent comment reply count if this is a reply
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(
        comment.parentCommentId,
        { $inc: { 'stats.replies': -1 } }
      );
    }

    // Soft delete all replies to this comment
    await Comment.updateMany(
      { parentCommentId: commentId },
      {
        isActive: false,
        content: '[Comment deleted]',
        updatedAt: new Date()
      }
    );

    return NextResponse.json({
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
