import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';

export interface Follow extends Document {
  _id?: ObjectId;
  followerId: ObjectId; // User who is following
  followingId: ObjectId; // User being followed
  createdAt: Date;
}

export interface CreateFollowInput {
  followerId: ObjectId;
  followingId: ObjectId;
}

export interface FollowStats {
  totalFollowers: number;
  totalFollowing: number;
  mutualFollows: number; // Users who follow each other
  recentFollowers: number; // New followers in last 7 days
  followerGrowthRate: number; // Percentage change from previous period
}

export interface FollowWithUser extends Follow {
  follower?: {
    _id: ObjectId;
    profile: {
      name: string;
      username: string;
      profilePhoto?: string;
      bio?: string;
    };
    stats: {
      projectsShared: number;
      followers: number;
    };
    isVerified: boolean;
  };
  following?: {
    _id: ObjectId;
    profile: {
      name: string;
      username: string;
      profilePhoto?: string;
      bio?: string;
    };
    stats: {
      projectsShared: number;
      followers: number;
    };
    isVerified: boolean;
  };
}

export interface UserConnections {
  userId: ObjectId;
  followers: FollowWithUser[];
  following: FollowWithUser[];
  mutualConnections: FollowWithUser[];
  stats: FollowStats;
}

export interface FollowRecommendation {
  user: {
    _id: ObjectId;
    profile: {
      name: string;
      username: string;
      profilePhoto?: string;
      bio?: string;
      skills: string[];
    };
    stats: {
      projectsShared: number;
      followers: number;
      votesReceived: number;
    };
    isVerified: boolean;
  };
  score: number;
  reasons: FollowRecommendationReason[];
}

export type FollowRecommendationReason = 
  | 'mutual_connections'
  | 'similar_skills'
  | 'popular_in_network'
  | 'active_contributor'
  | 'trending_projects'
  | 'same_location'
  | 'new_user';

export interface FollowAnalytics {
  userId: ObjectId;
  stats: FollowStats;
  followerHistory: {
    date: Date;
    followerCount: number;
    followingCount: number;
  }[];
  topFollowers: FollowWithUser[]; // Most influential followers
  followingBreakdown: {
    bySkills: { skill: string; count: number }[];
    byLocation: { location: string; count: number }[];
    byVerificationStatus: { verified: number; unverified: number };
  };
}

// Validation helpers
export const canUserFollow = (followerId: ObjectId, followingId: ObjectId): boolean => {
  // Users can't follow themselves
  return !followerId.equals(followingId);
};

export const validateFollowRelationship = (follow: CreateFollowInput): boolean => {
  return canUserFollow(follow.followerId, follow.followingId);
};

// Follow relationship helpers
export const checkMutualFollow = async (
  userId1: ObjectId,
  userId2: ObjectId,
  existingFollows: Follow[]
): Promise<boolean> => {
  const follow1 = existingFollows.find(f => 
    f.followerId.equals(userId1) && f.followingId.equals(userId2)
  );
  const follow2 = existingFollows.find(f => 
    f.followerId.equals(userId2) && f.followingId.equals(userId1)
  );
  
  return !!(follow1 && follow2);
};

export const getFollowStatus = (
  currentUserId: ObjectId,
  targetUserId: ObjectId,
  follows: Follow[]
): FollowStatus => {
  const isFollowing = follows.some(f => 
    f.followerId.equals(currentUserId) && f.followingId.equals(targetUserId)
  );
  const isFollowedBy = follows.some(f => 
    f.followerId.equals(targetUserId) && f.followingId.equals(currentUserId)
  );
  
  if (isFollowing && isFollowedBy) return 'mutual';
  if (isFollowing) return 'following';
  if (isFollowedBy) return 'followed_by';
  return 'none';
};

export type FollowStatus = 'following' | 'followed_by' | 'mutual' | 'none';

// Follow recommendation algorithm
export const calculateRecommendationScore = (
  targetUser: any,
  currentUser: any,
  mutualConnections: number,
  commonSkills: number
): number => {
  let score = 0;
  
  // Base score from user activity
  score += Math.min(targetUser.stats.projectsShared * 2, 20);
  score += Math.min(targetUser.stats.followers * 0.1, 10);
  score += Math.min(targetUser.stats.votesReceived * 0.05, 15);
  
  // Mutual connections boost
  score += mutualConnections * 5;
  
  // Common skills boost
  score += commonSkills * 3;
  
  // Verification boost
  if (targetUser.isVerified) score += 5;
  
  // Recency boost for new users (encourage welcoming new members)
  const daysSinceJoined = (Date.now() - targetUser.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceJoined <= 30) score += 3;
  
  return Math.round(score * 100) / 100;
};

export const getRecommendationReasons = (
  targetUser: any,
  currentUser: any,
  mutualConnections: number,
  commonSkills: number
): FollowRecommendationReason[] => {
  const reasons: FollowRecommendationReason[] = [];
  
  if (mutualConnections > 0) reasons.push('mutual_connections');
  if (commonSkills > 2) reasons.push('similar_skills');
  if (targetUser.stats.followers > 100) reasons.push('popular_in_network');
  if (targetUser.stats.projectsShared > 5) reasons.push('active_contributor');
  if (targetUser.profile.location === currentUser.profile.location) reasons.push('same_location');
  
  const daysSinceJoined = (Date.now() - targetUser.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceJoined <= 7) reasons.push('new_user');
  
  return reasons;
};

// Follow notification types
export type FollowNotificationType = 
  | 'new_follower'
  | 'mutual_follow'
  | 'follower_milestone'; // When reaching follower milestones

export interface FollowNotification {
  _id?: ObjectId;
  type: FollowNotificationType;
  recipientId: ObjectId;
  followerId: ObjectId;
  milestone?: number; // For milestone notifications
  isRead: boolean;
  createdAt: Date;
}

// Pagination and filtering
export interface FollowFilters {
  userId?: ObjectId;
  isVerified?: boolean;
  hasProjects?: boolean;
  skills?: string[];
  location?: string;
  joinedAfter?: Date;
  joinedBefore?: Date;
}

export interface FollowPagination {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'followerCount' | 'projectCount' | 'name';
  sortOrder: 'asc' | 'desc';
}

// Constants
export const FOLLOW_LIMITS = {
  MAX_FOLLOWING_PER_DAY: 100,
  MAX_TOTAL_FOLLOWING: 5000,
  RECOMMENDATION_BATCH_SIZE: 20,
  MUTUAL_CONNECTIONS_LIMIT: 50,
};

// Growth analytics
export const calculateFollowerGrowthRate = (
  currentFollowers: number,
  previousFollowers: number
): number => {
  if (previousFollowers === 0) {
    return currentFollowers > 0 ? 100 : 0;
  }
  
  return ((currentFollowers - previousFollowers) / previousFollowers) * 100;
};

export interface FollowTrend {
  period: 'daily' | 'weekly' | 'monthly';
  data: {
    date: Date;
    newFollowers: number;
    unfollows: number;
    netGrowth: number;
  }[];
}

// Mongoose Schema
const FollowSchema = new Schema<Follow>({
  followerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followingId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate follows
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Indexes for performance
FollowSchema.index({ followerId: 1 });
FollowSchema.index({ followingId: 1 });
FollowSchema.index({ createdAt: -1 });

// Export the model
export default (mongoose.models?.Follow as mongoose.Model<Follow>) || mongoose.model<Follow>('Follow', FollowSchema);