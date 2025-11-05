import { ObjectId } from 'mongodb';

// Platform-wide analytics and metrics
export interface PlatformAnalytics {
  _id?: ObjectId;
  date: Date;
  metrics: {
    totalUsers: number;
    activeUsers: number; // Users active in last 30 days
    newUsers: number; // New users today
    totalProjects: number;
    newProjects: number; // New projects today
    totalComments: number;
    newComments: number; // New comments today
    totalLikes: number;
    newLikes: number; // New likes today
    totalFollows: number;
    newFollows: number; // New follows today
    totalMessages: number;
    newMessages: number; // New messages today
  };
  engagement: {
    averageSessionDuration: number; // in minutes
    averageProjectsPerUser: number;
    averageCommentsPerProject: number;
    averageLikesPerProject: number;
    userRetentionRate: number; // Percentage
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  content: {
    featuredProjects: number;
    trendingProjects: number;
    reportedContent: number;
    moderatedContent: number;
    deletedContent: number;
  };
  createdAt: Date;
}

// User management and moderation
export interface UserModerationAction {
  _id?: ObjectId;
  targetUserId: ObjectId;
  moderatorId: ObjectId;
  action: UserModerationActionType;
  reason: string;
  description?: string;
  duration?: number; // For temporary actions (in hours)
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export type UserModerationActionType = 
  | 'warning'
  | 'temporary_ban'
  | 'permanent_ban'
  | 'content_restriction'
  | 'feature_restriction'
  | 'account_verification'
  | 'account_suspension';

export interface ContentModerationAction {
  _id?: ObjectId;
  contentId: ObjectId;
  contentType: 'project' | 'comment' | 'message';
  moderatorId: ObjectId;
  action: ContentModerationActionType;
  reason: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export type ContentModerationActionType = 
  | 'hide'
  | 'delete'
  | 'feature'
  | 'unfeature'
  | 'mark_trending'
  | 'remove_trending'
  | 'approve'
  | 'reject';

// Reports and flagged content
export interface ContentReport {
  _id?: ObjectId;
  reporterId: ObjectId;
  contentId: ObjectId;
  contentType: 'project' | 'comment' | 'message' | 'user';
  reason: ContentReportReason;
  description?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: ObjectId; // Moderator assigned to review
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentReportReason = 
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'copyright_violation'
  | 'fake_information'
  | 'impersonation'
  | 'violence'
  | 'hate_speech'
  | 'other';

// Admin dashboard overview
export interface AdminDashboardData {
  overview: {
    totalUsers: number;
    totalProjects: number;
    totalComments: number;
    pendingReports: number;
    activeUsers24h: number;
    newUsersToday: number;
    newProjectsToday: number;
    engagementRate: number;
  };
  charts: {
    userGrowth: {
      date: Date;
      newUsers: number;
      totalUsers: number;
    }[];
    projectGrowth: {
      date: Date;
      newProjects: number;
      totalProjects: number;
    }[];
    engagement: {
      date: Date;
      likes: number;
      comments: number;
      follows: number;
    }[];
  };
  topContent: {
    mostLikedProjects: {
      _id: ObjectId;
      title: string;
      author: string;
      likes: number;
      createdAt: Date;
    }[];
    mostActiveUsers: {
      _id: ObjectId;
      username: string;
      projectsCount: number;
      likesReceived: number;
      commentsCount: number;
    }[];
    trendingTags: {
      name: string;
      usageCount: number;
      growthRate: number;
    }[];
  };
  moderation: {
    pendingReports: ContentReport[];
    recentActions: (UserModerationAction | ContentModerationAction)[];
    flaggedContent: {
      _id: ObjectId;
      type: 'project' | 'comment' | 'user';
      title?: string;
      reportCount: number;
      lastReported: Date;
    }[];
  };
}

// System health and performance metrics
export interface SystemMetrics {
  _id?: ObjectId;
  timestamp: Date;
  performance: {
    averageResponseTime: number; // in milliseconds
    errorRate: number; // percentage
    uptime: number; // percentage
    activeConnections: number;
    memoryUsage: number; // percentage
    cpuUsage: number; // percentage
    diskUsage: number; // percentage
  };
  database: {
    connectionCount: number;
    queryPerformance: number; // average query time in ms
    indexEfficiency: number; // percentage
    storageUsed: number; // in GB
  };
  api: {
    requestsPerMinute: number;
    mostUsedEndpoints: {
      endpoint: string;
      requestCount: number;
      averageResponseTime: number;
    }[];
    errorsByEndpoint: {
      endpoint: string;
      errorCount: number;
      errorRate: number;
    }[];
  };
}

// Feature usage analytics
export interface FeatureUsageAnalytics {
  _id?: ObjectId;
  date: Date;
  features: {
    projectUploads: number;
    projectViews: number;
    projectLikes: number;
    projectShares: number;
    comments: number;
    follows: number;
    messages: number;
    searches: number;
    profileViews: number;
  };
  userSegments: {
    newUsers: FeatureUsage;
    activeUsers: FeatureUsage;
    powerUsers: FeatureUsage; // Top 10% most active
  };
}

export interface FeatureUsage {
  userCount: number;
  averageSessionDuration: number;
  featuresUsed: string[];
  conversionRate: number; // Percentage who completed key actions
}

// Admin user management
export interface AdminUser {
  _id?: ObjectId;
  userId: ObjectId;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type AdminRole = 
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'content_manager'
  | 'analytics_viewer';

export type AdminPermission = 
  | 'view_analytics'
  | 'manage_users'
  | 'moderate_content'
  | 'manage_projects'
  | 'manage_tags'
  | 'view_reports'
  | 'manage_admins'
  | 'system_settings'
  | 'export_data';

// Audit logs
export interface AuditLog {
  _id?: ObjectId;
  adminId: ObjectId;
  action: string;
  targetType: 'user' | 'project' | 'comment' | 'tag' | 'system';
  targetId?: ObjectId;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Data export and backup
export interface DataExportRequest {
  _id?: ObjectId;
  requestedBy: ObjectId;
  exportType: DataExportType;
  filters?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export type DataExportType = 
  | 'users'
  | 'projects'
  | 'comments'
  | 'analytics'
  | 'reports'
  | 'full_backup';

// Platform settings and configuration
export interface PlatformSettings {
  _id?: ObjectId;
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
  };
  content: {
    maxProjectsPerUser: number;
    maxProjectSize: number; // in MB
    allowedFileTypes: string[];
    moderationEnabled: boolean;
    autoModerationEnabled: boolean;
  };
  features: {
    messagingEnabled: boolean;
    followingEnabled: boolean;
    projectSharingEnabled: boolean;
    commentingEnabled: boolean;
  };
  limits: {
    maxFollowsPerDay: number;
    maxProjectsPerDay: number;
    maxCommentsPerDay: number;
    maxMessagesPerDay: number;
  };
  updatedBy: ObjectId;
  updatedAt: Date;
}

// Notification management
export interface AdminNotification {
  _id?: ObjectId;
  type: AdminNotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  targetAdmins: ObjectId[]; // Specific admins or empty for all
  createdAt: Date;
  expiresAt?: Date;
}

export type AdminNotificationType = 
  | 'system_alert'
  | 'security_warning'
  | 'content_report'
  | 'user_milestone'
  | 'performance_issue'
  | 'maintenance_reminder';

// Helper functions for admin operations
export const calculateEngagementRate = (
  totalUsers: number,
  activeUsers: number
): number => {
  if (totalUsers === 0) return 0;
  return Math.round((activeUsers / totalUsers) * 100 * 100) / 100;
};

export const calculateGrowthRate = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
};

export const getContentHealthScore = (
  totalContent: number,
  reportedContent: number,
  moderatedContent: number
): number => {
  if (totalContent === 0) return 100;
  
  const reportRate = reportedContent / totalContent;
  const moderationRate = moderatedContent / totalContent;
  
  // Lower report rate and moderation rate = higher health score
  const healthScore = Math.max(0, 100 - (reportRate * 50) - (moderationRate * 30));
  return Math.round(healthScore * 100) / 100;
};

// Default admin permissions by role
export const defaultPermissionsByRole: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'view_analytics', 'manage_users', 'moderate_content', 'manage_projects',
    'manage_tags', 'view_reports', 'manage_admins', 'system_settings', 'export_data'
  ],
  admin: [
    'view_analytics', 'manage_users', 'moderate_content', 'manage_projects',
    'manage_tags', 'view_reports', 'export_data'
  ],
  moderator: [
    'moderate_content', 'view_reports', 'manage_projects'
  ],
  content_manager: [
    'manage_projects', 'manage_tags', 'moderate_content'
  ],
  analytics_viewer: [
    'view_analytics'
  ]
};