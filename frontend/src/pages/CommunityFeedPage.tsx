import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, usePublicPosts } from '../hooks/useQueries';
import PublicPostCard from '../components/PublicPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Wind } from 'lucide-react';

export default function CommunityFeedPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: profile, isFetched } = useGetCallerUserProfile();
  const { data: posts, isLoading } = usePublicPosts();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
    if (isFetched && profile === null) navigate({ to: '/signup' });
  }, [isAuthenticated, profile, isFetched, navigate]);

  // Sort chronologically (newest first)
  const sortedPosts = posts
    ? [...posts].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];

  const currentUserId = identity?.getPrincipal().toString();

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans mb-10"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="mb-10">
        <h1 className="font-serif text-3xl font-medium text-foreground">
          The Room
        </h1>
        <p className="mt-2 text-muted-foreground font-sans text-sm">
          What members have chosen to share. Chronological. No ranking.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-20">
          <Wind size={32} className="text-muted-foreground/40 mx-auto mb-4" />
          <p className="font-serif text-xl text-muted-foreground mb-2">The room is quiet</p>
          <p className="text-sm text-muted-foreground font-sans">
            No public posts yet. Be the first to share something.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <PublicPostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
