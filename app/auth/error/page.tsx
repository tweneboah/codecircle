'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const errorMessages: { [key: string]: { title: string; description: string } } = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please try again later.'
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in.'
  },
  Verification: {
    title: 'Verification Error',
    description: 'The verification token has expired or has already been used.'
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.'
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The email or password you entered is incorrect.'
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.'
  },
  Callback: {
    title: 'Callback Error',
    description: 'An error occurred during the authentication callback.'
  }
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#14213d]">CodeCircle</h1>
          <p className="mt-2 text-sm text-gray-600">Where Developers Connect, Share & Grow</p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">{errorInfo.title}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {errorInfo.description}
            </p>
            
            {error === 'CredentialsSignin' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Make sure you're using the correct email and password. 
                  If you forgot your password, you can reset it using the link below.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {error === 'CredentialsSignin' ? (
                <>
                  <Link
                    href="/auth/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#14213d] hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fca311]"
                  >
                    Try Again
                  </Link>
                  <Link
                    href="/auth/forgot-password"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fca311]"
                  >
                    Reset Password
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#14213d] hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fca311]"
                  >
                    Back to Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fca311]"
                  >
                    Create Account
                  </Link>
                </>
              )}
              
              <Link
                href="/"
                className="block text-center text-sm text-[#fca311] hover:text-[#e8920e] font-medium"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
            <p className="mt-1 text-xs text-yellow-700">
              Error Code: {error}
            </p>
            <p className="text-xs text-yellow-700">
              URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}