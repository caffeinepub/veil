import { useState } from 'react';
import { useGetFlaggedComments, useDeleteComment, useAdminGetAllUsers } from '../hooks/useQueries';
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

function formatRelativeTime(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminFlaggedComments() {
  const { data: flaggedComments = [], isLoading } = useGetFlaggedComments();
  const { data: allUsers = [] } = useAdminGetAllUsers();
  const deleteComment = useDeleteComment();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getPseudonym = (userId: string): string => {
    const user = allUsers.find((u) => u.id.toString() === userId);
    return user?.pseudonym ?? userId.slice(0, 8) + '…';
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      await deleteComment.mutateAsync(commentId);
      toast.success('Comment removed.');
    } catch {
      toast.error('Could not remove comment.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>;
  }

  if (flaggedComments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">No flagged comments.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {flaggedComments.map((comment) => (
        <div
          key={comment.id}
          className="bg-card rounded-xl border border-border shadow-soft p-4 flex flex-col gap-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">
                {getPseudonym(comment.userId.toString())} ·{' '}
                {formatRelativeTime(comment.createdAt)}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                Post: {comment.postId.slice(0, 10)}…
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={deletingId === comment.id}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  {deletingId === comment.id ? 'Removing…' : 'Remove'}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif">Remove this comment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-xl bg-secondary text-secondary-foreground hover:opacity-80"
                    onClick={() => handleDelete(comment.id)}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
