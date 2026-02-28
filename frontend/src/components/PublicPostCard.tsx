import { Post, ReactionType } from '../backend';
import { useAddReaction, useMyReaction } from '../hooks/useQueries';
import EmotionBadge from './EmotionBadge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PublicPostCardProps {
  post: Post;
  currentUserId: string | null;
}

const REACTIONS: { type: ReactionType; label: string; emoji: string }[] = [
  { type: ReactionType.support, label: 'Support', emoji: '🤝' },
  { type: ReactionType.care, label: 'Care', emoji: '🌿' },
  { type: ReactionType.strength, label: 'Strength', emoji: '✦' },
];

export default function PublicPostCard({ post, currentUserId }: PublicPostCardProps) {
  const addReaction = useAddReaction();
  const { data: myReaction } = useMyReaction(post.id);
  const isOwnPost = currentUserId && post.userId.toString() === currentUserId;

  const handleReact = async (reactionType: ReactionType) => {
    if (myReaction !== null && myReaction !== undefined) return;
    try {
      await addReaction.mutateAsync({ postId: post.id, reactionType });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('already reacted')) {
        toast.error('You\'ve already responded to this post.');
      } else if (msg.includes('private')) {
        toast.error('This post is no longer public.');
      } else if (msg.includes('own post')) {
        toast.error('You cannot react to your own post.');
      } else {
        toast.error('Could not add your response.');
      }
    }
  };

  const formattedDate = new Date(Number(post.createdAt / BigInt(1_000_000))).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  const authorDisplay = post.userId.toString().slice(0, 8) + '…';
  const hasReacted = myReaction !== null && myReaction !== undefined;

  return (
    <article className="veil-card p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <EmotionBadge emotion={post.emotionType} />
          <span className="text-xs text-muted-foreground font-sans">{formattedDate}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{authorDisplay}</span>
      </div>

      {/* Content */}
      <p className="font-sans text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Reactions */}
      {!isOwnPost && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-sans mr-1">Respond:</span>
          {REACTIONS.map((r) => {
            const isSelected = myReaction === r.type;
            return (
              <Button
                key={r.type}
                variant="ghost"
                size="sm"
                onClick={() => handleReact(r.type)}
                disabled={hasReacted || addReaction.isPending}
                className={`text-xs font-sans rounded-lg h-8 gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-secondary text-secondary-foreground border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {addReaction.isPending && !hasReacted ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <span>{r.emoji}</span>
                )}
                {r.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Reaction count */}
      {Number(post.reactionCount) > 0 && (
        <p className="text-xs text-muted-foreground font-sans">
          {Number(post.reactionCount)} {Number(post.reactionCount) === 1 ? 'response' : 'responses'}
        </p>
      )}
    </article>
  );
}
