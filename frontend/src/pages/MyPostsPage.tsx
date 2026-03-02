import React from 'react';
import { useGetMyPosts } from '../hooks/useQueries';
import PostCard from '../components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Lock, Globe } from 'lucide-react';

export default function MyPostsPage() {
  const { data: posts, isLoading, isError } = useGetMyPosts();

  const privatePosts = posts?.filter((p) => p.visibility === 'privateView') ?? [];
  const publicPosts = posts?.filter((p) => p.visibility === 'publicView') ?? [];

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-semibold text-foreground">My Entries</h1>
        <p className="text-sm text-muted-foreground">Your personal archive — private and public.</p>
      </div>

      {/* Visibility Legend */}
      {posts && posts.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            {privatePosts.length} private
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            {publicPosts.length} public
          </span>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load your entries. Please try again.
        </div>
      )}

      {!isLoading && !isError && posts?.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No entries yet.</p>
          <a href="/write" className="text-sm underline underline-offset-2 hover:text-foreground transition-colors">
            Write your first entry
          </a>
        </div>
      )}

      {!isLoading && !isError && posts && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
