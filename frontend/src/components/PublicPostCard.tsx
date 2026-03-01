import { useState } from 'react';
import { EmotionType, type Post } from '../backend';
import {
  useTextReactionsForPost,
  useAddTextReaction,
  useGetCommentsForPost,
  useAddComment,
  useFlagPost,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import EmotionBadge from './EmotionBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Flag, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface PublicPostCardProps {
  post: Post;
}

const REACTION_OPTIONS: Record<EmotionType, string[]> = {
  [EmotionType.happy]: [
    "I'm smiling with you.",
    "This is beautiful.",
    "You deserve this.",
    "So happy for you.",
  ],
  [EmotionType.confess]: [
    "I see you.",
    "That took courage.",
    "You're not alone in this.",
    "Thank you for sharing this.",
  ],
  [EmotionType.broke]: [
    "I'm holding space for you.",
    "You don't have to carry this alone.",
    "This sounds heavy.",
    "Stay. We're here.",
  ],
};

export default function PublicPostCard({ post }: PublicPostCardProps) {
  const { identity } = useInternetIdentity();
  const { data: textReactions, isLoading: reactionsLoading } = useTextReactionsForPost(post.id);
  const addTextReaction = useAddTextReaction();

  const { data: comments, isLoading: commentsLoading } = useGetCommentsForPost(post.id);
  const addComment = useAddComment();
  const flagPost = useFlagPost();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagError, setFlagError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);

  const currentUserId = identity?.getPrincipal().toString();
  const isOwner = currentUserId === post.author.toString();

  // Determine if current user has already reacted and which text they chose
  const myReaction = textReactions?.find(
    r => r.userId.toString() === currentUserId
  ) ?? null;
  const hasReacted = myReaction !== null;

  const reactionOptions = REACTION_OPTIONS[post.emotionType as EmotionType] ?? REACTION_OPTIONS[EmotionType.confess];

  const createdAt = new Date(Number(post.createdAt / BigInt(1_000_000)));

  const handleReaction = async (reactionText: string) => {
    if (isOwner || hasReacted || addTextReaction.isPending) return;
    try {
      await addTextReaction.mutateAsync({ postId: post.id, reactionText });
    } catch {
      // Silently handle — user may have already reacted
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
      setCommentText('');
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : 'Failed to add comment.');
    }
  };

  const handleFlag = async () => {
    setFlagError(null);
    if (!flagReason.trim()) {
      setFlagError('Please provide a reason.');
      return;
    }
    try {
      await flagPost.mutateAsync({ postId: post.id, reason: flagReason.trim() });
      setFlagged(true);
      setShowFlagDialog(false);
      setFlagReason('');
    } catch (err: unknown) {
      setFlagError(err instanceof Error ? err.message : 'Failed to flag post.');
    }
  };

  const sortedComments = [...(comments ?? [])].sort(
    (a, b) => Number(a.createdAt - b.createdAt)
  );

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

      {/* Text reactions — emotion-type specific, no counts */}
      {!isOwner && (
        <div className="pt-1 space-y-1.5">
          {reactionsLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 size={12} className="animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground italic">Loading…</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {reactionOptions.map(text => {
                const isSelected = myReaction?.reactionText === text;
                const isDisabled = hasReacted || addTextReaction.isPending;

                return (
                  <button
                    key={text}
                    onClick={() => handleReaction(text)}
                    disabled={isDisabled}
                    title={
                      hasReacted && !isSelected
                        ? "You've already responded to this post"
                        : text
                    }
                    className={[
                      'px-3 py-1.5 rounded-md border text-xs transition-all text-left',
                      isSelected
                        ? 'bg-primary/10 border-primary/30 text-primary font-medium cursor-default'
                        : hasReacted
                        ? 'bg-muted/20 border-border/40 text-muted-foreground/40 cursor-not-allowed'
                        : addTextReaction.isPending
                        ? 'bg-muted/20 border-border/40 text-muted-foreground cursor-wait'
                        : 'bg-background border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/30 cursor-pointer',
                    ].join(' ')}
                  >
                    {addTextReaction.isPending && !hasReacted ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={10} className="animate-spin shrink-0" />
                        {text}
                      </span>
                    ) : (
                      text
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Comment & Flag actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle size={13} />
          <span>
            {commentsLoading ? '…' : `${sortedComments.length} comment${sortedComments.length !== 1 ? 's' : ''}`}
          </span>
          {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        <div className="ml-auto">
          {flagged ? (
            <span className="text-xs text-muted-foreground italic">Flagged for review</span>
          ) : (
            <button
              onClick={() => setShowFlagDialog(true)}
              disabled={isOwner}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={isOwner ? 'You cannot flag your own post' : 'Flag this post'}
            >
              <Flag size={12} />
              <span>Flag</span>
            </button>
          )}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-3 pt-1">
          {commentsLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : sortedComments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              No comments yet. Be the first to respond.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedComments.map(comment => (
                <div key={comment.id} className="bg-muted/30 rounded-lg px-3 py-2 space-y-0.5">
                  <p className="text-xs text-foreground leading-relaxed">{comment.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(Number(comment.createdAt / BigInt(1_000_000))).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <form onSubmit={handleCommentSubmit} className="space-y-2">
            <Textarea
              placeholder="Write a response…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={2}
              className="resize-none text-sm bg-background"
              disabled={addComment.isPending}
            />
            {commentError && (
              <p className="text-xs text-amber-700 dark:text-amber-400">{commentError}</p>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={addComment.isPending || !commentText.trim()}
              >
                {addComment.isPending ? (
                  <Loader2 size={13} className="animate-spin mr-1" />
                ) : null}
                Respond
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Flag dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag this post</DialogTitle>
            <DialogDescription>
              Let us know why this post needs review. Your report is confidential.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Describe your concern…"
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              disabled={flagPost.isPending}
            />
            {flagError && (
              <p className="text-xs text-amber-700 dark:text-amber-400">{flagError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowFlagDialog(false); setFlagReason(''); setFlagError(null); }}
              disabled={flagPost.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFlag}
              disabled={flagPost.isPending || !flagReason.trim()}
            >
              {flagPost.isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
