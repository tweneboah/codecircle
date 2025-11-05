import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Follow from "@/models/Follow";
import mongoose from "mongoose";

// POST /api/user/[userId]/follow - Toggle follow/unfollow a user
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { userId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Prevent self-following
    if (currentUser._id.toString() === userId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      followerId: currentUser._id,
      followingId: new mongoose.Types.ObjectId(userId),
    });

    let message: string;
    let isFollowing: boolean;

    if (existingFollow) {
      // Unfollow
      await Follow.deleteOne({ _id: existingFollow._id });

      // Update follower/following counts
      await Promise.all([
        User.findByIdAndUpdate(currentUser._id, {
          $inc: { "stats.following": -1 },
        }),
        User.findByIdAndUpdate(userId, {
          $inc: { "stats.followers": -1 },
        }),
      ]);

      message = "User unfollowed successfully";
      isFollowing = false;
    } else {
      // Follow
      const newFollow = new Follow({
        followerId: currentUser._id,
        followingId: new mongoose.Types.ObjectId(userId),
      });
      await newFollow.save();

      // Update follower/following counts
      await Promise.all([
        User.findByIdAndUpdate(currentUser._id, {
          $inc: { "stats.following": 1 },
        }),
        User.findByIdAndUpdate(userId, {
          $inc: { "stats.followers": 1 },
        }),
      ]);

      message = "User followed successfully";
      isFollowing = true;
    }

    // Get updated user stats
    const updatedTargetUser = await User.findById(userId);

    return NextResponse.json({
      message,
      isFollowing,
      followersCount: updatedTargetUser.stats.followers,
    });
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
