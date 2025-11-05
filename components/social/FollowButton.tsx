'use client';

import { useEffect, useState } from 'react';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
}

export default function FollowButton({ targetUserId, className }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/user/follow-status?targetUserId=${encodeURIComponent(targetUserId)}`);
        if (!res.ok) return;
        const data = await res.json();
        setIsFollowing(Boolean(data.isFollowing));
      } catch (e) {
        // ignore
      }
    };
    fetchStatus();
  }, [targetUserId]);

  const toggleFollow = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/user/${encodeURIComponent(targetUserId)}/follow`, { method: 'POST' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to toggle follow');
      }
      const data = await res.json();
      setIsFollowing(Boolean(data.following));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const label = isFollowing ? 'Following' : 'Follow';

  return (
    <div className={className}>
      <button
        onClick={toggleFollow}
        disabled={loading || isFollowing === null}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border ${
          isFollowing
            ? 'bg-[#14213d] text-white hover:bg-[#0f1a2e] border-transparent'
            : 'bg-[#fca311] text-white hover:bg-[#e8920e] border-transparent'
        } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        aria-label={label}
      >
        {loading ? 'Please wait...' : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

