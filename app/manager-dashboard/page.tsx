'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RequireModerator } from '@/components/dashboard/ProtectedRoute';

interface ManagerStats {
  pendingReviews: number;
  flaggedContent: number;
  activeReports: number;
  resolvedToday: number;
  communityHealth: number;
}

interface ContentItem {
  id: string;
  type: 'project' | 'comment' | 'user';
  title: string;
  author: string;
  reportReason: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  status: 'pending' | 'reviewing' | 'resolved';
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<ManagerStats>({
    pendingReviews: 0,
    flaggedContent: 0,
    activeReports: 0,
    resolvedToday: 0,
    communityHealth: 0,
  });
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'reports'>('pending');

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      // Simulate API calls - replace with actual API endpoints
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        pendingReviews: 23,
        flaggedContent: 8,
        activeReports: 15,
        resolvedToday: 12,
        communityHealth: 87,
      });

      setContentQueue([
        {
          id: '1',
          type: 'project',
          title: 'Suspicious AI Project',
          author: 'user123',
          reportReason: 'Inappropriate content',
          priority: 'high',
          timestamp: '10 minutes ago',
          status: 'pending',
        },
        {
          id: '2',
          type: 'comment',
          title: 'Spam comment on React Tutorial',
          author: 'spammer456',
          reportReason: 'Spam/Advertisement',
          priority: 'medium',
          timestamp: '25 minutes ago',
          status: 'reviewing',
        },
        {
          id: '3',
          type: 'user',
          title: 'User profile with offensive content',
          author: 'baduser789',
          reportReason: 'Harassment',
          priority: 'high',
          timestamp: '1 hour ago',
          status: 'pending',
        },
        {
          id: '4',
          type: 'project',
          title: 'Duplicate project submission',
          author: 'copycat101',
          reportReason: 'Copyright violation',
          priority: 'low',
          timestamp: '2 hours ago',
          status: 'pending',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch manager data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'reviewing': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return '📁';
      case 'comment': return '💬';
      case 'user': return '👤';
      default: return '📄';
    }
  };

  const handleAction = (itemId: string, action: 'approve' | 'reject' | 'review') => {
    setContentQueue(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, status: action === 'review' ? 'reviewing' : 'resolved' }
          : item
      )
    );
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <RequireModerator>
      <DashboardLayout title="Manager Dashboard" requiredRole="moderator">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {isLoading ? '...' : stats.pendingReviews}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Flagged Content</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {isLoading ? '...' : stats.flaggedContent}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚩</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Reports</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {isLoading ? '...' : stats.activeReports}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {isLoading ? '...' : stats.resolvedToday}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Community Health</p>
                  <p className={`text-2xl font-bold ${getHealthColor(stats.communityHealth)}`}>
                    {isLoading ? '...' : `${stats.communityHealth}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#fca311] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💚</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-[#14213d] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-medium text-[#14213d]">Review Queue</h3>
                <p className="text-sm text-gray-600">Process pending content</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">🚩</div>
                <h3 className="font-medium text-[#14213d]">Flagged Items</h3>
                <p className="text-sm text-gray-600">Handle reported content</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="font-medium text-[#14213d]">User Reports</h3>
                <p className="text-sm text-gray-600">Manage user issues</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium text-[#14213d]">Moderation Stats</h3>
                <p className="text-sm text-gray-600">View detailed reports</p>
              </button>
            </div>
          </div>

          {/* Content Moderation Queue */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#14213d]">Content Moderation Queue</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'pending'
                        ? 'bg-[#fca311] text-[#14213d]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Pending ({stats.pendingReviews})
                  </button>
                  <button
                    onClick={() => setActiveTab('flagged')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'flagged'
                        ? 'bg-[#fca311] text-[#14213d]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Flagged ({stats.flaggedContent})
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'reports'
                        ? 'bg-[#fca311] text-[#14213d]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Reports ({stats.activeReports})
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-20 h-8 bg-gray-200 rounded"></div>
                          <div className="w-20 h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {contentQueue.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-[#e5e5e5] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <span className="text-lg">{getTypeIcon(item.type)}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-[#14213d]">{item.title}</h3>
                            <p className="text-sm text-gray-600">
                              by {item.author} • {item.reportReason} • {item.timestamp}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                {item.priority} priority
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAction(item.id, 'approve')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'review')}
                            className="px-4 py-2 bg-[#fca311] text-[#14213d] rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'reject')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireModerator>
  );
}