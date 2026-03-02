import { useState } from 'react';
import { useAdminGetAllFlaggedPostsWithRecords, useAdminRemovePost, useAdminGetAllPosts } from '../hooks/useQueries';
import { toast } from 'sonner';
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
import { Post } from '../backend';

export default function AdminFlaggedPosts() {
  const { data: flaggedWithRecords = [], isLoading } = useAdminGetAllFlaggedPostsWithRecords();
  const { data: allPosts = [] } = useAdminGetAllPosts();
  const removePost = useAdminRemovePost();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const getPost = (postId: string): Post | undefined =>
    allPosts.find((p) => p.id === postId);

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

  const flaggedEntries = flaggedWithRecords.filter(([, flags]) => flags.length > 0);

  if (flaggedEntries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">No flagged posts.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {flaggedEntries.map(([postId, flags]) => {
        const post = getPost(postId);
        return (
          <div
            key={postId}
            className="bg-card rounded-xl border border-border shadow-soft p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground font-mono">{postId.slice(0, 12)}…</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground w-fit">
                  {flags.length} {flags.length === 1 ? 'report' : 'reports'}
                </span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={removingId === postId}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    {removingId === postId ? 'Removing…' : 'Remove'}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif">Remove this post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The post will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl bg-secondary text-secondary-foreground hover:opacity-80"
                      onClick={() => handleRemove(postId)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {post && (
              <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                {post.content}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              {flags.map((flag) => (
                <p key={flag.id} className="text-xs text-muted-foreground">
                  "{flag.reason}"
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
