'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Clock, User } from 'lucide-react';

interface Author {
  _id: string;
  name?: string;
  username?: string;
  profileImage?: string;
}

interface CommentItem {
  _id: string;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  parentId?: string | null;
  depth?: number;
  stats?: { likes?: number; replies?: number };
  replies?: CommentItem[];
}

interface CommentsResponse {
  comments: CommentItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalComments: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ProjectCommentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  // Handle potential array value in catch-all routes; here we expect a single id
  const projectId = (Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id) as string | undefined;

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
      return;
    }
    if (!projectId) return;
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, page, projectId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!projectId) throw new Error('Invalid project ID');
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments?page=${page}&limit=10&sort=recent`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data: CommentsResponse = await res.json();
      setComments(data.comments || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const postComment = async () => {
    if (!content.trim()) return;
    try {
      setSubmitting(true);
      if (!projectId) throw new Error('Invalid project ID');
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to post comment');
      }
      setContent('');
      // refresh
      fetchComments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    try {
      if (!projectId) return;
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}/like`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, stats: { ...(c.stats || {}), likes: data.likesCount ?? data.likes } } : c));
    } catch {
      // ignore
    }
  };

  const loadReplies = async (commentId: string) => {
    try {
      if (!projectId) return;
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const replies: CommentItem[] = data.comment?.replies || [];
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, replies } : c));
    } catch {
      // ignore
    }
  };

  const toggleReplyBox = (commentId: string) => {
    setReplyOpen(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    // Optionally fetch replies when opening the box for the first time
    if (!replyOpen[commentId]) {
      loadReplies(commentId);
    }
  };

  const postReply = async (commentId: string) => {
    const text = (replyContent[commentId] || '').trim();
    if (!text) return;
    try {
      setSubmitting(true);
      if (!projectId) throw new Error('Invalid project ID');
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, parentCommentId: commentId }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to post reply');
      }
      // Clear input
      setReplyContent(prev => ({ ...prev, [commentId]: '' }));
      // Refresh replies list
      await loadReplies(commentId);
      // Increment local replies count on the parent comment
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, stats: { ...(c.stats || {}), replies: (c.stats?.replies || 0) + 1 } } : c));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const deleteComment = async (commentId: string) => {
    if (!projectId) return;
    const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this comment? This will also delete its replies.') : true;
    if (!confirmed) return;
    try {
      setDeleting(prev => ({ ...prev, [commentId]: true }));
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to delete comment');
      }
      // Remove from top-level comments list
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete comment');
    } finally {
      setDeleting(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const deleteReply = async (parentCommentId: string, replyId: string) => {
    if (!projectId) return;
    const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this reply?') : true;
    if (!confirmed) return;
    try {
      setDeleting(prev => ({ ...prev, [replyId]: true }));
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(replyId)}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to delete reply');
      }
      // Remove reply from parent and decrement replies count
      setComments(prev => prev.map(c => {
        if (c._id !== parentCommentId) return c;
        const updatedReplies = (c.replies || []).filter(r => r._id !== replyId);
        const updatedCount = Math.max(0, (c.stats?.replies || updatedReplies.length) - 1);
        return { ...c, replies: updatedReplies, stats: { ...(c.stats || {}), replies: updatedCount } };
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete reply');
    } finally {
      setDeleting(prev => ({ ...prev, [replyId]: false }));
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#e5e5e5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#14213d]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5e5e5]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#14213d]">Project Comments</h1>
          <Link href={`/projects`} className="text-sm text-[#14213d] hover:text-[#fca311]">Back to Projects</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Comment */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#14213d] mb-3">Add a Comment</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#fca311] focus:border-transparent min-h-[100px]"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={postComment}
              disabled={submitting || !content.trim()}
              className="bg-[#fca311] text-white px-5 py-2 rounded-lg hover:bg-[#e8920e] disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">No comments yet. Be the first to comment!</div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      {comment.author?.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={comment.author.profileImage} alt={comment.author?.name || ''} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#14213d]">{comment.author?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">@{comment.author?.username || 'user'}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-400"><Clock className="h-3 w-3 mr-1" /> {formatDate(comment.createdAt)}</div>
                </div>
                <p className="text-gray-700 mt-3 whitespace-pre-line">{comment.content}</p>

                <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                  <button onClick={() => toggleLike(comment._id)} className="flex items-center space-x-1 hover:text-[#fca311]">
                    <Heart className="h-4 w-4" />
                    <span>{comment.stats?.likes ?? 0}</span>
                  </button>
                  <button onClick={() => loadReplies(comment._id)} className="flex items-center space-x-1 hover:text-[#14213d]">
                    <MessageCircle className="h-4 w-4" />
                    <span>{comment.stats?.replies ?? (comment.replies?.length || 0)} Replies</span>
                  </button>
                  <button onClick={() => toggleReplyBox(comment._id)} className="text-[#fca311] hover:text-[#e8920e]">
                    Reply
                  </button>
                  {(session?.user?.id && comment.author?._id === session.user.id) || session?.user?.role === 'admin' ? (
                    <button
                      onClick={() => deleteComment(comment._id)}
                      disabled={!!deleting[comment._id]}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting[comment._id] ? 'Deleting…' : 'Delete'}
                    </button>
                  ) : null}
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-6 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="border-l-2 border-gray-200 pl-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                            {reply.author?.profileImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={reply.author.profileImage} alt={reply.author?.name || ''} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="h-3 w-3 text-gray-600" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#14213d]">{reply.author?.name || 'Unknown'}</p>
                          <span className="ml-2 text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 mt-2 whitespace-pre-line">{reply.content}</p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                          <button onClick={() => toggleLike(reply._id)} className="flex items-center space-x-1 hover:text-[#fca311]">
                            <Heart className="h-3 w-3" />
                            <span>{reply.stats?.likes ?? 0}</span>
                          </button>
                          {(session?.user?.id && reply.author?._id === session.user.id) || session?.user?.role === 'admin' ? (
                            <button
                              onClick={() => deleteReply(comment._id, reply._id)}
                              disabled={!!deleting[reply._id]}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              {deleting[reply._id] ? 'Deleting…' : 'Delete'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply box */}
                {replyOpen[comment._id] && (
                  <div className="mt-4 ml-6 bg-[#e5e5e5] border border-gray-200 rounded-lg p-4">
                    <textarea
                      value={replyContent[comment._id] || ''}
                      onChange={(e) => setReplyContent(prev => ({ ...prev, [comment._id]: e.target.value }))}
                      placeholder="Write a reply..."
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#fca311] focus:border-transparent min-h-[80px]"
                    />
                    <div className="flex justify-end mt-3 space-x-2">
                      <button
                        onClick={() => toggleReplyBox(comment._id)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => postReply(comment._id)}
                        disabled={submitting || !(replyContent[comment._id] || '').trim()}
                        className="bg-[#fca311] text-white px-5 py-2 rounded-lg hover:bg-[#e8920e] disabled:opacity-50"
                      >
                        {submitting ? 'Posting...' : 'Post Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="flex space-x-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 rounded-lg ${
                    page === i + 1 ? 'bg-[#fca311] text-white' : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
