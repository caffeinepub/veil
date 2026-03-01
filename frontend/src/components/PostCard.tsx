import { useState } from 'react';
import { EmotionType, Visibility, type Post } from '../backend';
import { useDeletePost, useTogglePostVisibility } from '../hooks/useQueries';
import { countWords, needsMinimumWords } from '../utils/wordCounter';
import EmotionBadge from './EmotionBadge';
import { Button } from '@/components/ui/button';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, Trash2, Globe, Lock } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

function getToggleErrorMessage(errorMsg: string): string {
  const lower = errorMsg.toLowerCase();
  if (lower.includes('already toggled') || lower.includes('toggle') && lower.includes('once per')) {
    return 'This post has already been toggled today. Try again tomorrow.';
  }
  if (lower.includes('rate limit')) {
    return 'Visibility toggle limit reached for today. Try again tomorrow.';
  }
  return errorMsg;
}

export default function PostCard({ post }: PostCardProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const deletePost = useDeletePost();
  const toggleVisibility = useTogglePostVisibility();

  const isPrivate = post.visibility === Visibility.privateView;
  const wordCount = countWords(post.content);
  const requiresMinWords = needsMinimumWords(post.emotionType);
  const createdAt = new Date(Number(post.createdAt / BigInt(1_000_000)));

  const handleDelete = async () => {
    setActionError(null);
    try {
      await deletePost.mutateAsync(post.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete post.');
    }
  };

  const handleToggleVisibility = async () => {
    setToggleError(null);
    try {
      await toggleVisibility.mutateAsync(post.id);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to toggle visibility.';
      setToggleError(getToggleErrorMessage(raw));
    }
  };

  const isTogglePending = toggleVisibility.isPending && toggleVisibility.variables === post.id;

  return (
    <div className="veil-card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <EmotionBadge emotion={post.emotionType as EmotionType} />
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            isPrivate
              ? 'bg-muted/50 text-muted-foreground border-border'
              : 'bg-primary/10 text-primary border-primary/30'
          }`}>
            {isPrivate ? '🔒 Private' : '🌐 Public'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {createdAt.toLocaleDateString()}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Word count info */}
      {requiresMinWords && (
        <p className="text-xs text-muted-foreground">{wordCount} words</p>
      )}

      {/* Visibility note */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {isPrivate ? (
          <>
            <Lock size={11} />
            <span>Only visible to you</span>
          </>
        ) : (
          <>
            <Globe size={11} />
            <span>Visible in community feed</span>
          </>
        )}
      </div>

      {/* Toggle error */}
      {toggleError && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{toggleError}</p>
      )}

      {/* Action error */}
      {actionError && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{actionError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {/* Visibility toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleVisibility}
                disabled={isTogglePending || deletePost.isPending}
                className="text-xs gap-1.5"
              >
                {isTogglePending ? (
                  <Loader2 className="animate-spin" size={13} />
                ) : isPrivate ? (
                  <Globe size={13} />
                ) : (
                  <Lock size={13} />
                )}
                {isPrivate ? 'Make public' : 'Make private'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">
                {isPrivate
                  ? 'Share this post to the community feed'
                  : 'Hide this post from the community feed'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={deletePost.isPending || isTogglePending}
              className="text-muted-foreground hover:text-foreground ml-auto"
            >
              {deletePost.isPending
                ? <Loader2 className="animate-spin mr-1" size={13} />
                : <Trash2 size={13} className="mr-1" />}
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The post will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
