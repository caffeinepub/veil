import React, { useState } from 'react';
import { useAdminGetAllPosts, useAdminGetFlaggedPosts, useAdminRemovePost } from '../hooks/useQueries';
import EmotionBadge from './EmotionBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Trash2, Flag } from 'lucide-react';

export default function AdminFlaggedPosts() {
  const { data: flags, isLoading: flagsLoading } = useAdminGetFlaggedPosts();
  const { data: allPosts, isLoading: postsLoading } = useAdminGetAllPosts();
  const removePost = useAdminRemovePost();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isLoading = flagsLoading || postsLoading;

  // Group flags by postId
  const flagsByPost = (flags ?? []).reduce<Record<string, number>>((acc, flag) => {
    acc[flag.postId] = (acc[flag.postId] ?? 0) + 1;
    return acc;
  }, {});

  const flaggedPostIds = Object.keys(flagsByPost);
  const flaggedPosts = (allPosts ?? []).filter((p) => flaggedPostIds.includes(p.id));

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
        {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  if (flaggedPosts.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <Flag className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No flagged posts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flaggedPosts.map((post) => (
        <div key={post.id} className="rounded-xl border border-border bg-card shadow-card px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EmotionBadge emotionType={post.emotionType} />
              <Badge variant="destructive" className="text-xs gap-1">
                <Flag className="h-2.5 w-2.5" />
                {flagsByPost[post.id]} report{flagsByPost[post.id] !== 1 ? 's' : ''}
              </Badge>
            </div>
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
                  <AlertDialogTitle>Remove Flagged Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this post. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRemove(post.id)}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">Author: {post.author.toString()}</p>
        </div>
      ))}
    </div>
  );
}
