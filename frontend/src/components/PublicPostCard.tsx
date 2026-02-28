import { EmotionType, ReactionType, type Post } from '../backend';
import { useGetMyReaction, useAddReaction } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import EmotionBadge from './EmotionBadge';
import { Loader2 } from 'lucide-react';

interface PublicPostCardProps {
  post: Post;
}

const reactionConfig = [
  { type: ReactionType.support, emoji: '🤝', label: 'Support' },
  { type: ReactionType.care, emoji: '💙', label: 'Care' },
  { type: ReactionType.strength, emoji: '💪', label: 'Strength' },
];

export default function PublicPostCard({ post }: PublicPostCardProps) {
  const { identity } = useInternetIdentity();
  const { data: myReaction, isLoading: reactionLoading } = useGetMyReaction(post.id);
  const addReaction = useAddReaction();

  const currentUserId = identity?.getPrincipal().toString();
  const isOwner = currentUserId === post.userId.toString();
  const hasReacted = myReaction !== null && myReaction !== undefined;

  const createdAt = new Date(Number(post.createdAt / BigInt(1_000_000)));

  const handleReaction = async (reactionType: ReactionType) => {
    if (isOwner || hasReacted || addReaction.isPending) return;
    try {
      await addReaction.mutateAsync({ postId: post.id, reactionType });
    } catch {
      // Silently handle — user may have already reacted
    }
  };

  return (
    <div className="veil-card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <EmotionBadge emotion={post.emotionType as EmotionType} />
        <span className="text-xs text-muted-foreground shrink-0">
          {createdAt.toLocaleDateString()}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Reactions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">
          {Number(post.reactionCount)} reaction{Number(post.reactionCount) !== 1 ? 's' : ''}
        </span>
        {reactionConfig.map(r => {
          const isActive = myReaction === r.type;
          const isDisabled = isOwner || hasReacted || addReaction.isPending || reactionLoading;

          return (
            <button
              key={r.type}
              onClick={() => handleReaction(r.type)}
              disabled={isDisabled}
              title={isOwner ? "Can't react to your own post" : hasReacted ? 'Already reacted' : r.label}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-all
                ${isActive
                  ? 'bg-primary/15 border-primary/40 text-primary font-medium'
                  : isDisabled
                  ? 'bg-muted/30 border-border text-muted-foreground cursor-not-allowed opacity-60'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground cursor-pointer'
                }
              `}
            >
              {addReaction.isPending && !isActive ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <span>{r.emoji}</span>
              )}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
