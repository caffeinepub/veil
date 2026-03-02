import { useState } from 'react';
import { useAdminGetUserPosts, useAdminRemovePost } from '../hooks/useQueries';
import { EmotionType, Visibility, type Post } from '../backend';
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
import { Loader2, Search, FileText, Trash2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

export default function AdminUserPostHistory() {
  const [principalInput, setPrincipalInput] = useState('');
  const [searchedPrincipal, setSearchedPrincipal] = useState<Principal | null>(null);
  const getUserPosts = useAdminGetUserPosts();
  const removePost = useAdminRemovePost();
  const [posts, setPosts] = useState<Post[]>([]);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  const handleSearch = async () => {
    if (!principalInput.trim()) return;
    try {
      const principal = Principal.fromText(principalInput.trim());
      setSearchedPrincipal(principal);
      const result = await getUserPosts.mutateAsync(principal);
      const sorted = [...result].sort((a, b) => Number(b.createdAt - a.createdAt));
      setPosts(sorted);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid principal or fetch failed.');
      setPosts([]);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await removePost.mutateAsync(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setDeleteErrors((prev) => {
        const n = { ...prev };
        delete n[postId];
        return n;
      });
      toast.success('Post removed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove post.';
      setDeleteErrors((prev) => ({ ...prev, [postId]: msg }));
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={principalInput}
          onChange={(e) => setPrincipalInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter user principal…"
          className="flex-1 text-sm bg-muted border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSearch}
          disabled={getUserPosts.isPending || !principalInput.trim()}
          className="gap-1.5 rounded-xl"
        >
          {getUserPosts.isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          Search
        </Button>
      </div>

      {/* Results */}
      {searchedPrincipal && !getUserPosts.isPending && (
        <>
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <FileText size={28} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No posts found for this user.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {posts.length} post{posts.length !== 1 ? 's' : ''} found
              </p>
              {posts.map((post: Post) => {
                const isPrivate = post.visibility === Visibility.privateView;
                return (
                  <div key={post.id} className="bg-card rounded-xl border border-border shadow-soft p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <EmotionBadge emotionType={post.emotionType as EmotionType} />
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            isPrivate
                              ? 'bg-muted/50 text-muted-foreground border-border'
                              : 'bg-secondary text-secondary-foreground border-border'
                          }`}
                        >
                          {isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(Number(post.createdAt / BigInt(1_000_000))).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                      {post.content}
                    </p>

                    <div className="flex items-center justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={removePost.isPending}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Trash2 size={13} className="mr-1" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-serif">Remove this post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-xl bg-secondary text-secondary-foreground hover:opacity-80"
                              onClick={() => handleDelete(post.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {deleteErrors[post.id] && (
                      <p className="text-xs text-muted-foreground">{deleteErrors[post.id]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
