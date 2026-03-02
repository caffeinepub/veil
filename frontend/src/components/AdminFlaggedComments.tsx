import { useGetFlaggedComments, useDeleteComment } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { type Comment, type UserProfile } from '../backend';
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
import { Loader2, MessageSquareWarning, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';

function formatRelativeTime(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

function CommentAuthorName({ userId, actor }: { userId: Principal; actor: any }) {
  const [pseudonym, setPseudonym] = useState<string | null>(null);

  useEffect(() => {
    if (!actor) return;
    actor.getUserProfile(userId)
      .then((profile: UserProfile | null) => {
        if (profile) setPseudonym(profile.pseudonym);
      })
      .catch(() => {});
  }, [actor, userId]);

  if (!pseudonym) {
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {userId.toString().slice(0, 12)}…
      </span>
    );
  }
  return <span className="text-xs font-medium text-foreground">{pseudonym}</span>;
}

export default function AdminFlaggedComments() {
  const { data: flaggedComments, isLoading } = useGetFlaggedComments();
  const deleteComment = useDeleteComment();
  const { actor } = useActor();
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId);
      setDeleteErrors(prev => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    } catch (err: unknown) {
      setDeleteErrors(prev => ({
        ...prev,
        [commentId]: err instanceof Error ? err.message : 'Failed to delete comment.',
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (!flaggedComments || flaggedComments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <MessageSquareWarning size={32} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No flagged comments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {flaggedComments.length} flagged comment{flaggedComments.length !== 1 ? 's' : ''}
      </p>
      {flaggedComments.map((comment: Comment) => (
        <div key={comment.id} className="veil-card space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs text-foreground leading-relaxed">{comment.content}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs text-muted-foreground">by</span>
                <CommentAuthorName userId={comment.userId} actor={actor} />
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs font-mono text-muted-foreground/70">
                  post: {comment.postId.slice(0, 12)}…
                </span>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={deleteComment.isPending}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Trash2 size={13} className="mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The comment will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(comment.id)}>
                    {deleteComment.isPending ? (
                      <Loader2 size={13} className="animate-spin mr-1" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {deleteErrors[comment.id] && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {deleteErrors[comment.id]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
