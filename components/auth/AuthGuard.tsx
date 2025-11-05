'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  requireRole?: string;
  requirePermission?: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireVerification = false,
  requireRole,
  requirePermission,
  fallback,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    // Check if authentication is required
    if (requireAuth && !session) {
      router.push(redirectTo);
      return;
    }

    // Check if email verification is required
    if (requireVerification && session && !session.user.isVerified) {
      router.push('/auth/verify-email');
      return;
    }

    // Check if specific role is required
    if (requireRole && session && session.user.role !== requireRole) {
      router.push('/unauthorized');
      return;
    }

    // Check if specific permission is required
    if (requirePermission && session && !session.user.permissions?.includes(requirePermission)) {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router, requireAuth, requireVerification, requireRole, requirePermission, redirectTo]);

  // Show loading state
  if (status === 'loading') {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin mx-auto h-12 w-12 text-[#fca311]">
                <svg fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">Loading...</h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your session.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check authentication requirements
  if (requireAuth && !session) {
    return null; // Will redirect in useEffect
  }

  // Check verification requirements
  if (requireVerification && session && !session.user.isVerified) {
    return null; // Will redirect in useEffect
  }

  // Check role requirements
  if (requireRole && session && session.user.role !== requireRole) {
    return null; // Will redirect in useEffect
  }

  // Check permission requirements
  if (requirePermission && session && !session.user.permissions?.includes(requirePermission)) {
    return null; // Will redirect in useEffect
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Convenience components for common use cases
export function RequireAuth({ children, ...props }: Omit<AuthGuardProps, 'requireAuth'>) {
  return <AuthGuard requireAuth={true} {...props}>{children}</AuthGuard>;
}

export function RequireVerification({ children, ...props }: Omit<AuthGuardProps, 'requireVerification'>) {
  return <AuthGuard requireAuth={true} requireVerification={true} {...props}>{children}</AuthGuard>;
}

export function RequireAdmin({ children, ...props }: Omit<AuthGuardProps, 'requireRole'>) {
  return <AuthGuard requireAuth={true} requireRole="admin" {...props}>{children}</AuthGuard>;
}

export function RequireModerator({ children, ...props }: Omit<AuthGuardProps, 'requireRole'>) {
  return <AuthGuard requireAuth={true} requireRole="moderator" {...props}>{children}</AuthGuard>;
}