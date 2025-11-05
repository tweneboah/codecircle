import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hasPermission, hasRole } from '@/lib/auth';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Rate limiting middleware
export const rateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  return async (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean old entries
    const requests = rateLimitStore.get(key) || [];
    const validRequests = requests.filter((time: number) => time > windowStart);

    if (validRequests.length >= options.maxRequests) {
      return NextResponse.json(
        { error: options.message || 'Too many requests' },
        { status: 429 }
      );
    }

    // Add current request
    validRequests.push(now);
    rateLimitStore.set(key, validRequests);

    return null; // Continue to next middleware
  };
};

// Authentication middleware
export const requireAuth = async (request: NextRequest) => {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user still exists and is active
    await connectDB();
    const user = await User.findById(token.id);

    if (!user || !user.isActive || user.isBanned) {
      return NextResponse.json(
        { error: 'Account not accessible' },
        { status: 403 }
      );
    }

    // Add user to request context
    (request as any).user = user;
    (request as any).token = token;

    return null; // Continue to next middleware
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
};

// Authorization middleware
export const requirePermission = (permission: string) => {
  return async (request: NextRequest) => {
    const user = (request as any).user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasPermission(user, permission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Continue to next middleware
  };
};

// Role-based authorization middleware
export const requireRole = (roles: string | string[]) => {
  return async (request: NextRequest) => {
    const user = (request as any).user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasRole(user, roles)) {
      return NextResponse.json(
        { error: 'Insufficient role permissions' },
        { status: 403 }
      );
    }

    return null; // Continue to next middleware
  };
};

// Email verification middleware
export const requireEmailVerification = async (request: NextRequest) => {
  const user = (request as any).user;

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (!user.security.emailVerified) {
    return NextResponse.json(
      { error: 'Email verification required' },
      { status: 403 }
    );
  }

  return null; // Continue to next middleware
};

// Admin middleware (combines auth + admin role)
export const requireAdmin = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;

  const roleResult = await requireRole('admin')(request);
  if (roleResult) return roleResult;

  return null;
};

// Moderator or Admin middleware
export const requireModerator = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;

  const roleResult = await requireRole(['admin', 'moderator'])(request);
  if (roleResult) return roleResult;

  return null;
};

// Compose multiple middleware functions
export const compose = (...middlewares: Array<(req: NextRequest) => Promise<NextResponse | null>>) => {
  return async (request: NextRequest) => {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) return result; // If middleware returns a response, stop execution
    }
    return null; // All middleware passed
  };
};

// CSRF protection middleware
export const csrfProtection = async (request: NextRequest) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }

  const token = request.headers.get('x-csrf-token');
  const sessionToken = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token || !sessionToken) {
    return NextResponse.json(
      { error: 'CSRF token required' },
      { status: 403 }
    );
  }

  // In a real implementation, validate the CSRF token
  // For now, just check if it exists
  if (token !== sessionToken.csrfToken) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return null;
};

// Logging middleware
export const logRequest = async (request: NextRequest) => {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.url;
  const userAgent = request.headers.get('user-agent');
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);

  return null; // Continue to next middleware
};