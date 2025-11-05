import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import User from "@/models/User";
import Like from "@/models/Like";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id: projectId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user already liked this project
    const existingLike = await Like.findOne({
      userId: user._id,
      targetId: new mongoose.Types.ObjectId(projectId),
      targetType: "project",
    });

    if (existingLike) {
      // Unlike: Remove the like
      await Like.deleteOne({ _id: existingLike._id });

      return NextResponse.json({
        message: "Project unliked successfully",
        liked: false,
      });
    } else {
      // Like: Create new like
      const newLike = new Like({
        userId: user._id,
        targetId: new mongoose.Types.ObjectId(projectId),
        targetType: "project",
      });

      await newLike.save();

      return NextResponse.json({
        message: "Project liked successfully",
        liked: true,
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
