import { useState } from 'react';
import { Post, Visibility } from '../backend';
import EmotionBadge from './EmotionBadge';
import { Lock, Globe } from 'lucide-react';
import { useTogglePostVisibility } from '../hooks/useQueries';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PostCard({ post }: PostCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const toggleVisibility = useTogglePostVisibility();

  const isPrivate = post.visibility === Visibility.privateView;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleVisibility.mutateAsync(post.id);
      toast.success(isPrivate ? 'Post is now visible to the community.' : 'Post is now private.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not update visibility.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <article className="bg-card rounded-xl shadow-card border border-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <EmotionBadge emotionType={post.emotionType} />
          {isPrivate ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock size={11} />
              Private
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Globe size={11} />
              Public
            </span>
          )}
        </div>
        <time className="text-xs text-muted-foreground shrink-0">
          {formatDate(post.createdAt)}
        </time>
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      <div className="pt-1 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isPrivate ? 'Visible only to you.' : 'Visible in the community feed.'}
        </p>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {isToggling ? 'Updating…' : isPrivate ? 'Make public' : 'Make private'}
        </button>
      </div>
    </article>
  );
}
