import { useState } from 'react';
import { EmotionType, type Post } from '../backend';
import { useDeletePost } from '../hooks/useQueries';
import { countWords, MINIMUM_WORD_COUNT, needsMinimumWords } from '../utils/wordCounter';
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
import { Loader2, Trash2, Globe, Lock } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [actionError, setActionError] = useState<string | null>(null);

  const deletePost = useDeletePost();

  const wordCount = countWords(post.content);
  const requiresMinWords = needsMinimumWords(post.emotionType);

  const createdAt = new Date(Number(post.createdAt / BigInt(1_000_000)));

  const handleDelete = async () => {
    setActionError(null);
    try {
      await deletePost.mutateAsync({ postId: post.id });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete post.');
    }
  };

  return (
    <div className="veil-card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <EmotionBadge emotion={post.emotionType as EmotionType} />
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            post.isPrivate
              ? 'bg-muted/50 text-muted-foreground border-border'
              : 'bg-primary/10 text-primary border-primary/30'
          }`}>
            {post.isPrivate ? '🔒 Private' : '🌐 Public'}
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
        <p className="text-xs text-muted-foreground">
          {wordCount} words
        </p>
      )}

      {/* Visibility note */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {post.isPrivate ? (
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

      {/* Action error */}
      {actionError && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{actionError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={deletePost.isPending}
              className="text-muted-foreground hover:text-foreground ml-auto"
            >
              {deletePost.isPending ? <Loader2 className="animate-spin mr-1" size={13} /> : <Trash2 size={13} className="mr-1" />}
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
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
