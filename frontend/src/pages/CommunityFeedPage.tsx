import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useGetCallerUserProfile, useGetPublicPosts } from '../hooks/useQueries';
import PublicPostCard from '../components/PublicPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollText } from 'lucide-react';

export default function CommunityFeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: profile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: posts, isLoading: postsLoading } = useGetPublicPosts();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  useEffect(() => {
    if (profileFetched && !profile && isAuthenticated) {
      navigate({ to: '/signup' });
    }
  }, [profileFetched, profile, isAuthenticated, navigate]);

  if (isInitializing || profileLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  // Posts are already sorted newest-first by useGetPublicPosts
  const sortedPosts = posts ?? [];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Community Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Shared voices — newest first</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <ScrollText className="w-3.5 h-3.5" />
          Chronological
        </div>
      </div>

      {postsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No public posts yet</p>
          <p className="text-sm mt-1">Be the first to share something with the community.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <PublicPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
