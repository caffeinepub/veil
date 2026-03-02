import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetTextReactionsForPost,
  useAddTextReaction,
  useGetCommentsByPost,
  useAddComment,
  useFlagPost,
} from '../hooks/useQueries';
import type { Post } from '../backend';
import EmotionBadge from './EmotionBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Flag, MessageCircle, Heart, ChevronDown, ChevronUp } from 'lucide-react';

interface PublicPostCardProps {
  post: Post;
}

export default function PublicPostCard({ post }: PublicPostCardProps) {
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();
  const isAuthor = currentUserId === post.author.toString();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [reactionText, setReactionText] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [flagError, setFlagError] = useState('');

  const { data: textReactions } = useGetTextReactionsForPost(post.id);
  const { data: comments } = useGetCommentsByPost(post.id);
  const addTextReaction = useAddTextReaction();
  const addComment = useAddComment();
  const flagPost = useFlagPost();

  const handleReaction = async () => {
    if (!reactionText.trim()) return;
    try {
      await addTextReaction.mutateAsync({ postId: post.id, reactionText: reactionText.trim() });
      setReactionText('');
    } catch {
      // silently fail — user may have already reacted
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
      setCommentText('');
    } catch {
      // silently fail
    }
  };

  const handleFlag = async () => {
    setFlagError('');
    try {
      await flagPost.mutateAsync({ postId: post.id, reason: 'Reported by user' });
      setFlagged(true);
    } catch (err: unknown) {
      setFlagError((err as Error)?.message ?? 'Failed to flag post.');
    }
  };

  const postDate = new Date(Number(post.createdAt) / 1_000_000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <EmotionBadge emotionType={post.emotionType} />
        <span className="text-xs text-muted-foreground">{postDate}</span>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Stats Row */}
      <div className="px-5 pb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          {textReactions?.length ?? 0} reactions
        </span>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {comments?.length ?? 0} comments
          {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Interaction Area (non-authors only) */}
      {!isAuthor && (
        <div className="border-t border-border px-5 py-3 space-y-3">
          {/* Text Reaction */}
          <div className="flex gap-2">
            <Input
              value={reactionText}
              onChange={(e) => setReactionText(e.target.value)}
              placeholder="Send a kind word…"
              className="text-sm h-8"
              maxLength={100}
              onKeyDown={(e) => e.key === 'Enter' && handleReaction()}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReaction}
              disabled={addTextReaction.isPending || !reactionText.trim()}
              className="h-8 px-3 shrink-0"
            >
              {addTextReaction.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Comment */}
          <div className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="text-sm h-8"
              maxLength={500}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleComment}
              disabled={addComment.isPending || !commentText.trim()}
              className="h-8 px-3 shrink-0"
            >
              {addComment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Flag */}
          <div className="flex items-center gap-2">
            {!flagged ? (
              <button
                onClick={handleFlag}
                disabled={flagPost.isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                {flagPost.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Flag className="h-3 w-3" />
                )}
                Report
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">Reported</span>
            )}
            {flagError && <span className="text-xs text-destructive">{flagError}</span>}
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border px-5 py-3 space-y-2">
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <p>{comment.content}</p>
                <p className="text-xs mt-1 opacity-60">
                  {new Date(Number(comment.createdAt) / 1_000_000).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No comments yet.</p>
          )}
        </div>
      )}

      {/* Text Reactions Display */}
      {textReactions && textReactions.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {textReactions.map((r) => (
              <span
                key={r.id}
                className="text-xs bg-muted/40 rounded-full px-2.5 py-1 text-muted-foreground"
              >
                {r.reactionText}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
