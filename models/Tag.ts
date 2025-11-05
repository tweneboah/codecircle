import { ObjectId } from 'mongodb';

export interface Tag {
  _id?: ObjectId;
  name: string;
  slug: string; // URL-friendly version of name
  description?: string;
  category: TagCategory;
  color?: string; // Hex color for UI display
  icon?: string; // Icon identifier or URL
  isOfficial: boolean; // Curated by admins
  isActive: boolean;
  stats: TagStats;
  createdBy?: ObjectId; // User who first used this tag
  createdAt: Date;
  updatedAt: Date;
}

export type TagCategory = 
  | 'technology' // React, Node.js, Python, etc.
  | 'framework' // Next.js, Express, Django, etc.
  | 'language' // JavaScript, TypeScript, Go, etc.
  | 'database' // MongoDB, PostgreSQL, Redis, etc.
  | 'cloud' // AWS, Google Cloud, Azure, etc.
  | 'tool' // Docker, Git, VS Code, etc.
  | 'concept' // AI, Machine Learning, Blockchain, etc.
  | 'industry' // E-commerce, Healthcare, Finance, etc.
  | 'project-type' // Web App, Mobile App, API, etc.
  | 'skill-level' // Beginner, Intermediate, Advanced, etc.
  | 'purpose' // Learning, Portfolio, Production, etc.
  | 'other';

export interface TagStats {
  usageCount: number; // Total times this tag has been used
  projectCount: number; // Number of projects with this tag
  userCount: number; // Number of unique users who used this tag
  recentUsage: number; // Usage in last 30 days
  trendingScore: number; // Calculated trending score
  lastUsedAt: Date;
}

export interface CreateTagInput {
  name: string;
  description?: string;
  category: TagCategory;
  color?: string;
  icon?: string;
}

export interface UpdateTagInput {
  name?: string;
  description?: string;
  category?: TagCategory;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export interface TagWithProjects extends Tag {
  recentProjects: {
    _id: ObjectId;
    title: string;
    author: {
      name: string;
      username: string;
    };
    stats: {
      likes: number;
      views: number;
    };
    createdAt: Date;
  }[];
  topProjects: {
    _id: ObjectId;
    title: string;
    author: {
      name: string;
      username: string;
    };
    stats: {
      likes: number;
      views: number;
    };
  }[];
}

export interface TagAnalytics {
  tag: Tag;
  usageHistory: {
    date: Date;
    count: number;
  }[];
  topUsers: {
    userId: ObjectId;
    username: string;
    usageCount: number;
    recentProjects: number;
  }[];
  relatedTags: {
    tag: Tag;
    coOccurrenceCount: number;
    similarity: number;
  }[];
  growthMetrics: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    popularityRank: number;
  };
}

// Tag validation
export const TAG_LIMITS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 30,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_TAGS_PER_PROJECT: 10,
  MAX_TAGS_PER_USER_SKILLS: 20,
};

export const validateTagName = (name: string): boolean => {
  const trimmedName = name.trim().toLowerCase();
  return trimmedName.length >= TAG_LIMITS.MIN_NAME_LENGTH && 
         trimmedName.length <= TAG_LIMITS.MAX_NAME_LENGTH &&
         /^[a-z0-9\-\+\#\.]+$/.test(trimmedName); // Allow alphanumeric, hyphens, plus, hash, dots
};

export const createTagSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-\+\#\.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Tag suggestions and recommendations
export interface TagSuggestion {
  tag: Tag;
  score: number;
  reason: TagSuggestionReason;
}

export type TagSuggestionReason = 
  | 'popular_in_category'
  | 'trending'
  | 'related_to_existing'
  | 'commonly_used_together'
  | 'user_history'
  | 'similar_projects';

export const calculateTagTrendingScore = (stats: TagStats): number => {
  const recentUsageWeight = 0.4;
  const totalUsageWeight = 0.3;
  const uniqueUsersWeight = 0.2;
  const recencyWeight = 0.1;
  
  const daysSinceLastUsed = (Date.now() - stats.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - (daysSinceLastUsed / 30)); // Decay over 30 days
  
  const score = (
    stats.recentUsage * recentUsageWeight +
    Math.log(stats.usageCount + 1) * totalUsageWeight +
    Math.log(stats.userCount + 1) * uniqueUsersWeight +
    recencyScore * recencyWeight
  );
  
  return Math.round(score * 100) / 100;
};

// Tag relationships and clustering
export interface TagRelationship {
  _id?: ObjectId;
  tag1Id: ObjectId;
  tag2Id: ObjectId;
  coOccurrenceCount: number;
  similarity: number; // 0-1 score based on how often they appear together
  lastUpdatedAt: Date;
}

export interface TagCluster {
  _id?: ObjectId;
  name: string;
  description?: string;
  tags: ObjectId[];
  category: TagCategory;
  isActive: boolean;
  createdAt: Date;
}

// Popular and trending tags
export interface TrendingTag extends Tag {
  trendingRank: number;
  growthRate: number; // Percentage growth in recent period
  momentum: 'rising' | 'stable' | 'declining';
}

export interface PopularTag extends Tag {
  popularityRank: number;
  categoryRank: number; // Rank within its category
}

// Tag search and filtering
export interface TagFilters {
  category?: TagCategory[];
  isOfficial?: boolean;
  isActive?: boolean;
  minUsageCount?: number;
  searchTerm?: string;
  usedByUser?: ObjectId;
  usedInProject?: ObjectId;
}

export interface TagSortOptions {
  field: 'name' | 'usageCount' | 'recentUsage' | 'trendingScore' | 'createdAt';
  order: 'asc' | 'desc';
}

// Default tag configurations
export const defaultTagStats: TagStats = {
  usageCount: 0,
  projectCount: 0,
  userCount: 0,
  recentUsage: 0,
  trendingScore: 0,
  lastUsedAt: new Date(),
};

// Predefined official tags by category
export const officialTags: Record<TagCategory, string[]> = {
  technology: ['react', 'vue', 'angular', 'svelte', 'solid'],
  framework: ['nextjs', 'nuxtjs', 'express', 'nestjs', 'fastapi', 'django', 'flask', 'spring-boot'],
  language: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'swift', 'kotlin'],
  database: ['mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'supabase', 'prisma'],
  cloud: ['aws', 'google-cloud', 'azure', 'vercel', 'netlify', 'heroku', 'digitalocean'],
  tool: ['docker', 'kubernetes', 'git', 'webpack', 'vite', 'eslint', 'prettier'],
  concept: ['ai', 'machine-learning', 'blockchain', 'web3', 'iot', 'microservices', 'serverless'],
  industry: ['ecommerce', 'healthcare', 'finance', 'education', 'gaming', 'social-media'],
  'project-type': ['web-app', 'mobile-app', 'desktop-app', 'api', 'library', 'cli-tool', 'game'],
  'skill-level': ['beginner', 'intermediate', 'advanced', 'expert'],
  purpose: ['learning', 'portfolio', 'production', 'experiment', 'tutorial', 'open-source'],
  other: ['responsive', 'pwa', 'real-time', 'authentication', 'payment', 'dashboard']
};

// Tag color schemes by category
export const tagColors: Record<TagCategory, string> = {
  technology: '#3B82F6', // Blue
  framework: '#8B5CF6', // Purple
  language: '#EF4444', // Red
  database: '#10B981', // Green
  cloud: '#F59E0B', // Yellow
  tool: '#6B7280', // Gray
  concept: '#EC4899', // Pink
  industry: '#14B8A6', // Teal
  'project-type': '#F97316', // Orange
  'skill-level': '#84CC16', // Lime
  purpose: '#06B6D4', // Cyan
  other: '#64748B' // Slate
};

// Tag usage tracking
export interface TagUsage {
  _id?: ObjectId;
  tagId: ObjectId;
  userId: ObjectId;
  projectId?: ObjectId;
  context: 'project' | 'skill' | 'search';
  createdAt: Date;
}

export interface TagUsageAnalytics {
  totalUsage: number;
  uniqueUsers: number;
  usageByContext: Record<string, number>;
  usageHistory: {
    date: Date;
    count: number;
  }[];
  topProjects: {
    projectId: ObjectId;
    title: string;
    usageCount: number;
  }[];
}