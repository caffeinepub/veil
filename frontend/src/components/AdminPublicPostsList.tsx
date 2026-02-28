import { useAdminPublicPosts, useAdminDeletePost } from '../hooks/useQueries';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Trash2, Wind } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPublicPostsList() {
  const { data: posts, isLoading } = useAdminPublicPosts();
  const deletePost = useAdminDeletePost();

  const sortedPosts = posts
    ? [...posts].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];

  const handleDelete = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success('Post removed.');
    } catch {
      toast.error('Could not remove post.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  if (sortedPosts.length === 0) {
    return (
      <div className="text-center py-16">
        <Wind size={28} className="text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground font-sans text-sm">No public posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedPosts.map((post) => {
        const date = new Date(Number(post.createdAt / BigInt(1_000_000))).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });
        return (
          <article key={post.id} className="veil-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <EmotionBadge emotion={post.emotionType} />
                <span className="text-xs text-muted-foreground font-sans">{date}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {post.userId.toString().slice(0, 10)}…
                </span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-sans text-muted-foreground hover:text-foreground gap-1.5 rounded-lg h-8"
                  >
                    <Trash2 size={12} />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif text-xl">Remove this post?</AlertDialogTitle>
                    <AlertDialogDescription className="font-sans text-sm">
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-sans">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(post.id)}
                      className="rounded-xl font-sans"
                    >
                      {deletePost.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Remove'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="text-sm font-sans text-foreground leading-relaxed line-clamp-3">
              {post.content}
            </p>
            <p className="text-xs text-muted-foreground font-sans">
              {Number(post.reactionCount)} responses
            </p>
          </article>
        );
      })}
    </div>
  );
}
