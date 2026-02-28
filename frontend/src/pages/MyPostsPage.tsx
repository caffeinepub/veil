import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetMySubscriptionStatus, useMyPosts } from '../hooks/useQueries';
import PostCard from '../components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Feather } from 'lucide-react';

export default function MyPostsPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: profile, isFetched } = useGetCallerUserProfile();
  const { data: subscriptionStatus } = useGetMySubscriptionStatus();
  const { data: posts, isLoading } = useMyPosts();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
    if (isFetched && profile === null) navigate({ to: '/signup' });
  }, [isAuthenticated, profile, isFetched, navigate]);

  // Sort chronologically (newest first)
  const sortedPosts = posts
    ? [...posts].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];

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
          Your Posts
        </h1>
        <p className="mt-2 text-muted-foreground font-sans text-sm">
          Your emotional archive. Private by default.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-20">
          <Feather size={32} className="text-muted-foreground/40 mx-auto mb-4" />
          <p className="font-serif text-xl text-muted-foreground mb-2">Nothing here yet</p>
          <p className="text-sm text-muted-foreground font-sans">
            When you're ready, your words will find their way here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              subscriptionStatus={subscriptionStatus ?? null}
              region={profile?.region ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
