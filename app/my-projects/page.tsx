'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RequireUser } from '@/components/dashboard/ProtectedRoute';
import { 
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Edit,
  Trash2,
  ExternalLink,
  Github,
  Globe,
  Tag,
  Clock,
  MoreVertical
} from 'lucide-react';
import CreateProjectForm from '../../components/dashboard/CreateProjectForm';

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
  updatedAt: string;
  thumbnail?: string;
  links?: {
    github?: string;
    live?: string;
    demo?: string;
  };
  isPublic?: boolean;
}

export default function MyProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Projects' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most-liked', label: 'Most Liked' },
    { value: 'most-viewed', label: 'Most Viewed' }
  ];

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    fetchProjects();
  }, [session, status, router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: sortBy,
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/user/projects?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: any) => {
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
      setProjects([newProject, ...projects]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error; // Re-throw to let the form handle the error
    }
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

      const updatedProject = await response.json();
      setProjects(projects.map(p => p._id === updatedProject._id ? updatedProject : p));
      setShowEditModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
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

  const confirmDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedProject(null);
        fetchProjects();
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const getFilteredAndSortedProjects = () => {
    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      filtered = projects.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.techStack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase())) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply sort
    switch (sortBy) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredProjects = getFilteredAndSortedProjects();

  if (status === 'loading' || loading) {
    return (
      <RequireUser>
        <DashboardLayout title="My Projects" requiredRole="user">
          <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fca311]"></div>
          </div>
        </DashboardLayout>
      </RequireUser>
    );
  }

  if (error) {
    return (
      <RequireUser>
        <DashboardLayout title="My Projects" requiredRole="user">
          <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#14213d] mb-4">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchProjects}
                className="bg-[#fca311] text-white px-4 py-2 rounded-lg hover:bg-[#e8930e] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </DashboardLayout>
      </RequireUser>
    );
  }

  return (
    <RequireUser>
      <DashboardLayout title="My Projects" requiredRole="user">
        <div className="min-h-screen bg-[#ffffff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#14213d]">My Projects</h1>
              <p className="mt-2 text-gray-600">
                Manage and showcase your development projects
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-[#fca311] text-white rounded-lg hover:bg-[#e8930e] transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 bg-[#e5e5e5] rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fca311] focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fca311] focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fca311] focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-[#e5e5e5] rounded-full flex items-center justify-center">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-[#14213d] mb-2">
              {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {projects.length === 0 
                ? 'Start building your portfolio by creating your first project'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {projects.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-[#fca311] text-white rounded-lg hover:bg-[#e8930e] transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
              >
                {/* Project Image */}
                <div className="h-48 bg-gradient-to-br from-[#14213d] to-[#fca311] rounded-t-lg relative overflow-hidden">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white text-6xl opacity-50">
                        📁
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>

                  {/* Actions Menu */}
                  <div className="absolute top-3 right-3">
                    <div className="relative group">
                      <button className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-[120px]">
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowEditModal(true);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowDeleteModal(true);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#14213d] mb-2 line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.shortDescription || project.description}
                  </p>

                  {/* Tech Stack */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 3).map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[#fca311] bg-opacity-10 text-[#14213d] text-xs rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {project.stats.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {project.stats.comments}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {project.stats.views}
                      </span>
                    </div>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="flex items-center space-x-2">
                    {project.links?.github && (
                      <a
                        href={project.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="View on GitHub"
                      >
                        <Github className="w-4 h-4 text-gray-600" />
                      </a>
                    )}
                    {project.links?.live && (
                      <a
                        href={project.links.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="View Live Demo"
                      >
                        <Globe className="w-4 h-4 text-gray-600" />
                      </a>
                    )}
                    {project.links?.demo && (
                      <a
                        href={project.links.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="View Demo"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#14213d]">Create New Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <CreateProjectForm
                onSubmit={handleCreateProject}
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
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#14213d]">Edit Project</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProject(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
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
              <h3 className="text-lg font-semibold text-[#14213d] mb-4">
                Delete Project
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedProject.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  </RequireUser>
  );
}