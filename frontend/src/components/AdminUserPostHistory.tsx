import { useState } from 'react';
import { useAdminGetUserPosts, useAdminDeletePost } from '../hooks/useQueries';
import { EmotionType, type Post } from '../backend';
import EmotionBadge from './EmotionBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Search, Trash2, FileText } from 'lucide-react';

export default function AdminUserPostHistory() {
  const [searchInput, setSearchInput] = useState('');
  const [searchedPrincipal, setSearchedPrincipal] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  const { data: posts, isLoading } = useAdminGetUserPosts(searchedPrincipal);
  const deletePost = useAdminDeletePost();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchedPrincipal(searchInput.trim());
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      setDeleteErrors(prev => { const n = { ...prev }; delete n[postId]; return n; });
    } catch (err: unknown) {
      setDeleteErrors(prev => ({
        ...prev,
        [postId]: err instanceof Error ? err.message : 'Failed to delete post.',
      }));
    }
  };

  const sortedPosts = [...(posts ?? [])].sort(
    (a, b) => Number(b.createdAt - a.createdAt)
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Search by Principal ID</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter principal ID"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="flex-1 font-mono text-xs"
          />
          <Button type="submit" size="sm">
            <Search size={14} />
          </Button>
        </form>
      </div>

      {searchedPrincipal && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-mono">
            Posts by: {searchedPrincipal}
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <FileText size={28} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No posts found for this principal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{sortedPosts.length} post{sortedPosts.length !== 1 ? 's' : ''}</p>
              {sortedPosts.map((post: Post) => (
                <div key={post.id} className="veil-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <EmotionBadge emotion={post.emotionType as EmotionType} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        post.isPrivate
                          ? 'bg-muted/50 text-muted-foreground border-border'
                          : 'bg-primary/10 text-primary border-primary/30'
                      }`}>
                        {post.isPrivate ? 'Private' : 'Public'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(Number(post.createdAt / BigInt(1_000_000))).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed line-clamp-3">{post.content}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {Number(post.reactionCount)} reaction{Number(post.reactionCount) !== 1 ? 's' : ''}
                    </span>

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
          )}
        </div>
      )}
    </div>
  );
}
