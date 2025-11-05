import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Project, { 
  CreateProjectInput, 
  defaultProjectStats, 
  defaultProjectMetadata, 
  defaultProjectMedia,
  validateProjectTitle,
  validateProjectDescription,
  validateTechStack,
  validateTags
} from '../../../../models/Project';
import Like from '../../../../models/Like';
import Comment from '../../../../models/Comment';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'draft', 'published', 'archived'
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'createdAt', 'likes', 'views'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc', 'desc'

    // Build filter
    const filter: any = { authorId: userId };
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      filter.status = status;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch projects with aggregation to include likes, comments, and views
    const projects = await Project.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'likes',
          let: { projectId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ['$targetId', '$$projectId'] },
                    { $eq: ['$targetType', 'project'] }
                  ]
                }
              }
            }
          ],
          as: 'likes'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'projectId',
          as: 'comments'
        }
      },
      {
        $addFields: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          views: { $ifNull: ['$views', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          techStack: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          thumbnail: 1,
          githubUrl: 1,
          liveUrl: 1,
          likes: '$likesCount',
          comments: '$commentsCount',
          views: 1
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalProjects = await Project.countDocuments(filter);
    const totalPages = Math.ceil(totalProjects / limit);

    // Format the response to match frontend expectations
    const formattedProjects = projects.map(project => ({
      _id: project._id.toString(),
      title: project.title,
      description: project.description,
      shortDescription: project.description?.substring(0, 100) + (project.description?.length > 100 ? '...' : ''),
      techStack: project.techStack || [],
      tags: project.tags || [],
      category: project.category || 'Other',
      status: project.status,
      difficulty: project.difficulty || 'Beginner',
      stats: {
        likes: project.likes || 0,
        comments: project.comments || 0,
        views: project.views || 0
      },
      createdAt: project.createdAt.toISOString(),
      thumbnail: project.thumbnail,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl
    }));

    return NextResponse.json({
      projects: formattedProjects,
      pagination: {
        currentPage: page,
        totalPages,
        totalProjects,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      isPublic
    }: CreateProjectInput = body;

    // Validate required fields
    if (!title || !description || !category || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, and difficulty are required' },
        { status: 400 }
      );
    }

    // Validate field formats
    if (!validateProjectTitle(title)) {
      return NextResponse.json(
        { error: 'Invalid title: must be 1-200 characters' },
        { status: 400 }
      );
    }

    if (!validateProjectDescription(description)) {
      return NextResponse.json(
        { error: 'Invalid description: must be 1-5000 characters' },
        { status: 400 }
      );
    }

    if (techStack && !validateTechStack(techStack)) {
      return NextResponse.json(
        { error: 'Invalid tech stack: must be an array with max 20 items' },
        { status: 400 }
      );
    }

    if (tags && !validateTags(tags)) {
      return NextResponse.json(
        { error: 'Invalid tags: must be an array with max 15 items' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['web-app', 'mobile-app', 'desktop-app', 'api', 'library', 'tool', 'game', 'ai-ml', 'blockchain', 'iot', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['planning', 'in-progress', 'completed', 'maintenance', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Create new project
    const newProject = new Project({
      title: title.trim(),
      description: description.trim(),
      shortDescription: shortDescription?.trim(),
      authorId: userId,
      techStack: techStack || [],
      tags: tags || [],
      category,
      status: status || 'planning',
      difficulty,
      media: defaultProjectMedia,
      links: links || {},
      stats: defaultProjectStats,
      metadata: defaultProjectMetadata,
      isPublic: isPublic !== undefined ? isPublic : true,
      isActive: true
    });

    const savedProject = await newProject.save();

    // Return the created project
    return NextResponse.json({
      success: true,
      project: {
        id: savedProject._id.toString(),
        title: savedProject.title,
        description: savedProject.description,
        shortDescription: savedProject.shortDescription,
        techStack: savedProject.techStack,
        tags: savedProject.tags,
        category: savedProject.category,
        status: savedProject.status,
        difficulty: savedProject.difficulty,
        links: savedProject.links,
        isPublic: savedProject.isPublic,
        createdAt: savedProject.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
