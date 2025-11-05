'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, User, Github, Globe, Clock } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  tags: string[];
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  techStack: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    _id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
  };
}

interface ProjectsResponse {
  projects: Project[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProjects: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  // Search & Filters
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState(''); // comma-separated
  const [techInput, setTechInput] = useState(''); // comma-separated
  const [sort, setSort] = useState('recent'); // recent | likes | comments | views | title
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // Simple listing: no filters or sorting controls

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, query, category, tagsInput, techInput, sort, order, trendingOnly, featuredOnly, difficulty.join(',')]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (query) params.set('q', query);
      if (category) params.set('category', category);
      if (tagsInput.trim()) params.set('tags', tagsInput.trim());
      if (techInput.trim()) params.set('tech', techInput.trim());
      if (difficulty.length) params.set('difficulty', difficulty.map(d => d.toLowerCase()).join(','));
      if (sort) params.set('sort', sort);
      if (order) params.set('order', order);
      if (trendingOnly) params.set('trending', 'true');
      if (featuredOnly) params.set('featured', 'true');

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data: ProjectsResponse = await response.json();
      setProjects(data.projects);
      setTotalPages(data.pagination.totalPages);
      // Reset liked map on new page load (unknown initial liked state)
      const newLiked: Record<string, boolean> = {};
      data.projects.forEach(p => { newLiked[p._id] = false; });
      setLikedMap(newLiked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // No interactive logic; just fetching and displaying projects

  const applyFilters = () => {
    setCurrentPage(1);
    setQuery(queryInput.trim());
  };

  const clearFilters = () => {
    setQueryInput('');
    setQuery('');
    setCategory('');
    setDifficulty([]);
    setTagsInput('');
    setTechInput('');
    setSort('recent');
    setOrder('desc');
    setTrendingOnly(false);
    setFeaturedOnly(false);
    setCurrentPage(1);
  };

  const toggleDifficulty = (level: string) => {
    setDifficulty(prev => prev.includes(level)
      ? prev.filter(d => d !== level)
      : [...prev, level]
    );
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Toggle like/unlike for a project
  const toggleLike = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.status === 401) {
        // Redirect unauthenticated users to login, then back to /projects
        router.push(`/auth/login?callbackUrl=${encodeURIComponent('/projects')}`);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }
      const data = await res.json();
      setLikedMap(prev => ({ ...prev, [projectId]: !!data.liked }));
      // Optimistically update likes count in UI
      setProjects(prev => prev.map(p => {
        if (p._id === projectId) {
          const delta = data.liked ? 1 : -1;
          return { ...p, stats: { ...p.stats, likes: Math.max(0, (p.stats.likes || 0) + delta) } };
        }
        return p;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  // Always render projects page; unauthenticated users can view

  return (
    <div className="min-h-screen bg-[#e5e5e5]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#14213d]">Discover Projects</h1>
              <p className="mt-2 text-gray-600">Explore amazing projects from developers around the world</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => router.push('/user-dashboard')}
                className="bg-[#fca311] text-white px-6 py-2 rounded-lg hover:bg-[#e8920e] transition-colors"
              >
                My Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* Row 1: Search and Sort */}
            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Search by title, description, tags, tech..."
                  className="w-full px-4 py-2 rounded-lg bg-[#e5e5e5] text-[#14213d] placeholder-gray-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-3 md:mt-0">
                <label className="text-sm text-[#14213d]">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-[#14213d]"
                >
                  <option value="recent">Recent</option>
                  <option value="likes">Most Liked</option>
                  <option value="comments">Most Commented</option>
                  <option value="views">Most Viewed</option>
                  <option value="title">Title</option>
                </select>
                <select
                  value={order}
                  onChange={(e) => { setOrder(e.target.value as 'asc' | 'desc'); setCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-[#14213d]"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            {/* Row 2: Category & Difficulty */}
            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#14213d]">Category</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-[#14213d]"
                >
                  <option value="">All</option>
                  <option value="web-app">Web App</option>
                  <option value="mobile-app">Mobile App</option>
                  <option value="desktop-app">Desktop App</option>
                  <option value="api">API</option>
                  <option value="library">Library</option>
                  <option value="tool">Tool</option>
                  <option value="game">Game</option>
                  <option value="ai-ml">AI/ML</option>
                  <option value="blockchain">Blockchain</option>
                  <option value="iot">IoT</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-3 mt-3 md:mt-0">
                <span className="text-sm text-[#14213d]">Difficulty</span>
                {['Beginner','Intermediate','Advanced'].map(level => (
                  <label key={level} className="flex items-center gap-1 text-sm text-[#14213d]">
                    <input
                      type="checkbox"
                      checked={difficulty.includes(level)}
                      onChange={() => toggleDifficulty(level)}
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            {/* Row 3: Tags & Tech */}
            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Tags (comma separated)"
                  className="w-full px-4 py-2 rounded-lg bg-[#e5e5e5] text-[#14213d] placeholder-gray-500 focus:outline-none"
                />
              </div>
              <div className="flex-1 mt-3 md:mt-0">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="Tech stack (comma separated)"
                  className="w-full px-4 py-2 rounded-lg bg-[#e5e5e5] text-[#14213d] placeholder-gray-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 mt-3 md:mt-0">
                <label className="flex items-center gap-2 text-sm text-[#14213d]">
                  <input
                    type="checkbox"
                    checked={trendingOnly}
                    onChange={(e) => { setTrendingOnly(e.target.checked); setCurrentPage(1); }}
                  />
                  Trending
                </label>
                <label className="flex items-center gap-2 text-sm text-[#14213d]">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(e) => { setFeaturedOnly(e.target.checked); setCurrentPage(1); }}
                  />
                  Featured
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={applyFilters}
                className="bg-[#fca311] text-white px-4 py-2 rounded-lg hover:bg-[#e8920e] transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg border border-gray-300 text-[#14213d] hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={fetchProjects}
              className="bg-[#fca311] text-white px-6 py-2 rounded-lg hover:bg-[#e8920e] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No projects found</div>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {projects.map((project) => (
                <div key={project._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Project Image */}
                  {project.imageUrl && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-[#14213d] line-clamp-2">
                        {project.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(project.difficulty)}`}>
                        {project.difficulty}
                      </span>
                    </div>

                    {/* Author */}
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        {project.author.profileImage ? (
                          <img
                            src={project.author.profileImage}
                            alt={project.author.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#14213d]">{project.author.name}</p>
                        <p className="text-xs text-gray-500">@{project.author.username}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {project.shortDescription || project.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[#fca311] bg-opacity-10 text-[#fca311] text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{project.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <button
                          onClick={() => toggleLike(project._id)}
                          className={`px-3 py-1 rounded-lg border transition-colors ${likedMap[project._id] ? 'bg-[#fca311] text-white border-[#fca311]' : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                          {likedMap[project._id] ? 'Unlike' : 'Like'}
                        </button>
                        <div className="text-gray-600">Likes: {project.stats.likes}</div>
                        <Link href={`/projects/${project._id}/comments`} className="text-[#14213d] hover:text-[#fca311]">
                          Comments: {project.stats.comments}
                        </Link>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{project.stats.views}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(project.createdAt)}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex items-center space-x-3">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-[#14213d] hover:text-[#fca311] transition-colors"
                        >
                          <Github className="h-4 w-4" />
                          <span className="text-sm">Code</span>
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-[#14213d] hover:text-[#fca311] transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">Live</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === i + 1
                          ? 'bg-[#fca311] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
