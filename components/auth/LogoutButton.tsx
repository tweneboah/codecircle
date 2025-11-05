'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'link';
  showConfirm?: boolean;
}

export default function LogoutButton({ 
  className = '', 
  children, 
  variant = 'button',
  showConfirm = false 
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (showConfirm) {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      await signOut({ 
        callbackUrl: '/auth/login',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  const baseClasses = variant === 'button' 
    ? 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fca311] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = variant === 'button'
    ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'text-gray-700 hover:text-gray-900';

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing out...
        </>
      ) : (
        children || 'Sign Out'
      )}
    </button>
  );
}