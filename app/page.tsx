'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import UserProfile from '@/components/auth/UserProfile';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-[#e5e5e5]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#14213d]">CodeCircle</h1>
              <p className="ml-3 text-sm text-gray-600 hidden sm:block">Where Developers Connect, Share & Grow</p>
            </div>
            
            <nav className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="h-8 w-16 bg-gray-300 rounded"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded"></div>
                </div>
              ) : session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-[#14213d] px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/projects"
                    className="text-gray-700 hover:text-[#14213d] px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Projects
                  </Link>
                  <UserProfile variant="inline" showLogout={true} />
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-[#14213d] px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-[#fca311] text-white hover:bg-[#e8920e] px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {session ? (
          // Authenticated user view
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#14213d] mb-4">
                Welcome back, {session.user.name || session.user.username}!
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Ready to share your latest project or discover what others are building?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-[#14213d] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/projects/new"
                    className="block w-full bg-[#fca311] text-white text-center py-2 px-4 rounded-md hover:bg-[#e8920e] transition-colors"
                  >
                    Share New Project
                  </Link>
                  <Link
                    href="/explore"
                    className="block w-full bg-[#14213d] text-white text-center py-2 px-4 rounded-md hover:bg-[#0f1a2e] transition-colors"
                  >
                    Explore Projects
                  </Link>
                  <Link
                    href="/profile"
                    className="block w-full border border-gray-300 text-gray-700 text-center py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>

              {/* User Profile Card */}
              <div className="md:col-span-2">
                <UserProfile variant="card" showLogout={false} showRole={true} />
              </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-[#14213d] mb-4">Recent Activity</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity yet. Start by sharing your first project!</p>
              </div>
            </div>
          </div>
        ) : (
          // Guest user view
          <div className="text-center space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-[#14213d] leading-tight">
                Where Developers<br />
                <span className="text-[#fca311]">Connect, Share & Grow</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                CodeCircle is a social platform for developers to showcase their projects, 
                receive feedback, and connect with other developers around the world. 
                It's a place where coders don't just post code — they build a reputation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="bg-[#fca311] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[#e8920e] transition-colors"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/auth/login"
                  className="bg-[#14213d] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[#0f1a2e] transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 bg-[#fca311] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#14213d] mb-2">Showcase Projects</h3>
                <p className="text-gray-600">
                  Upload and share your projects with GitHub integration, live demos, and detailed descriptions.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 bg-[#fca311] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#14213d] mb-2">Get Feedback</h3>
                <p className="text-gray-600">
                  Receive constructive feedback from the community through comments, likes, and detailed reviews.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 bg-[#fca311] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#14213d] mb-2">Connect & Network</h3>
                <p className="text-gray-600">
                  Follow other developers, build your network, and collaborate on exciting projects.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-[#14213d] rounded-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Ready to Build Your Developer Reputation?</h2>
              <p className="text-lg mb-6 opacity-90">
                Join thousands of developers who are already showcasing their work and growing their careers on CodeCircle.
              </p>
              <Link
                href="/auth/signup"
                className="bg-[#fca311] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[#e8920e] transition-colors inline-block"
              >
                Start Your Journey Today
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 CodeCircle. Where Developers Connect, Share & Grow.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
