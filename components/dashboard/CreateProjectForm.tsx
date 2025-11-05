'use client';

import React, { useState } from 'react';
import { popularTechStack, popularTags } from '../../models/Project';

interface ProjectFormData {
  title: string;
  description: string;
  shortDescription: string;
  techStack: string[];
  tags: string[];
  category: string;
  status: string;
  difficulty: string;
  links: {
    github?: string;
    liveDemo?: string;
    documentation?: string;
    repository?: string;
  };
  isPublic: boolean;
}

interface CreateProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: any; // Project data for editing
  isEditing?: boolean;
}

const categories = [
  { value: 'web-app', label: 'Web Application' },
  { value: 'mobile-app', label: 'Mobile Application' },
  { value: 'desktop-app', label: 'Desktop Application' },
  { value: 'api', label: 'API/Backend' },
  { value: 'library', label: 'Library/Package' },
  { value: 'tool', label: 'Tool/Utility' },
  { value: 'game', label: 'Game' },
  { value: 'ai-ml', label: 'AI/Machine Learning' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'iot', label: 'IoT' },
  { value: 'other', label: 'Other' }
];

const statuses = [
  { value: 'planning', label: 'Planning' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'archived', label: 'Archived' }
];

const difficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

export default function CreateProjectForm({ onSubmit, onCancel, isLoading = false, initialData, isEditing = false }: CreateProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    techStack: initialData?.techStack || [],
    tags: initialData?.tags || [],
    category: initialData?.category || '',
    status: initialData?.status || 'planning',
    difficulty: initialData?.difficulty || '',
    links: {
      github: initialData?.links?.github || '',
      liveDemo: initialData?.links?.live || initialData?.links?.liveDemo || '',
      documentation: initialData?.links?.documentation || '',
      repository: initialData?.links?.repository || '',
    },
    isPublic: initialData?.isPublic !== undefined ? initialData.isPublic : true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [techStackInput, setTechStackInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Difficulty level is required';
    }

    if (formData.shortDescription && formData.shortDescription.length > 300) {
      newErrors.shortDescription = 'Short description must be less than 300 characters';
    }

    if (formData.techStack.length > 20) {
      newErrors.techStack = 'Maximum 20 technologies allowed';
    }

    if (formData.tags.length > 15) {
      newErrors.tags = 'Maximum 15 tags allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleLinksChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: {
        ...prev.links,
        [field]: value
      }
    }));
  };

  const addTechStack = (tech: string) => {
    const trimmedTech = tech.trim();
    if (trimmedTech && !formData.techStack.includes(trimmedTech) && formData.techStack.length < 20) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, trimmedTech]
      }));
    }
  };

  const removeTechStack = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag) && formData.tags.length < 15) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleTechStackKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (techStackInput.trim()) {
        addTechStack(techStackInput);
        setTechStackInput('');
      }
    }
  };

  const handleTagsKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagsInput.trim()) {
        addTag(tagsInput);
        setTagsInput('');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#14213d] mb-2">
          {isEditing ? 'Edit Project' : 'Create New Project'}
        </h2>
        <p className="text-gray-600">
          {isEditing ? 'Update your project details' : 'Share your project with the CodeCircle community'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[#14213d] mb-2">
            Project Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311] ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your project title"
            maxLength={200}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          <p className="mt-1 text-sm text-gray-500">{formData.title.length}/200 characters</p>
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="shortDescription" className="block text-sm font-medium text-[#14213d] mb-2">
            Short Description
          </label>
          <input
            type="text"
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311] ${
              errors.shortDescription ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Brief description for project cards"
            maxLength={300}
          />
          {errors.shortDescription && <p className="mt-1 text-sm text-red-500">{errors.shortDescription}</p>}
          <p className="mt-1 text-sm text-gray-500">{formData.shortDescription.length}/300 characters</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[#14213d] mb-2">
            Project Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311] ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your project in detail..."
            maxLength={5000}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          <p className="mt-1 text-sm text-gray-500">{formData.description.length}/5000 characters</p>
        </div>

        {/* Category and Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[#14213d] mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311] ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-[#14213d] mb-2">
              Difficulty Level *
            </label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) => handleInputChange('difficulty', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311] ${
                errors.difficulty ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select difficulty</option>
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
            {errors.difficulty && <p className="mt-1 text-sm text-red-500">{errors.difficulty}</p>}
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[#14213d] mb-2">
            Project Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311]"
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        {/* Tech Stack */}
        <div>
          <label className="block text-sm font-medium text-[#14213d] mb-2">
            Tech Stack
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              onKeyPress={handleTechStackKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311]"
              placeholder="Type technology and press Enter or comma to add"
            />
            <div className="flex flex-wrap gap-2">
              {formData.techStack.map(tech => (
                <span
                  key={tech}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#fca311] text-white"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechStack(tech)}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <p className="text-sm text-gray-600 w-full">Popular technologies:</p>
              {popularTechStack.slice(0, 10).map(tech => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => addTechStack(tech)}
                  className="px-2 py-1 text-xs bg-[#e5e5e5] text-[#14213d] rounded hover:bg-[#fca311] hover:text-white transition-colors"
                  disabled={formData.techStack.includes(tech)}
                >
                  {tech}
                </button>
              ))}
            </div>
            {errors.techStack && <p className="text-sm text-red-500">{errors.techStack}</p>}
            <p className="text-sm text-gray-500">{formData.techStack.length}/20 technologies</p>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-[#14213d] mb-2">
            Tags
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyPress={handleTagsKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311]"
              placeholder="Type tag and press Enter or comma to add"
            />
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#fca311] text-white"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <p className="text-sm text-gray-600 w-full">Popular tags:</p>
              {popularTags.slice(0, 10).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-2 py-1 text-xs bg-[#e5e5e5] text-[#14213d] rounded hover:bg-[#fca311] hover:text-white transition-colors"
                  disabled={formData.tags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            {errors.tags && <p className="text-sm text-red-500">{errors.tags}</p>}
            <p className="text-sm text-gray-500">{formData.tags.length}/15 tags</p>
          </div>
        </div>

        {/* Links */}
        <div>
          <label className="block text-sm font-medium text-[#14213d] mb-2">
            Project Links
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="github" className="block text-xs text-gray-600 mb-1">GitHub Repository</label>
              <input
                type="url"
                id="github"
                value={formData.links.github || ''}
                onChange={(e) => handleLinksChange('github', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311]"
                placeholder="https://github.com/username/repo"
              />
            </div>
            <div>
              <label htmlFor="liveDemo" className="block text-xs text-gray-600 mb-1">Live Demo</label>
              <input
                type="url"
                id="liveDemo"
                value={formData.links.liveDemo || ''}
                onChange={(e) => handleLinksChange('liveDemo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311]"
                placeholder="https://your-project.com"
              />
            </div>
            <div>
              <label htmlFor="documentation" className="block text-xs text-gray-600 mb-1">Documentation</label>
              <input
                type="url"
                id="documentation"
                value={formData.links.documentation || ''}
                onChange={(e) => handleLinksChange('documentation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311]"
                placeholder="https://docs.your-project.com"
              />
            </div>
            <div>
              <label htmlFor="repository" className="block text-xs text-gray-600 mb-1">Other Repository</label>
              <input
                type="url"
                id="repository"
                value={formData.links.repository || ''}
                onChange={(e) => handleLinksChange('repository', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fca311]"
                placeholder="https://gitlab.com/username/repo"
              />
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              className="w-4 h-4 text-[#fca311] border-gray-300 rounded focus:ring-[#fca311]"
            />
            <span className="text-sm text-[#14213d]">Make this project public</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Public projects can be discovered and viewed by other users
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#14213d] text-white rounded-md hover:bg-[#0f1a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Project' : 'Create Project')
            }
          </button>
        </div>
      </form>
    </div>
  );
}