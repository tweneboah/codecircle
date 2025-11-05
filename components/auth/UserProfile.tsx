'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

interface UserProfileProps {
  variant?: 'dropdown' | 'card' | 'inline';
  showLogout?: boolean;
  showRole?: boolean;
  className?: string;
}

export default function UserProfile({ 
  variant = 'card', 
  showLogout = true, 
  showRole = false,
  className = '' 
}: UserProfileProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
        <Link
          href="/auth/login"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#14213d] hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fca311]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const { user } = session;

  if (variant === 'dropdown') {
    return (
      <div className={`bg-white rounded-lg shadow-lg border p-4 min-w-64 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative h-12 w-12">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 bg-[#14213d] rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || 'Anonymous User'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              @{user.username || 'username'}
            </p>
            {showRole && user.role && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fca311] text-white">
                {user.role}
              </span>
            )}
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <Link
            href="/profile"
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            View Profile
          </Link>
          <Link
            href="/settings"
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Settings
          </Link>
          {showLogout && (
            <LogoutButton 
              variant="link" 
              className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
            />
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="relative h-8 w-8">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 bg-[#14213d] rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name || 'Anonymous User'}
          </p>
          {showRole && user.role && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fca311] text-white">
              {user.role}
            </span>
          )}
        </div>
        {showLogout && (
          <LogoutButton variant="link" className="text-xs" />
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative h-16 w-16">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 bg-[#14213d] rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-xl">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {user.name || 'Anonymous User'}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            @{user.username || 'username'}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {user.email}
          </p>
          {showRole && user.role && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#fca311] text-white mt-1">
              {user.role}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        {user.isVerified ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Unverified
          </span>
        )}
      </div>

      <div className="flex space-x-3">
        <Link
          href="/profile"
          className="flex-1 bg-[#14213d] text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fca311]"
        >
          View Profile
        </Link>
        {showLogout && (
          <LogoutButton className="flex-1" />
        )}
      </div>
    </div>
  );
}