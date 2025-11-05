'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getDashboardRoute } from '@/lib/utils/roleRedirect';

export default function UnauthorizedPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGoToDashboard = () => {
    if (session?.user?.role) {
      const dashboardRoute = getDashboardRoute(session.user.role);
      router.push(dashboardRoute);
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e5e5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">🚫</span>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-[#14213d] mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. This area is restricted to users with specific roles.
        </p>

        {/* User Info */}
        {session?.user && (
          <div className="bg-[#e5e5e5] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Signed in as:</p>
            <p className="font-medium text-[#14213d]">{session.user.name}</p>
            <p className="text-sm text-gray-500 capitalize">
              Role: {session.user.role || 'user'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {session?.user ? (
            <>
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-[#14213d] text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                Go to My Dashboard
              </button>
              
              <Link
                href="/"
                className="block w-full bg-[#fca311] text-[#14213d] py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                Return to Home
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block w-full bg-[#14213d] text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                Sign In
              </Link>
              
              <Link
                href="/"
                className="block w-full bg-[#fca311] text-[#14213d] py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                Return to Home
              </Link>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need access to this area?{' '}
            <Link 
              href="/contact" 
              className="text-[#fca311] hover:underline font-medium"
            >
              Contact support
            </Link>
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600">
            <strong>Tip:</strong> Different user roles have access to different areas of CodeCircle. 
            Admins can access all areas, moderators can manage content, and users can manage their own projects.
          </p>
        </div>
      </div>
    </div>
  );
}