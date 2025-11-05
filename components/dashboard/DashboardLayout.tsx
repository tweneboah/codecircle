'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoleBasedNavigation, hasRouteAccess } from '@/lib/utils/roleRedirect';
import LogoutButton from '@/components/auth/LogoutButton';
import UserProfile from '@/components/auth/UserProfile';

interface NavigationItem {
  route: string;
  label: string;
  icon: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  requiredRole?: 'admin' | 'moderator' | 'user';
}

const iconMap: Record<string, string> = {
  dashboard: '📊',
  folder: '📁',
  user: '👤',
  settings: '⚙️',
  chart: '📈',
  shield: '🛡️',
  users: '👥',
  cog: '🔧',
  home: '🏠',
  analytics: '📊',
  projects: '📁',
  messages: '💬',
  notifications: '🔔',
  help: '❓',
};

export function DashboardLayout({ children, title, requiredRole }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Set navigation items based on user role
  useEffect(() => {
    if (session?.user?.role) {
      const items = getRoleBasedNavigation(session.user.role);
      setNavigationItems(items);
    }
  }, [session]);

  // Check access permissions
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (requiredRole && session.user?.role) {
      if (!hasRouteAccess(session.user.role, pathname)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [session, status, pathname, requiredRole, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#14213d]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-[#e5e5e5] flex">
      {/* Sidebar */}
      <div className={`bg-[#14213d] text-white transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-[#fca311]">CodeCircle</h1>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.route;
              const isParentActive = pathname.startsWith(item.route) && item.route !== '/';
              const activeState = isActive || isParentActive;
              
              return (
                <li key={item.route}>
                  <Link
                    href={item.route}
                    className={`group flex items-center p-3 rounded-lg transition-all duration-200 relative ${
                      activeState
                        ? 'bg-[#fca311] text-[#14213d] font-semibold shadow-lg'
                        : 'hover:bg-gray-700 text-gray-300 hover:text-white hover:shadow-md'
                    }`}
                  >
                    {/* Active indicator */}
                    {activeState && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#14213d] rounded-r-full"></div>
                    )}
                    
                    <span className={`text-xl mr-3 transition-transform duration-200 ${
                      activeState ? 'scale-110' : 'group-hover:scale-105'
                    }`}>
                      {iconMap[item.icon] || '📄'}
                    </span>
                    
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    
                    {/* Tooltip for collapsed sidebar */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                      </div>
                    )}
                    
                    {/* Badge for notifications (example) */}
                    {item.route === '/notifications' && !sidebarCollapsed && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        3
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          {/* Sidebar footer when collapsed */}
          {sidebarCollapsed && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={toggleSidebar}
                className="w-full p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <span className="text-lg">⚡</span>
              </button>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-700">
          {!sidebarCollapsed ? (
            <div className="space-y-3">
              <UserProfile variant="inline" />
              <LogoutButton variant="button" className="w-full bg-red-600 hover:bg-red-700" />
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="w-8 h-8 bg-[#fca311] rounded-full flex items-center justify-center text-[#14213d] font-bold">
                {session.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <LogoutButton variant="button" className="w-full p-2 bg-red-600 hover:bg-red-700 text-xs" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-[#14213d]">{title}</h1>
              )}
              <p className="text-gray-600 text-sm">
                Welcome back, {session.user?.name || 'User'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-[#fca311] text-[#14213d] rounded-full text-sm font-medium capitalize">
                {session.user?.role || 'user'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}