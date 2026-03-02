import { useAdminGetFlaggedPosts, useAdminRemovePost } from '../hooks/useQueries';
import { type Flag } from '../backend';
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
import { Loader2, Flag as FlagIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminFlaggedPosts() {
  const { data: flags, isLoading } = useAdminGetFlaggedPosts();
  const removePost = useAdminRemovePost();
  const [removeErrors, setRemoveErrors] = useState<Record<string, string>>({});

  const handleRemove = async (postId: string) => {
    try {
      await removePost.mutateAsync(postId);
      setRemoveErrors(prev => { const n = { ...prev }; delete n[postId]; return n; });
      toast.success('Post removed successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove post.';
      setRemoveErrors(prev => ({ ...prev, [postId]: msg }));
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (!flags || flags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <FlagIcon size={32} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No flagged posts.</p>
      </div>
    );
  }

  // Group flags by postId
  const flagsByPost = flags.reduce<Record<string, Flag[]>>((acc, flag) => {
    if (!acc[flag.postId]) acc[flag.postId] = [];
    acc[flag.postId].push(flag);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {Object.keys(flagsByPost).length} flagged post{Object.keys(flagsByPost).length !== 1 ? 's' : ''}
      </p>
      {Object.entries(flagsByPost).map(([postId, postFlags]) => (
        <div key={postId} className="veil-card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-xs font-mono text-muted-foreground">Post ID: {postId.slice(0, 16)}…</p>
              <div className="flex items-center gap-1.5">
                <FlagIcon size={12} className="text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  {postFlags.length} report{postFlags.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={removePost.isPending}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  {removePost.isPending ? (
                    <Loader2 size={13} className="animate-spin mr-1" />
                  ) : (
                    <Trash2 size={13} className="mr-1" />
                  )}
                  Remove Post
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the post from the community feed.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleRemove(postId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove Post
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Flag reasons */}
          <div className="space-y-1.5">
            {postFlags.map((flag: Flag) => (
              <div key={flag.id} className="bg-muted/30 rounded-lg px-3 py-2 space-y-0.5">
                <p className="text-xs text-foreground font-medium">{flag.reason}</p>
                <p className="text-xs text-muted-foreground">
                  Reported by {flag.reporter.toString().slice(0, 12)}… ·{' '}
                  {new Date(Number(flag.createdAt / BigInt(1_000_000))).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {removeErrors[postId] && (
            <p className="text-xs text-amber-700 dark:text-amber-400">{removeErrors[postId]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
