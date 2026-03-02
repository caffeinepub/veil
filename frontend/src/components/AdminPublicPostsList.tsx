import { useAdminGetAllPosts, useAdminRemovePost } from '../hooks/useQueries';
import { Visibility } from '../backend';
import EmotionBadge from './EmotionBadge';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminPublicPostsList() {
  const { data: allPosts = [], isLoading } = useAdminGetAllPosts();
  const removePost = useAdminRemovePost();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const publicPosts = allPosts
    .filter((p) => p.visibility === Visibility.publicView)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

  const handleRemove = async (postId: string) => {
    setRemovingId(postId);
    try {
      await removePost.mutateAsync(postId);
      toast.success('Post removed.');
    } catch {
      toast.error('Could not remove post.');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>;
  }

  if (publicPosts.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No public posts yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {publicPosts.map((post) => (
        <div
          key={post.id}
          className="bg-card rounded-xl border border-border shadow-soft p-4 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <EmotionBadge emotionType={post.emotionType} />
            </div>
            <div className="flex items-center gap-3">
              <time className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</time>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={removingId === post.id}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    {removingId === post.id ? 'Removing…' : 'Remove'}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif">Remove this post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl bg-secondary text-secondary-foreground hover:opacity-80"
                      onClick={() => handleRemove(post.id)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed line-clamp-4">{post.content}</p>
        </div>
      ))}
    </div>
  );
}
