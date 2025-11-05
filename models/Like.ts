import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';

export type LikeableType = 'project' | 'comment';

export interface Like extends Document {
  _id?: ObjectId;
  userId: ObjectId;
  targetId: ObjectId; // ID of the project or comment being liked
  targetType: LikeableType;
  createdAt: Date;
}

export interface CreateLikeInput {
  userId: ObjectId;
  targetId: ObjectId;
  targetType: LikeableType;
}

export interface LikeStats {
  totalLikes: number;
  recentLikes: number; // Likes in the last 24 hours
  likeGrowthRate: number; // Percentage change from previous period
}

export interface LikeWithUser extends Like {
  user: {
    _id: ObjectId;
    profile: {
      name: string;
      username: string;
      profilePhoto?: string;
    };
    isVerified: boolean;
  };
}

export interface LikeAnalytics {
  targetId: ObjectId;
  targetType: LikeableType;
  stats: LikeStats;
  topLikers: LikeWithUser[]; // Most active users who liked this content
  likeHistory: {
    date: Date;
    count: number;
  }[];
}

export interface UserLikeActivity {
  userId: ObjectId;
  totalLikesGiven: number;
  totalLikesReceived: number;
  recentActivity: Like[];
  topLikedContent: {
    targetId: ObjectId;
    targetType: LikeableType;
    likeCount: number;
    title?: string; // For projects
    content?: string; // For comments (truncated)
  }[];
}

// Validation helpers
export const validateLikeTarget = (targetType: LikeableType): boolean => {
  return ['project', 'comment'].includes(targetType);
};

export const canUserLike = (userId: ObjectId, targetUserId: ObjectId): boolean => {
  // Users can't like their own content
  return !userId.equals(targetUserId);
};

// Anti-spam measures
export interface LikeRateLimit {
  userId: ObjectId;
  likesInLastHour: number;
  likesInLastDay: number;
  lastLikeAt: Date;
}

export const LIKE_RATE_LIMITS = {
  MAX_LIKES_PER_HOUR: 100,
  MAX_LIKES_PER_DAY: 500,
  MIN_TIME_BETWEEN_LIKES: 1000, // 1 second in milliseconds
};

export const checkLikeRateLimit = (rateLimit: LikeRateLimit): boolean => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Check if user exceeded hourly limit
  if (rateLimit.likesInLastHour >= LIKE_RATE_LIMITS.MAX_LIKES_PER_HOUR) {
    return false;
  }
  
  // Check if user exceeded daily limit
  if (rateLimit.likesInLastDay >= LIKE_RATE_LIMITS.MAX_LIKES_PER_DAY) {
    return false;
  }
  
  // Check minimum time between likes
  const timeSinceLastLike = now.getTime() - rateLimit.lastLikeAt.getTime();
  if (timeSinceLastLike < LIKE_RATE_LIMITS.MIN_TIME_BETWEEN_LIKES) {
    return false;
  }
  
  return true;
};

// Like aggregation helpers
export interface LikeAggregation {
  _id: ObjectId;
  targetType: LikeableType;
  likeCount: number;
  uniqueLikers: number;
  averageLikesPerDay: number;
  peakLikeDay: {
    date: Date;
    count: number;
  };
}

export const calculateLikeGrowthRate = (
  currentPeriodLikes: number,
  previousPeriodLikes: number
): number => {
  if (previousPeriodLikes === 0) {
    return currentPeriodLikes > 0 ? 100 : 0;
  }
  
  return ((currentPeriodLikes - previousPeriodLikes) / previousPeriodLikes) * 100;
};

// Trending calculation based on likes
export interface TrendingScore {
  targetId: ObjectId;
  targetType: LikeableType;
  score: number;
  factors: {
    recentLikes: number;
    totalLikes: number;
    likeVelocity: number; // Likes per hour
    recencyBoost: number;
  };
}

export const calculateTrendingScore = (
  totalLikes: number,
  recentLikes: number,
  hoursOld: number
): number => {
  const likeVelocity = recentLikes / Math.max(hoursOld, 1);
  const recencyBoost = Math.max(0, 1 - (hoursOld / 168)); // Boost for content less than a week old
  
  // Weighted formula for trending score
  const score = (
    totalLikes * 0.3 +
    recentLikes * 0.4 +
    likeVelocity * 0.2 +
    recencyBoost * 0.1
  );
  
  return Math.round(score * 100) / 100;
};

// Like notification types
export type LikeNotificationType = 
  | 'project_liked'
  | 'comment_liked'
  | 'milestone_likes'; // When reaching like milestones (10, 50, 100, etc.)

export interface LikeNotification {
  _id?: ObjectId;
  type: LikeNotificationType;
  recipientId: ObjectId; // Owner of the liked content
  likerId: ObjectId; // User who liked the content
  targetId: ObjectId; // The liked project/comment
  targetType: LikeableType;
  milestone?: number; // For milestone notifications
  isRead: boolean;
  createdAt: Date;
}

// Batch operations for performance
export interface BatchLikeOperation {
  operation: 'create' | 'delete';
  likes: CreateLikeInput[];
}

export interface LikeOperationResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  duplicates: number; // For create operations
  notFound: number; // For delete operations
}

// Mongoose Schema
const LikeSchema = new Schema<Like>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    enum: ['project', 'comment'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate likes
LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

// Indexes for performance
LikeSchema.index({ targetId: 1, targetType: 1 });
LikeSchema.index({ userId: 1 });
LikeSchema.index({ createdAt: -1 });

// Export the model
export default (mongoose.models?.Like as mongoose.Model<Like>) || mongoose.model<Like>('Like', LikeSchema);