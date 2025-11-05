import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import User from '@/models/User';
import Like from '@/models/Like';
import mongoose from 'mongoose';

// POST /api/projects/[id]/comments/[commentId]/like - Toggle like on a comment
export async function POST(
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

    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user already liked this comment
    const existingLike = await Like.findOne({
      userId: user._id,
      targetId: new mongoose.Types.ObjectId(commentId),
      targetType: 'comment'
    });

    let message: string;
    let liked: boolean;

    if (existingLike) {
      // Unlike the comment
      await Like.deleteOne({ _id: existingLike._id });
      await Comment.findByIdAndUpdate(commentId, {
        $inc: { 'stats.likes': -1 }
      });
      message = 'Comment unliked successfully';
      liked = false;
    } else {
      // Like the comment
      const newLike = new Like({
        userId: user._id,
        targetId: new mongoose.Types.ObjectId(commentId),
        targetType: 'comment'
      });
      await newLike.save();
      await Comment.findByIdAndUpdate(commentId, {
        $inc: { 'stats.likes': 1 }
      });
      message = 'Comment liked successfully';
      liked = true;
    }

    // Get updated comment stats
    const updatedComment = await Comment.findById(commentId);

    return NextResponse.json({
      message,
      liked,
      likesCount: updatedComment.stats.likes
    });

  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
