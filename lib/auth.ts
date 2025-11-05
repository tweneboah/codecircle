import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '@/models/User';
import type { User as NextAuthUser } from 'next-auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = '24h';

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT utilities
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate secure random tokens
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Email verification token
export const generateEmailVerificationToken = (): {
  token: string;
  expires: Date;
} => {
  const token = generateSecureToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours from now
  
  return { token, expires };
};

// Password reset token
export const generatePasswordResetToken = (): {
  token: string;
  expires: Date;
} => {
  const token = generateSecureToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour from now
  
  return { token, expires };
};

// Account lockout utilities
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

export const handleFailedLogin = async (user: any): Promise<void> => {
  // If we have a previous lock that has expired, restart at 1
  if (user.security.lockUntil && user.security.lockUntil < new Date()) {
    return await user.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates: any = { $inc: { 'security.loginAttempts': 1 } };
  
  // If we have reached max attempts and it's not locked already, lock the account
  if (user.security.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !user.security.lockUntil) {
    updates.$set = { 'security.lockUntil': new Date(Date.now() + LOCK_TIME) };
  }
  
  return await user.updateOne(updates);
};

export const handleSuccessfulLogin = async (user: any): Promise<void> => {
  // If there was no previous lock, just delete the loginAttempts and lockUntil
  if (!user.security.lockUntil) {
    return await user.updateOne({
      $unset: { 'security.loginAttempts': 1 },
      $set: { lastLoginAt: new Date() }
    });
  }
  
  // Otherwise, delete all lockout-related fields and update last login
  return await user.updateOne({
    $unset: {
      'security.loginAttempts': 1,
      'security.lockUntil': 1
    },
    $set: { lastLoginAt: new Date() }
  });
};

// Permission utilities
export const hasPermission = (user: User, permission: string): boolean => {
  if (user.role === 'admin') return true;
  return user.permissions.includes(permission);
};

export const hasRole = (user: User, role: string | string[]): boolean => {
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
};

// Default permissions by role
export const getDefaultPermissions = (role: string): string[] => {
  switch (role) {
    case 'admin':
      return [
        'user:read', 'user:write', 'user:delete',
        'project:read', 'project:write', 'project:delete',
        'comment:read', 'comment:write', 'comment:delete',
        'admin:dashboard', 'admin:users', 'admin:analytics'
      ];
    case 'moderator':
      return [
        'user:read',
        'project:read', 'project:write',
        'comment:read', 'comment:write', 'comment:delete'
      ];
    case 'user':
    default:
      return [
        'user:read',
        'project:read', 'project:write',
        'comment:read', 'comment:write'
      ];
  }
};

// Session utilities
export const createSession = (user: User): NextAuthUser => {
  return {
    id: typeof user._id === 'string' ? user._id : (user._id as any)?.toString?.() ?? '',
    email: user.email,
    username: user.profile.username,
    name: user.profile.name,
    role: user.role,
    permissions: user.permissions,
    isVerified: user.isVerified,
    emailVerified: user.security.emailVerified
  };
};
