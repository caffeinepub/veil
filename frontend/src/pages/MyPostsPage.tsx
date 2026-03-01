import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useGetCallerUserProfile, useGetMyPosts } from '../hooks/useQueries';
import PostCard from '../components/PostCard';
import { Button } from '@/components/ui/button';
import { Loader2, PenLine, Inbox } from 'lucide-react';

export default function MyPostsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: posts, isLoading: postsLoading } = useGetMyPosts();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  useEffect(() => {
    if (profileFetched && !userProfile && isAuthenticated) {
      navigate({ to: '/signup' });
    }
  }, [profileFetched, userProfile, isAuthenticated, navigate]);

  if (isInitializing || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const sortedPosts = posts ? [...posts].sort((a, b) => Number(b.createdAt - a.createdAt)) : [];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">My Posts</h1>
            <p className="text-sm text-muted-foreground mt-1">Your private archive of emotions.</p>
          </div>
          <Button
            onClick={() => navigate({ to: '/create' })}
            size="sm"
            className="flex items-center gap-2"
          >
            <PenLine className="h-4 w-4" />
            New post
          </Button>
        </div>

        {/* Loading */}
        {postsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!postsLoading && sortedPosts.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="flex justify-center">
              <Inbox className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">Nothing here yet</p>
              <p className="text-sm text-muted-foreground">
                Your posts will appear here once you start sharing.
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: '/create' })}
              variant="outline"
              size="sm"
            >
              Write your first post
            </Button>
          </div>
        )}

        {/* Posts list */}
        {!postsLoading && sortedPosts.length > 0 && (
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
