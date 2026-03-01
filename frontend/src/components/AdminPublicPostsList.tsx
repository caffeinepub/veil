import { useState } from 'react';
import { useAdminGetAllPublicPosts, useAdminDeletePost } from '../hooks/useQueries';
import { EmotionType, type Post } from '../backend';
import EmotionBadge from './EmotionBadge';
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
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, FileText } from 'lucide-react';

export default function AdminPublicPostsList() {
  const { data: posts, isLoading } = useAdminGetAllPublicPosts();
  const deletePost = useAdminDeletePost();
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  const sortedPosts = [...(posts ?? [])].sort(
    (a, b) => Number(b.createdAt - a.createdAt)
  );

  const handleDelete = async (postId: string) => {
    try {
      await deletePost.mutateAsync({ postId });
      setDeleteErrors(prev => { const n = { ...prev }; delete n[postId]; return n; });
    } catch (err: unknown) {
      setDeleteErrors(prev => ({
        ...prev,
        [postId]: err instanceof Error ? err.message : 'Failed to delete post.',
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

  if (sortedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <FileText size={32} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{sortedPosts.length} post{sortedPosts.length !== 1 ? 's' : ''}</p>
      {sortedPosts.map((post: Post) => (
        <div key={post.id} className="veil-card space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <EmotionBadge emotion={post.emotionType as EmotionType} />
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                post.isPrivate
                  ? 'bg-muted/50 text-muted-foreground border-border'
                  : 'bg-primary/10 text-primary border-primary/30'
              }`}>
                {post.isPrivate ? 'Private' : 'Public'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {post.author.toString().slice(0, 12)}…
              </span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(Number(post.createdAt / BigInt(1_000_000))).toLocaleDateString()}
            </span>
          </div>

          <p className="text-sm text-foreground leading-relaxed line-clamp-3">{post.content}</p>

          <div className="flex items-center justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" disabled={deletePost.isPending} className="text-muted-foreground hover:text-foreground">
                  <Trash2 size={13} className="mr-1" />
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
                  <AlertDialogAction onClick={() => handleDelete(post.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {deleteErrors[post.id] && (
            <p className="text-xs text-amber-700 dark:text-amber-400">{deleteErrors[post.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
