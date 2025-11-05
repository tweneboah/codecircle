'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RequireAdmin } from '@/components/dashboard/ProtectedRoute';

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalComments: number;
  activeUsers: number;
  pendingReports: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'project_created' | 'report_submitted' | 'user_banned';
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalComments: 0,
    activeUsers: 0,
    pendingReports: 0,
    systemHealth: 'good',
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Simulate API calls - replace with actual API endpoints
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 1247,
        totalProjects: 892,
        totalComments: 3456,
        activeUsers: 234,
        pendingReports: 12,
        systemHealth: 'good',
      });

      setRecentActivity([
        {
          id: '1',
          type: 'user_registered',
          description: 'New user "john_doe" registered',
          timestamp: '2 minutes ago',
          severity: 'info',
        },
        {
          id: '2',
          type: 'project_created',
          description: 'Project "React Dashboard" was created',
          timestamp: '15 minutes ago',
          severity: 'info',
        },
        {
          id: '3',
          type: 'report_submitted',
          description: 'Content report submitted for project #456',
          timestamp: '1 hour ago',
          severity: 'warning',
        },
        {
          id: '4',
          type: 'user_banned',
          description: 'User "spammer123" was banned',
          timestamp: '2 hours ago',
          severity: 'error',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return '👤';
      case 'project_created': return '📁';
      case 'report_submitted': return '⚠️';
      case 'user_banned': return '🚫';
      default: return '📄';
    }
  };

  return (
    <RequireAdmin>
      <DashboardLayout title="Admin Dashboard" requiredRole="admin">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {isLoading ? '...' : stats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {isLoading ? '...' : stats.totalProjects.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Comments</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {isLoading ? '...' : stats.totalComments.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {isLoading ? '...' : stats.activeUsers.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#fca311] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block mt-2 ${getHealthColor(stats.systemHealth)}`}>
                    {stats.systemHealth.toUpperCase()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔧</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-[#14213d] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="font-medium text-[#14213d]">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage user accounts</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">📁</div>
                <h3 className="font-medium text-[#14213d]">Review Projects</h3>
                <p className="text-sm text-gray-600">Moderate project submissions</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">⚠️</div>
                <h3 className="font-medium text-[#14213d]">Handle Reports</h3>
                <p className="text-sm text-gray-600">{stats.pendingReports} pending reports</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium text-[#14213d]">View Analytics</h3>
                <p className="text-sm text-gray-600">Platform usage statistics</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#14213d]">Recent Activity</h2>
              <button className="text-[#fca311] hover:text-[#14213d] text-sm font-medium">
                View All
              </button>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-[#e5e5e5] rounded-lg transition-colors">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#14213d]">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                      {activity.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}