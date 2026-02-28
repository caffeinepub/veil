import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyProfile, useGetPublicPosts } from '../hooks/useQueries';
import PublicPostCard from '../components/PublicPostCard';
import { Loader2, Users } from 'lucide-react';

export default function CommunityFeedPage() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isFetched: profileFetched, isLoading: profileLoading } = useGetMyProfile();
  const { data: posts, isLoading: postsLoading } = useGetPublicPosts();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && profileFetched && !profileLoading && !profile) {
      navigate({ to: '/signup' });
    }
  }, [isAuthenticated, profile, profileFetched, profileLoading, navigate]);

  if (isInitializing || profileLoading || postsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  const sortedPosts = [...(posts ?? [])].sort(
    (a, b) => Number(b.createdAt - a.createdAt)
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Community Feed</h1>
        <p className="text-sm text-muted-foreground">
          {sortedPosts.length} public post{sortedPosts.length !== 1 ? 's' : ''} from the community
        </p>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Users size={36} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No public posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map(post => (
            <PublicPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
