import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Project, { 
  validateProjectTitle,
  validateProjectDescription,
  validateTechStack,
  validateTags
} from '../../../../models/Project';
import Like from '../../../../models/Like';
import Comment from '../../../../models/Comment';

// GET /api/projects/[id] - Get specific project details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Find the project and ensure it belongs to the user
    const { id } = await context.params;

    const project = await Project.findOne({ 
      _id: id, 
      authorId: userId 
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get project stats
    const [likesCount, commentsCount] = await Promise.all([
      Like.countDocuments({ 
        targetId: id, 
        targetType: 'project' 
      }),
      Comment.countDocuments({ projectId: id })
    ]);

    const projectWithStats = {
      ...project.toObject(),
      stats: {
        likes: likesCount,
        comments: commentsCount,
        views: project.views || 0
      }
    };

    return NextResponse.json({ project: projectWithStats });

  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Find the project and ensure it belongs to the user
    const { id } = await context.params;

    const existingProject = await Project.findOne({ 
      _id: id, 
      authorId: userId 
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      shortDescription,
      techStack,
      tags,
      category,
      status,
      difficulty,
      links,
      isPublic,
      thumbnail
    } = body;

    // Validate fields if provided
    if (title !== undefined) {
      if (!validateProjectTitle(title)) {
        return NextResponse.json(
          { error: 'Invalid title: must be 1-200 characters' },
          { status: 400 }
        );
      }
    }

    if (description !== undefined) {
      if (!validateProjectDescription(description)) {
        return NextResponse.json(
          { error: 'Invalid description: must be 1-5000 characters' },
          { status: 400 }
        );
      }
    }

    if (techStack !== undefined) {
      if (!validateTechStack(techStack)) {
        return NextResponse.json(
          { error: 'Invalid tech stack: must be an array with max 20 items' },
          { status: 400 }
        );
      }
    }

    if (tags !== undefined) {
      if (!validateTags(tags)) {
        return NextResponse.json(
          { error: 'Invalid tags: must be an array with max 15 items' },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    if (category !== undefined) {
      const validCategories = ['web-app', 'mobile-app', 'desktop-app', 'api', 'library', 'tool', 'game', 'ai-ml', 'blockchain', 'iot', 'other'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
    }

    // Validate difficulty if provided
    if (difficulty !== undefined) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validDifficulties.includes(difficulty)) {
        return NextResponse.json(
          { error: 'Invalid difficulty level' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (techStack !== undefined) updateData.techStack = techStack;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (links !== undefined) updateData.links = links;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      message: 'Project updated successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Find the project and ensure it belongs to the user
    const { id } = await context.params;

    const project = await Project.findOne({ 
      _id: id, 
      authorId: userId 
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Delete associated data
    await Promise.all([
      Like.deleteMany({ projectId: id }),
      Comment.deleteMany({ projectId: id }),
      Project.findByIdAndDelete(id)
    ]);

    return NextResponse.json({
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
