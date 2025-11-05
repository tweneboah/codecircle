import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';

export interface ProjectMedia {
  screenshots: string[];
  demoVideo?: string; // YouTube URL or uploaded video
  thumbnail?: string;
}

export interface ProjectLinks {
  github?: string;
  liveDemo?: string;
  documentation?: string;
  repository?: string;
}

export interface ProjectStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  forks?: number; // If connected to GitHub
}

export interface ProjectMetadata {
  featured: boolean;
  trending: boolean;
  verified: boolean;
  reportCount: number;
  lastActivityAt: Date;
}

export interface Project extends Document {
  _id?: ObjectId;
  title: string;
  description: string;
  shortDescription?: string; // For cards/previews
  authorId: ObjectId;
  techStack: string[];
  tags: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  difficulty: ProjectDifficulty;
  media: ProjectMedia;
  links: ProjectLinks;
  stats: ProjectStats;
  metadata: ProjectMetadata;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectCategory = 
  | 'web-app'
  | 'mobile-app'
  | 'desktop-app'
  | 'api'
  | 'library'
  | 'tool'
  | 'game'
  | 'ai-ml'
  | 'blockchain'
  | 'iot'
  | 'other';

export type ProjectStatus = 
  | 'planning'
  | 'in-progress'
  | 'completed'
  | 'maintenance'
  | 'archived';

export type ProjectDifficulty = 
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export interface CreateProjectInput {
  title: string;
  description: string;
  shortDescription?: string;
  techStack: string[];
  tags: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  difficulty: ProjectDifficulty;
  links?: Partial<ProjectLinks>;
  isPublic?: boolean;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  shortDescription?: string;
  techStack?: string[];
  tags?: string[];
  category?: ProjectCategory;
  status?: ProjectStatus;
  difficulty?: ProjectDifficulty;
  links?: Partial<ProjectLinks>;
  isPublic?: boolean;
}

export interface ProjectWithAuthor extends Project {
  author: {
    _id: ObjectId;
    profile: {
      name: string;
      username: string;
      profilePhoto?: string;
    };
    isVerified: boolean;
  };
}

export interface ProjectCard {
  _id: ObjectId;
  title: string;
  shortDescription?: string;
  techStack: string[];
  tags: string[];
  category: ProjectCategory;
  difficulty: ProjectDifficulty;
  thumbnail?: string;
  stats: ProjectStats;
  author: {
    name: string;
    username: string;
    profilePhoto?: string;
    isVerified: boolean;
  };
  createdAt: Date;
  metadata: {
    featured: boolean;
    trending: boolean;
  };
}

export interface ProjectFilters {
  category?: ProjectCategory[];
  techStack?: string[];
  tags?: string[];
  difficulty?: ProjectDifficulty[];
  status?: ProjectStatus[];
  featured?: boolean;
  trending?: boolean;
  authorId?: ObjectId;
}

export interface ProjectSortOptions {
  field: 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'comments' | 'title';
  order: 'asc' | 'desc';
}

// Default values for new projects
export const defaultProjectStats: ProjectStats = {
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
};

export const defaultProjectMetadata: ProjectMetadata = {
  featured: false,
  trending: false,
  verified: false,
  reportCount: 0,
  lastActivityAt: new Date(),
};

export const defaultProjectMedia: ProjectMedia = {
  screenshots: [],
};

// Validation helpers
export const validateProjectTitle = (title: string): boolean => {
  return title.length >= 3 && title.length <= 100;
};

export const validateProjectDescription = (description: string): boolean => {
  return description.length >= 10 && description.length <= 5000;
};

export const validateTechStack = (techStack: string[]): boolean => {
  return techStack.length > 0 && techStack.length <= 20;
};

export const validateTags = (tags: string[]): boolean => {
  return tags.length <= 10 && tags.every(tag => tag.length <= 30);
};

// Popular tech stack options for autocomplete
export const popularTechStack = [
  'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js',
  'Node.js', 'Express', 'NestJS', 'FastAPI', 'Django',
  'Flask', 'Spring Boot', 'Laravel', 'Ruby on Rails',
  'TypeScript', 'JavaScript', 'Python', 'Java', 'C#',
  'Go', 'Rust', 'PHP', 'Swift', 'Kotlin', 'Dart',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
  'AWS', 'Google Cloud', 'Azure', 'Vercel', 'Netlify',
  'Docker', 'Kubernetes', 'GraphQL', 'REST API',
  'TailwindCSS', 'Bootstrap', 'Material-UI', 'Chakra UI'
];

// Popular project tags
export const popularTags = [
  'open-source', 'beginner-friendly', 'tutorial', 'portfolio',
  'startup', 'hackathon', 'side-project', 'learning',
  'production-ready', 'mvp', 'prototype', 'experiment',
  'responsive', 'mobile-first', 'pwa', 'real-time',
  'authentication', 'payment', 'social', 'e-commerce',
  'dashboard', 'admin-panel', 'blog', 'cms'
];

// Mongoose Schema
const ProjectSchema = new Schema<Project>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  techStack: [String],
  tags: [String],
  category: {
    type: String,
    enum: ['web-app', 'mobile-app', 'desktop-app', 'api', 'library', 'tool', 'game', 'ai-ml', 'blockchain', 'iot', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'maintenance', 'archived'],
    default: 'planning'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  media: {
    screenshots: [String],
    demoVideo: String,
    thumbnail: String
  },
  links: {
    github: String,
    liveDemo: String,
    documentation: String,
    repository: String
  },
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    forks: Number
  },
  metadata: {
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now }
  },
  isPublic: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for performance
ProjectSchema.index({ authorId: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ 'stats.likes': -1 });
ProjectSchema.index({ 'stats.views': -1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ 'metadata.featured': 1 });
ProjectSchema.index({ 'metadata.trending': 1 });

// Export the model
export default (mongoose.models?.Project as mongoose.Model<Project>) || mongoose.model<Project>('Project', ProjectSchema);