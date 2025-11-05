'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RequireUser } from '@/components/dashboard/ProtectedRoute';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import CreateProjectForm from '@/components/dashboard/CreateProjectForm';

interface UserStats {
  projects: number;
  totalLikes: number;
  comments: number;
  followers: number;
  following: number;
  profileViews: number;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  techStack: string[];
  tags: string[];
  category: string;
  status: string;
  difficulty: string;
  stats: {
    likes: number;
    comments: number;
    views: number;
  };
  createdAt: string;
  thumbnail?: string;
  links?: {
    github?: string;
    live?: string;
    demo?: string;
  };
  isPublic?: boolean;
}

interface Activity {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'project';
  message: string;
  timestamp: string;
  user?: string;
  projectTitle?: string;
}

function UserDashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedProjectId = searchParams.get('project');
  
  const [stats, setStats] = useState<UserStats>({
    projects: 0,
    totalLikes: 0,
    comments: 0,
    followers: 0,
    following: 0,
    profileViews: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'activity'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFilter, setProjectFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [projectSort, setProjectSort] = useState<'newest' | 'oldest' | 'most-liked' | 'most-viewed'>('newest');

  // Handle project selection from URL parameter
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const project = projects.find(p => p._id === selectedProjectId);
      if (project) {
        setSelectedProject(project);
        setActiveTab('projects');
      }
    }
  }, [selectedProjectId, projects]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch user statistics
      const statsResponse = await fetch('/api/user/stats');
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.statusText}`);
      }
      const statsData = await statsResponse.json();
      setStats({
        projects: statsData.totalProjects || 0,
        totalLikes: statsData.totalLikes || 0,
        comments: statsData.totalComments || 0,
        followers: statsData.totalFollowers || 0,
        following: statsData.totalFollowing || 0,
        profileViews: statsData.profileViews || 0,
      });

      // Fetch user projects
      const projectsResponse = await fetch('/api/user/projects?limit=50');
      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`);
      }
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects);

      // Fetch recent activity
      const activityResponse = await fetch('/api/user/activity?limit=10');
      if (!activityResponse.ok) {
        throw new Error(`Failed to fetch activity: ${activityResponse.statusText}`);
      }
      const activityData = await activityResponse.json();
      setRecentActivity(activityData.activities);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      // Fallback to empty data on error
      setStats({
        projects: 0,
        totalLikes: 0,
        comments: 0,
        followers: 0,
        following: 0,
        profileViews: 0
      });
      setProjects([]);
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👥';
      case 'project': return '📁';
      default: return '📄';
    }
  };

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    fetchUserData(); // Refresh the dashboard data
  };

  const handleProjectSubmit = async (projectData: any) => {
    try {
      const response = await fetch('/api/user/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const newProject = await response.json();
      handleProjectCreated();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error; // Re-throw to let the form handle the error
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handleUpdateProject = async (projectData: any) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      setShowEditModal(false);
      setSelectedProject(null);
      fetchUserData(); // Refresh the dashboard data
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const confirmDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      setShowDeleteModal(false);
      setSelectedProject(null);
      fetchUserData(); // Refresh the dashboard data
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  const handleStatusChange = async (project: Project, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${project._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project status');
      }

      fetchUserData(); // Refresh the dashboard data
    } catch (error) {
      console.error('Error updating project status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update project status');
    }
  };

  const getFilteredAndSortedProjects = () => {
    let filtered = projects;

    // Apply filter
    if (projectFilter !== 'all') {
      filtered = projects.filter(project => project.status === projectFilter);
    }

    // Apply sort
    switch (projectSort) {
      case 'oldest':
        filtered = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'most-liked':
        filtered = [...filtered].sort((a, b) => b.stats.likes - a.stats.likes);
        break;
      case 'most-viewed':
        filtered = [...filtered].sort((a, b) => b.stats.views - a.stats.views);
        break;
      case 'newest':
      default:
        filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  };

  return (
    <RequireUser>
      <DashboardLayout title="My Dashboard" requiredRole="user">
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={fetchUserData}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-[#14213d] to-[#1a2b4a] rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {session?.user?.name || 'Developer'}! 👋
            </h1>
            <p className="text-blue-100">
              Ready to showcase your latest projects and connect with the community?
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projects</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {stats.projects}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#fca311] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Likes</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {stats.totalLikes}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">❤️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comments</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {stats.comments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Followers</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {stats.followers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Following</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {stats.following}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔗</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile Views</p>
                  <p className="text-2xl font-bold text-[#14213d]">
                    {stats.profileViews}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👁️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-[#14213d] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left"
              >
                <div className="text-2xl mb-2">➕</div>
                <h3 className="font-medium text-[#14213d]">New Project</h3>
                <p className="text-sm text-gray-600">Share your latest work</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">✏️</div>
                <h3 className="font-medium text-[#14213d]">Edit Profile</h3>
                <p className="text-sm text-gray-600">Update your information</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-medium text-[#14213d]">Explore</h3>
                <p className="text-sm text-gray-600">Discover new projects</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-[#e5e5e5] transition-colors text-left">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-medium text-[#14213d]">Messages</h3>
                <p className="text-sm text-gray-600">Connect with developers</p>
              </button>
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-[#fca311] text-[#14213d]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'projects'
                      ? 'bg-[#fca311] text-[#14213d]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  My Projects ({stats.projects})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'activity'
                      ? 'bg-[#fca311] text-[#14213d]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Recent Activity
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Projects */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#14213d] mb-4">Recent Projects</h3>
                    <div className="space-y-4">
                      {projects.slice(0, 3).map((project) => (
                        <div key={project._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-[#14213d]">{project.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>❤️ {project.stats.likes}</span>
                              <span>💬 {project.stats.comments}</span>
                              <span>👁️ {project.stats.views}</span>
                            </div>
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#14213d] mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <span className="text-lg">{getActivityIcon(activity.type)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-6">
                  {/* Project Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Filter */}
                      <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fca311] focus:border-transparent"
                      >
                        <option value="all">All Projects</option>
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                        <option value="archived">Archived</option>
                      </select>

                      {/* Sort */}
                      <select
                        value={projectSort}
                        onChange={(e) => setProjectSort(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fca311] focus:border-transparent"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="most-liked">Most Liked</option>
                        <option value="most-viewed">Most Viewed</option>
                      </select>
                    </div>

                    {/* Create New Project Button */}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-[#fca311] text-[#14213d] rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                    >
                      ➕ Create New Project
                    </button>
                  </div>
                  
                  {/* Projects Grid */}
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-6">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                          <div className="flex space-x-4">
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {getFilteredAndSortedProjects().map((project) => (
                        <div key={project._id} className="border border-gray-200 rounded-lg p-6 hover:bg-[#e5e5e5] transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-[#14213d]">{project.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                  {project.status}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {project.techStack.slice(0, 3).map((tech, index) => (
                                  <span key={index} className="px-2 py-1 bg-[#fca311] bg-opacity-20 text-[#14213d] rounded-full text-xs font-medium">
                                    {tech}
                                  </span>
                                ))}
                                {project.techStack.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                    +{project.techStack.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Project Stats */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <span>❤️</span>
                                <span>{project.stats.likes}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>💬</span>
                                <span>{project.stats.comments}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>👁️</span>
                                <span>{project.stats.views}</span>
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Project Actions */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleEditProject(project)}
                              className="px-3 py-1 text-[#14213d] border border-[#14213d] rounded-lg hover:bg-[#14213d] hover:text-white transition-colors text-sm"
                            >
                              ✏️ Edit
                            </button>
                            
                            {/* Status Toggle */}
                            <div className="relative">
                              <select
                                value={project.status}
                                onChange={(e) => handleStatusChange(project, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fca311] focus:border-transparent"
                              >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>

                            {project.links?.live && (
                              <a
                                href={project.links.live}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-[#fca311] text-[#14213d] rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                              >
                                🚀 View Live
                              </a>
                            )}

                            {project.links?.github && (
                              <a
                                href={project.links.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                              >
                                📂 GitHub
                              </a>
                            )}

                            <button
                              onClick={() => handleDeleteProject(project)}
                              className="px-3 py-1 text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoading && getFilteredAndSortedProjects().length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📁</div>
                      <h3 className="text-lg font-semibold text-[#14213d] mb-2">
                        {projectFilter === 'all' ? 'No projects yet' : `No ${projectFilter} projects`}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {projectFilter === 'all' 
                          ? 'Start building your portfolio by creating your first project!'
                          : `You don't have any ${projectFilter} projects yet.`
                        }
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-[#fca311] text-[#14213d] rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                      >
                        Create Your First Project
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 flex items-center justify-center bg-[#e5e5e5] rounded-full">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800">{activity.message}</p>
                        <p className="text-sm text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-[#14213d]">Create New Project</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <CreateProjectForm 
                  onSubmit={handleProjectSubmit}
                  onCancel={() => setShowCreateModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-[#14213d]">Edit Project</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProject(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <CreateProjectForm 
                  initialData={selectedProject}
                  onSubmit={handleUpdateProject}
                  onCancel={() => {
                    setShowEditModal(false);
                    setSelectedProject(null);
                  }}
                  isEditing={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete "<strong>{selectedProject.title}</strong>"? 
                  This will permanently remove the project and all associated data including likes and comments.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedProject(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteProject}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </RequireUser>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={
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
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Loading Dashboard...</h2>
              <p className="mt-2 text-sm text-gray-600">Please wait while we prepare your data</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <UserDashboardContent />
    </Suspense>
  );
}
