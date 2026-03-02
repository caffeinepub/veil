import React from 'react';
import { useGetPublicPosts } from '../hooks/useQueries';
import PublicPostCard from '../components/PublicPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from '@tanstack/react-router';

export default function CommunityFeedPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: posts, isLoading, isError } = useGetPublicPosts();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-semibold text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground">Public entries from the VEIL community.</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load community posts. Please try again.
        </div>
      )}

      {!isLoading && !isError && posts?.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Users className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No public entries yet.</p>
          <p className="text-sm text-muted-foreground">Be the first to share with the community.</p>
        </div>
      )}

      {!isLoading && !isError && posts && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PublicPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
