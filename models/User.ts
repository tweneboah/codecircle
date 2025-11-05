import { ObjectId } from "mongodb";
import mongoose, { Schema, Document } from "mongoose";

export interface UserProfile {
  profilePhoto?: string;
  name: string;
  username: string;
  bio?: string;
  location?: string;
  skills: string[];
  techStack: string[];
  externalLinks: {
    github?: string;
    portfolio?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export interface UserStats {
  projectsShared: number;
  followers: number;
  following: number;
  votesReceived: number;
  commentsReceived: number;
  totalViews: number;
}

export interface UserSettings {
  emailNotifications: boolean;
  profileVisibility: "public" | "private";
  showEmail: boolean;
  showLocation: boolean;
}

export interface UserSecurity {
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;
}

export type UserRole = "user" | "admin" | "moderator";

export interface User extends Document {
  _id?: ObjectId;
  email: string;
  password: string; // Will be hashed
  profile: UserProfile;
  stats: UserStats;
  settings: UserSettings;
  security: UserSecurity;
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  role: UserRole;
  permissions: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  username: string;
  bio?: string;
}

export interface UpdateUserProfileInput {
  name?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  techStack?: string[];
  externalLinks?: Partial<UserProfile["externalLinks"]>;
  profilePhoto?: string;
}

export interface UserPublicProfile {
  _id: ObjectId;
  profile: UserProfile;
  stats: UserStats;
  isVerified: boolean;
  createdAt: Date;
}

// Default values for new users
export const defaultUserStats: UserStats = {
  projectsShared: 0,
  followers: 0,
  following: 0,
  votesReceived: 0,
  commentsReceived: 0,
  totalViews: 0,
};

export const defaultUserSettings: UserSettings = {
  emailNotifications: true,
  profileVisibility: "public",
  showEmail: false,
  showLocation: true,
};

export const defaultUserSecurity: UserSecurity = {
  emailVerified: false,
  twoFactorEnabled: false,
  loginAttempts: 0,
};

// Validation helpers
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Mongoose Schema
const UserSchema = new Schema<User>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: validateEmail,
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  profile: {
    profilePhoto: String,
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: validateUsername,
        message: 'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores'
      }
    },
    bio: {
      type: String,
      maxlength: 500
    },
    location: {
      type: String,
      maxlength: 100
    },
    skills: [String],
    techStack: [String],
    externalLinks: {
      github: String,
      portfolio: String,
      linkedin: String,
      twitter: String,
      website: String
    }
  },
  stats: {
    projectsShared: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    votesReceived: { type: Number, default: 0 },
    commentsReceived: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 }
  },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    profileVisibility: { 
      type: String, 
      enum: ['public', 'private'], 
      default: 'public' 
    },
    showEmail: { type: Boolean, default: false },
    showLocation: { type: Boolean, default: true }
  },
  security: {
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  permissions: [String],
  lastLoginAt: Date
}, {
  timestamps: true
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'profile.username': 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'security.emailVerified': 1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > new Date());
});

// Export the model
export default (mongoose.models?.User as mongoose.Model<User>) || mongoose.model<User>('User', UserSchema);
