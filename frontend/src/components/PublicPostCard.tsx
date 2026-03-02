import { useState } from 'react';
import { Post, EmotionType } from '../backend';
import EmotionBadge from './EmotionBadge';
import { useAddTextReaction, useTextReactionsForPost, useGetCommentsForPost, useAddComment, useFlagPost } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Flag } from 'lucide-react';

interface PublicPostCardProps {
  post: Post;
  currentUserId?: string;
}

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

const TEXT_REACTIONS: Record<EmotionType, string[]> = {
  [EmotionType.confess]: ['I hear you', 'You are not alone', 'Thank you for sharing'],
  [EmotionType.broke]: ['Sending strength', 'This too shall pass', 'You matter'],
  [EmotionType.happy]: ['This made me smile', 'Grateful for this', 'Beautiful'],
};

export default function PublicPostCard({ post, currentUserId }: PublicPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [hasReacted, setHasReacted] = useState(false);

  const addTextReaction = useAddTextReaction();
  const { data: textReactions = [] } = useTextReactionsForPost(post.id);
  // useGetCommentsForPost only accepts postId — fetch is always enabled when postId is present
  const { data: comments = [] } = useGetCommentsForPost(post.id);
  const addComment = useAddComment();
  const flagPost = useFlagPost();

  const reactions = TEXT_REACTIONS[post.emotionType] || [];
  const isOwnPost = currentUserId && post.author.toString() === currentUserId;

  const handleReact = async (reactionText: string) => {
    if (hasReacted || isOwnPost) return;
    try {
      await addTextReaction.mutateAsync({ postId: post.id, reactionText });
      setHasReacted(true);
    } catch {
      toast.error('Could not send reaction.');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
      setCommentText('');
    } catch {
      toast.error('Could not post comment.');
    }
  };

  const handleFlag = async () => {
    try {
      await flagPost.mutateAsync({ postId: post.id, reason: 'Reported by user' });
      toast.success('Post reported.');
    } catch {
      toast.error('Could not report post.');
    }
  };

  return (
    <article className="bg-card rounded-xl shadow-card border border-border p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <EmotionBadge emotionType={post.emotionType} />
        <div className="flex items-center gap-3">
          <time className="text-xs text-muted-foreground">
            {formatRelativeTime(post.createdAt)}
          </time>
          {!isOwnPost && (
            <button
              onClick={handleFlag}
              className="text-muted-foreground hover:text-foreground opacity-40 hover:opacity-70"
              title="Report post"
            >
              <Flag size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {!isOwnPost && !hasReacted && (
        <div className="flex flex-wrap gap-2">
          {reactions.map((r) => (
            <button
              key={r}
              onClick={() => handleReact(r)}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {hasReacted && (
        <p className="text-xs text-muted-foreground italic">Response sent.</p>
      )}

      {textReactions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {textReactions.map((tr) => (
            <span
              key={tr.id}
              className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
            >
              {tr.reactionText}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-3">
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          Comments
        </button>

        {showComments && (
          <div className="mt-3 flex flex-col gap-3">
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground">No comments yet.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="text-xs text-foreground leading-relaxed">
                <p>{c.content}</p>
              </div>
            ))}

            {!isOwnPost && (
              <form onSubmit={handleComment} className="flex gap-2 mt-1">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  maxLength={300}
                  className="flex-1 text-xs bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={addComment.isPending || !commentText.trim()}
                  className="text-xs px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 disabled:opacity-40"
                >
                  {addComment.isPending ? '…' : 'Send'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
