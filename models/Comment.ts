import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';

export interface CommentStats {
  likes: number;
  replies: number;
  reportCount: number;
}

export interface CommentMetadata {
  isEdited: boolean;
  editedAt?: Date;
  isPinned: boolean;
  isHidden: boolean;
  depth: number; // For threading depth control
}

export interface Comment extends Document {
  _id?: ObjectId;
  content: string;
  authorId: ObjectId;
  projectId: ObjectId;
  parentCommentId?: ObjectId; // For threading/replies
  stats: CommentStats;
  metadata: CommentMetadata;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentInput {
  content: string;
  projectId: ObjectId;
  parentCommentId?: ObjectId;
}

export interface UpdateCommentInput {
  content: string;
}

export interface CommentWithAuthor extends Comment {
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

export interface CommentThread extends CommentWithAuthor {
  replies: CommentWithAuthor[];
  hasMoreReplies: boolean;
  totalReplies: number;
}

export interface CommentFilters {
  projectId?: ObjectId;
  authorId?: ObjectId;
  parentCommentId?: ObjectId;
  isActive?: boolean;
  isPinned?: boolean;
}

export interface CommentSortOptions {
  field: "createdAt" | "likes" | "replies";
  order: "asc" | "desc";
}

export interface CommentPagination {
  page: number;
  limit: number;
  sortBy: CommentSortOptions;
}

// Default values for new comments
export const defaultCommentStats: CommentStats = {
  likes: 0,
  replies: 0,
  reportCount: 0,
};

export const defaultCommentMetadata: CommentMetadata = {
  isEdited: false,
  isPinned: false,
  isHidden: false,
  depth: 0,
};

// Configuration constants
export const MAX_COMMENT_LENGTH = 2000;
export const MIN_COMMENT_LENGTH = 1;
export const MAX_THREAD_DEPTH = 5; // Maximum nesting level
export const COMMENTS_PER_PAGE = 20;
export const REPLIES_PER_LOAD = 10;

// Validation helpers
export const validateCommentContent = (content: string): boolean => {
  const trimmedContent = content.trim();
  return (
    trimmedContent.length >= MIN_COMMENT_LENGTH &&
    trimmedContent.length <= MAX_COMMENT_LENGTH
  );
};

export const validateThreadDepth = (depth: number): boolean => {
  return depth >= 0 && depth <= MAX_THREAD_DEPTH;
};

// Helper functions for comment threading
export const calculateCommentDepth = (parentComment?: Comment): number => {
  if (!parentComment) return 0;
  return Math.min(parentComment.metadata.depth + 1, MAX_THREAD_DEPTH);
};

export const canReplyToComment = (comment: Comment): boolean => {
  return (
    comment.metadata.depth < MAX_THREAD_DEPTH &&
    comment.isActive &&
    !comment.metadata.isHidden
  );
};

// Comment formatting helpers
export const formatCommentContent = (content: string): string => {
  return content.trim().replace(/\n{3,}/g, "\n\n"); // Limit consecutive line breaks
};

export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
};

// Comment moderation helpers
export interface CommentModerationAction {
  type: "hide" | "pin" | "delete" | "approve";
  reason?: string;
  moderatorId: ObjectId;
  timestamp: Date;
}

export const createModerationAction = (
  type: CommentModerationAction["type"],
  moderatorId: ObjectId,
  reason?: string
): CommentModerationAction => {
  return {
    type,
    reason,
    moderatorId,
    timestamp: new Date(),
  };
};

// Comment notification types
export type CommentNotificationType =
  | "new_comment" // New comment on user's project
  | "comment_reply" // Reply to user's comment
  | "comment_mention" // User mentioned in comment
  | "comment_like"; // User's comment was liked

export interface CommentNotification {
  _id?: ObjectId;
  type: CommentNotificationType;
  recipientId: ObjectId;
  commentId: ObjectId;
  projectId: ObjectId;
  triggeredById: ObjectId; // User who triggered the notification
  isRead: boolean;
  createdAt: Date;
}

// Mongoose Schema
const CommentSchema = new Schema<Comment>({
  content: {
    type: String,
    required: true,
    minlength: MIN_COMMENT_LENGTH,
    maxlength: MAX_COMMENT_LENGTH,
    trim: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  stats: {
    likes: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 }
  },
  metadata: {
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    isPinned: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    depth: { type: Number, default: 0, max: MAX_THREAD_DEPTH }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for performance
CommentSchema.index({ projectId: 1, createdAt: -1 });
CommentSchema.index({ authorId: 1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ 'stats.likes': -1 });
CommentSchema.index({ 'metadata.isPinned': 1 });

// Export the model
export default (mongoose.models?.Comment as mongoose.Model<Comment>) || mongoose.model<Comment>('Comment', CommentSchema);
