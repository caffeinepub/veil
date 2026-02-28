import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useAdminUserPosts, useAdminDeletePost } from '../hooks/useQueries';
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
import { Loader2, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUserPostHistory() {
  const [principalInput, setPrincipalInput] = useState('');
  const [lookupPrincipal, setLookupPrincipal] = useState<Principal | null>(null);
  const [lookupError, setLookupError] = useState('');

  const { data: posts, isLoading } = useAdminUserPosts(lookupPrincipal);
  const deletePost = useAdminDeletePost();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    try {
      const p = Principal.fromText(principalInput.trim());
      setLookupPrincipal(p);
    } catch {
      setLookupError('Invalid principal format.');
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success('Post removed.');
    } catch {
      toast.error('Could not remove post.');
    }
  };

  const sortedPosts = posts
    ? [...posts].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];

  return (
    <div className="space-y-6">
      <div className="veil-card p-6 space-y-4">
        <h3 className="font-sans text-sm font-medium text-foreground flex items-center gap-2">
          <Search size={15} className="text-muted-foreground" />
          View posts by member
        </h3>
        <form onSubmit={handleLookup} className="flex gap-3">
          <input
            type="text"
            value={principalInput}
            onChange={(e) => setPrincipalInput(e.target.value)}
            placeholder="Principal ID"
            className="veil-input flex-1 text-sm"
          />
          <Button
            type="submit"
            variant="outline"
            className="rounded-xl font-sans text-sm gap-1.5"
          >
            <Search size={13} />
            Search
          </Button>
        </form>
        {lookupError && (
          <p className="text-xs text-muted-foreground font-sans">{lookupError}</p>
        )}
      </div>

      {lookupPrincipal && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-mono break-all">
            {lookupPrincipal.toString()}
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : sortedPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans py-4 text-center">No posts found.</p>
          ) : (
            sortedPosts.map((post) => {
              const date = new Date(Number(post.createdAt / BigInt(1_000_000))).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });
              return (
                <article key={post.id} className="veil-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <EmotionBadge emotion={post.emotionType} />
                      <span className="text-xs text-muted-foreground font-sans">{date}</span>
                      <span className="calm-badge bg-muted text-muted-foreground border border-border text-xs">
                        {post.isPrivate ? 'Private' : 'Public'}
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
                  <p className="text-sm font-sans text-foreground leading-relaxed line-clamp-4">
                    {post.content}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans">
                    {Number(post.reactionCount)} responses · {post.editable ? 'Editable' : 'Locked'}
                  </p>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
