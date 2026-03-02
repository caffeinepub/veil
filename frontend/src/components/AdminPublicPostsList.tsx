import React, { useState } from 'react';
import { useAdminGetAllPosts, useAdminRemovePost } from '../hooks/useQueries';
import EmotionBadge from './EmotionBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Loader2, Trash2 } from 'lucide-react';

export default function AdminPublicPostsList() {
  const { data: posts, isLoading } = useAdminGetAllPosts();
  const removePost = useAdminRemovePost();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const publicPosts = posts?.filter((p) => p.visibility === 'publicView') ?? [];

  const handleRemove = async (postId: string) => {
    setRemovingId(postId);
    try {
      await removePost.mutateAsync(postId);
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  if (publicPosts.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No public posts.</p>;
  }

  return (
    <div className="space-y-3">
      {publicPosts
        .sort((a, b) => Number(b.createdAt - a.createdAt))
        .map((post) => (
          <div key={post.id} className="rounded-xl border border-border bg-card shadow-card px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <EmotionBadge emotionType={post.emotionType} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(Number(post.createdAt) / 1_000_000).toLocaleDateString()}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                      {removingId === post.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Post</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove the post from the community feed. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemove(post.id)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">Author: {post.author.toString()}</p>
          </div>
        ))}
    </div>
  );
}
