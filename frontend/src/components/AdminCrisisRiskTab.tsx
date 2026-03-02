import React, { useState } from 'react';
import { useGetCrisisRiskPosts, useSendCheckIn, useSendCrisisResources, useAdminRemovePost } from '../hooks/useQueries';
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
import { Loader2, Trash2, HeartHandshake, BookOpen, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

export default function AdminCrisisRiskTab() {
  const { data: crisisPosts, isLoading } = useGetCrisisRiskPosts();
  const sendCheckIn = useSendCheckIn();
  const sendCrisisResources = useSendCrisisResources();
  const removePost = useAdminRemovePost();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleCheckIn = async (authorStr: string) => {
    setPendingId(`checkin-${authorStr}`);
    try {
      const principal = Principal.fromText(authorStr);
      await sendCheckIn.mutateAsync({
        recipient: principal,
        message: 'Hi, we noticed you have been going through a difficult time. We are here for you. Please reach out if you need support.',
      });
      toast.success('Check-in message sent.');
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to send check-in.');
    } finally {
      setPendingId(null);
    }
  };

  const handleSendResources = async (authorStr: string) => {
    setPendingId(`resources-${authorStr}`);
    try {
      const principal = Principal.fromText(authorStr);
      await sendCrisisResources.mutateAsync(principal);
      toast.success('Crisis resources sent.');
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to send resources.');
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (postId: string) => {
    setPendingId(`remove-${postId}`);
    try {
      await removePost.mutateAsync(postId);
      toast.success('Post removed.');
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to remove post.');
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!crisisPosts || crisisPosts.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <AlertOctagon className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No crisis-flagged posts at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {crisisPosts.map((post) => {
        const authorStr = post.author.toString();
        return (
          <div key={post.id} className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EmotionBadge emotionType={post.emotionType} />
                <Badge variant="destructive" className="text-xs">Crisis Risk</Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(Number(post.createdAt) / 1_000_000).toLocaleDateString()}
              </span>
            </div>

            <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">Author: {authorStr}</p>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                disabled={pendingId === `checkin-${authorStr}`}
                onClick={() => handleCheckIn(authorStr)}
              >
                {pendingId === `checkin-${authorStr}` ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <HeartHandshake className="h-3 w-3" />
                )}
                Send Check-in
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                disabled={pendingId === `resources-${authorStr}`}
                onClick={() => handleSendResources(authorStr)}
              >
                {pendingId === `resources-${authorStr}` ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <BookOpen className="h-3 w-3" />
                )}
                Send Resources
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                    disabled={pendingId === `remove-${post.id}`}
                  >
                    {pendingId === `remove-${post.id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Remove Post
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Crisis Post</AlertDialogTitle>
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
          </div>
        );
      })}
    </div>
  );
}
