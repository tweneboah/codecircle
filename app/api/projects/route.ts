import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const q = (searchParams.get('q') || '').trim();
    const tagsParam = (searchParams.get('tags') || '').trim();
    const techParam = (searchParams.get('tech') || '').trim();
    const categoryParam = (searchParams.get('category') || '').trim();
    const difficultyParam = (searchParams.get('difficulty') || '').trim();
    const featuredParam = (searchParams.get('featured') || '').trim();
    const trendingParam = (searchParams.get('trending') || '').trim();
    const sortParam = (searchParams.get('sort') || 'createdAt').trim();
    const orderParam = (searchParams.get('order') || 'desc').trim();

    const skip = (page - 1) * limit;

    // Simple, public listing: only basic pagination, no auth or complex filters/sorts
    const filter: any = { isPublic: true, isActive: true };

    // Text search across title, description, tags, techStack
    if (q) {
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeQ, 'i');
      filter.$or = [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { tags: { $elemMatch: { $regex: regex } } },
        { techStack: { $elemMatch: { $regex: regex } } },
      ];
    }

    // Tags filter (comma-separated)
    if (tagsParam) {
      const tags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length) {
        filter.tags = { $in: tags };
      }
    }

    // Tech stack filter (comma-separated)
    if (techParam) {
      const tech = techParam.split(',').map(t => t.trim()).filter(Boolean);
      if (tech.length) {
        filter.techStack = { $in: tech };
      }
    }

    // Category filter (single or CSV)
    if (categoryParam) {
      const cats = categoryParam.split(',').map(c => c.trim()).filter(Boolean);
      if (cats.length === 1) {
        filter.category = cats[0];
      } else if (cats.length > 1) {
        filter.category = { $in: cats };
      }
    }

    // Difficulty filter (CSV; stored lowercase)
    if (difficultyParam) {
      const diffs = difficultyParam
        .split(',')
        .map(d => d.trim().toLowerCase())
        .filter(Boolean);
      if (diffs.length === 1) {
        filter.difficulty = diffs[0];
      } else if (diffs.length > 1) {
        filter.difficulty = { $in: diffs };
      }
    }

    // Featured/Trending toggles
    if (featuredParam === 'true') {
      filter['metadata.featured'] = true;
    }
    if (trendingParam === 'true') {
      filter['metadata.trending'] = true;
    }

    // Sorting
    const sortFieldMap: Record<string, string> = {
      recent: 'createdAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      likes: 'stats.likes',
      comments: 'stats.comments',
      views: 'stats.views',
      title: 'title',
    };
    const sortField = sortFieldMap[sortParam] || 'createdAt';
    const sortOrder = orderParam === 'asc' ? 1 : -1;
    const sortQuery: any = { [sortField]: sortOrder };

    // Aggregate projects with author info and computed stats (likes & comments)
    const projectsAggregation = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $unwind: '$authorInfo'
      },
      // Compute likes count from Likes collection
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
          as: 'likesDocs'
        }
      },
      // Compute top-level comments count from Comments collection
      {
        $lookup: {
          from: 'comments',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$projectId', '$$projectId'] },
                isActive: true,
                parentCommentId: null
              }
            }
          ],
          as: 'commentsDocs'
        }
      },
      { $sort: sortQuery },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          shortDescription: 1,
          githubUrl: '$links.github',
          liveUrl: '$links.liveDemo',
          imageUrl: '$media.thumbnail',
          tags: 1,
          category: 1,
          // Map difficulty to Title Case expected by UI
          difficulty: {
            $switch: {
              branches: [
                { case: { $eq: ['$difficulty', 'beginner'] }, then: 'Beginner' },
                { case: { $eq: ['$difficulty', 'intermediate'] }, then: 'Intermediate' },
                { case: { $eq: ['$difficulty', 'advanced'] }, then: 'Advanced' },
                { case: { $eq: ['$difficulty', 'expert'] }, then: 'Expert' },
              ],
              default: 'Beginner'
            }
          },
          techStack: 1,
          createdAt: 1,
          updatedAt: 1,
          author: {
            _id: '$authorInfo._id',
            name: '$authorInfo.profile.name',
            username: '$authorInfo.profile.username',
            profileImage: '$authorInfo.profile.profilePhoto'
          },
          stats: {
            // Prefer computed counts; fall back to stored stats if present
            likes: { $ifNull: [ { $size: '$likesDocs' }, { $ifNull: ['$stats.likes', 0] } ] },
            comments: { $ifNull: [ { $size: '$commentsDocs' }, { $ifNull: ['$stats.comments', 0] } ] },
            views: { $ifNull: ['$stats.views', 0] }
          }
        }
      }
    ];

    // Get total count for pagination
    const totalCountAggregation = [
      { $match: filter },
      { $count: 'total' }
    ];

    const [projects, totalCountResult] = await Promise.all([
      Project.aggregate(projectsAggregation),
      Project.aggregate(totalCountAggregation)
    ]);

    const totalProjects = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalProjects / limit);

    const response = {
      projects,
      pagination: {
        currentPage: page,
        totalPages,
        totalProjects,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
