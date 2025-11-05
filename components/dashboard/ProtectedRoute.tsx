'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/models/User';
import { hasRouteAccess } from '@/lib/utils/roleRedirect';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallbackRoute?: string;
  showUnauthorized?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  fallbackRoute = '/auth/login',
  showUnauthorized = true,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e5e5e5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#14213d] mx-auto mb-4"></div>
          <p className="text-[#14213d] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    router.push(fallbackRoute);
    return null;
  }

  const userRole = session.user?.role as UserRole;

  // Check if user has required role
  const hasAccess = () => {
    if (!userRole) return false;

    // If specific role is required
    if (requiredRole) {
      return userRole === requiredRole || userRole === 'admin'; // Admins have access to everything
    }

    // If multiple roles are allowed
    if (requiredRoles) {
      return requiredRoles.includes(userRole) || userRole === 'admin';
    }

    // If no specific role required, just need to be authenticated
    return true;
  };

  // Show unauthorized page if user doesn't have access
  if (!hasAccess()) {
    if (showUnauthorized) {
      return <UnauthorizedPage userRole={userRole} requiredRole={requiredRole} requiredRoles={requiredRoles} />;
    } else {
      router.push('/unauthorized');
      return null;
    }
  }

  return <>{children}</>;
}

// Unauthorized component
function UnauthorizedPage({
  userRole,
  requiredRole,
  requiredRoles,
}: {
  userRole: UserRole;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
}) {
  const router = useRouter();

  const getRequiredRoleText = () => {
    if (requiredRole) return requiredRole;
    if (requiredRoles) return requiredRoles.join(' or ');
    return 'appropriate permissions';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e5e5e5]">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213d] mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="bg-[#e5e5e5] rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Your role:</strong> <span className="capitalize">{userRole}</span>
          </p>
          <p className="text-sm text-gray-700">
            <strong>Required:</strong> <span className="capitalize">{getRequiredRoleText()}</span>
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-[#14213d] text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/user-dashboard')}
            className="w-full bg-[#fca311] text-[#14213d] py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// Convenience components for specific roles
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
}

export function RequireModerator({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={['admin', 'moderator']}>{children}</ProtectedRoute>;
}

export function RequireUser({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={['admin', 'moderator', 'user']}>{children}</ProtectedRoute>;
}