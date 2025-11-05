import { ObjectId } from 'mongodb';

export interface Message {
  _id?: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
  recipientId: ObjectId;
  content: string;
  messageType: MessageType;
  attachments: MessageAttachment[];
  isRead: boolean;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  replyToMessageId?: ObjectId; // For message replies
  createdAt: Date;
  updatedAt: Date;
}

export type MessageType = 
  | 'text'
  | 'image'
  | 'file'
  | 'project_share'
  | 'system'; // For system notifications

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  filename: string;
  size: number; // in bytes
  mimeType: string;
}

export interface Conversation {
  _id?: ObjectId;
  participants: ObjectId[];
  lastMessageId?: ObjectId;
  lastMessageAt?: Date;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageInput {
  conversationId?: ObjectId; // Optional for new conversations
  recipientId: ObjectId;
  content: string;
  messageType?: MessageType;
  attachments?: MessageAttachment[];
  replyToMessageId?: ObjectId;
}

export interface UpdateMessageInput {
  content: string;
}

export interface MessageWithSender extends Message {
  sender: {
    _id: ObjectId;
    profile: {
      name: string;
      username: string;
      profilePhoto?: string;
    };
    isVerified: boolean;
  };
  replyToMessage?: {
    _id: ObjectId;
    content: string;
    sender: {
      name: string;
      username: string;
    };
  };
}

export interface ConversationWithDetails extends Conversation {
  lastMessage?: MessageWithSender;
  unreadCount: number;
  otherParticipant: {
    _id: ObjectId;
    profile: {
      name: string;
      username: string;
      profilePhoto?: string;
    };
    isVerified: boolean;
    isOnline: boolean;
    lastSeenAt?: Date;
  };
}

export interface ConversationPreview {
  _id: ObjectId;
  otherParticipant: {
    _id: ObjectId;
    profile: {
      name: string;
      username: string;
      profilePhoto?: string;
    };
    isVerified: boolean;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    senderId: ObjectId;
    createdAt: Date;
    isRead: boolean;
  };
  unreadCount: number;
  lastMessageAt: Date;
}

// Message validation
export const MESSAGE_LIMITS = {
  MAX_CONTENT_LENGTH: 2000,
  MIN_CONTENT_LENGTH: 1,
  MAX_ATTACHMENTS: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'text/plain',
    'application/zip',
    'application/json',
  ],
};

export const validateMessageContent = (content: string): boolean => {
  const trimmedContent = content.trim();
  return trimmedContent.length >= MESSAGE_LIMITS.MIN_CONTENT_LENGTH && 
         trimmedContent.length <= MESSAGE_LIMITS.MAX_CONTENT_LENGTH;
};

export const validateAttachment = (attachment: MessageAttachment): boolean => {
  // Check file size
  if (attachment.size > MESSAGE_LIMITS.MAX_FILE_SIZE) {
    return false;
  }
  
  // Check file type
  if (attachment.type === 'image') {
    return MESSAGE_LIMITS.ALLOWED_IMAGE_TYPES.includes(attachment.mimeType);
  } else {
    return MESSAGE_LIMITS.ALLOWED_FILE_TYPES.includes(attachment.mimeType);
  }
};

// Conversation helpers
export const canUsersMessage = (
  senderId: ObjectId,
  recipientId: ObjectId,
  followRelationship?: 'following' | 'followed_by' | 'mutual' | 'none'
): boolean => {
  // Users can't message themselves
  if (senderId.equals(recipientId)) {
    return false;
  }
  
  // For MVP, allow messaging between any users
  // In production, you might want to restrict to followers only
  return true;
};

export const getConversationId = (userId1: ObjectId, userId2: ObjectId): string => {
  // Create deterministic conversation ID from user IDs
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Message formatting
export const formatMessageContent = (content: string): string => {
  return content.trim().replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks
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

// Message search
export interface MessageSearchFilters {
  conversationId?: ObjectId;
  senderId?: ObjectId;
  messageType?: MessageType;
  hasAttachments?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface MessageSearchResult {
  message: MessageWithSender;
  conversation: {
    _id: ObjectId;
    otherParticipant: {
      name: string;
      username: string;
      profilePhoto?: string;
    };
  };
  matchHighlight?: string; // Highlighted search term in content
}

// Message notifications
export type MessageNotificationType = 
  | 'new_message'
  | 'message_reply'
  | 'message_mention';

export interface MessageNotification {
  _id?: ObjectId;
  type: MessageNotificationType;
  recipientId: ObjectId;
  senderId: ObjectId;
  messageId: ObjectId;
  conversationId: ObjectId;
  isRead: boolean;
  createdAt: Date;
}

// Real-time messaging
export interface MessageEvent {
  type: 'message_sent' | 'message_read' | 'typing_start' | 'typing_stop' | 'user_online' | 'user_offline';
  conversationId: ObjectId;
  userId: ObjectId;
  messageId?: ObjectId;
  timestamp: Date;
}

export interface TypingIndicator {
  conversationId: ObjectId;
  userId: ObjectId;
  isTyping: boolean;
  lastTypingAt: Date;
}

// Message moderation
export interface MessageReport {
  _id?: ObjectId;
  messageId: ObjectId;
  reporterId: ObjectId;
  reason: MessageReportReason;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
}

export type MessageReportReason = 
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'impersonation'
  | 'other';

// Pagination and filtering
export interface MessagePagination {
  page: number;
  limit: number;
  sortBy: 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface ConversationPagination {
  page: number;
  limit: number;
  sortBy: 'lastMessageAt' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

// Message statistics
export interface MessageStats {
  totalMessages: number;
  totalConversations: number;
  unreadMessages: number;
  messagesThisWeek: number;
  averageResponseTime: number; // in minutes
  mostActiveConversation: {
    conversationId: ObjectId;
    messageCount: number;
    otherParticipant: string;
  };
}

// Bulk operations
export interface BulkMessageOperation {
  operation: 'mark_read' | 'delete' | 'archive';
  messageIds?: ObjectId[];
  conversationIds?: ObjectId[];
  userId: ObjectId;
}

export interface MessageOperationResult {
  success: boolean;
  processedCount: number;
  errors: string[];
}