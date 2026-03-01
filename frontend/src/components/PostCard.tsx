import { useState } from 'react';
import { EmotionType, type Post } from '../backend';
import { useEditPost, useDeletePost, useSetPostPrivacy, useGetMySubscriptionStatus } from '../hooks/useQueries';
import { countWords, MINIMUM_WORD_COUNT, needsMinimumWords } from '../utils/wordCounter';
import { canGoPublic } from '../utils/subscriptionHelpers';
import EmotionBadge from './EmotionBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, Pencil, Trash2, Globe, Lock } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editError, setEditError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const editPost = useEditPost();
  const deletePost = useDeletePost();
  const setPostPrivacy = useSetPostPrivacy();
  const { data: subscriptionStatus } = useGetMySubscriptionStatus();

  const wordCount = countWords(editContent);
  const requiresMinWords = needsMinimumWords(post.emotionType);
  const meetsWordCount = !requiresMinWords || wordCount >= MINIMUM_WORD_COUNT;

  const createdAt = new Date(Number(post.createdAt / BigInt(1_000_000)));

  const handleEdit = async () => {
    setEditError(null);
    if (!editContent.trim()) {
      setEditError('Content cannot be empty.');
      return;
    }
    if (!meetsWordCount) {
      setEditError(`At least ${MINIMUM_WORD_COUNT} words required. You have ${wordCount}.`);
      return;
    }
    try {
      await editPost.mutateAsync({ postId: post.id, newContent: editContent.trim() });
      setIsEditing(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to edit post.');
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      await deletePost.mutateAsync({ postId: post.id });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete post.');
    }
  };

  const handleMakePrivate = async () => {
    setActionError(null);
    try {
      await setPostPrivacy.mutateAsync({ postId: post.id, isPrivate: true });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update privacy.');
    }
  };

  const handleMakePublic = async () => {
    setActionError(null);
    try {
      await setPostPrivacy.mutateAsync({ postId: post.id, isPrivate: false });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update privacy.');
    }
  };

  const canPublish = canGoPublic(subscriptionStatus ?? 'expired' as never);

  return (
    <div className="veil-card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <EmotionBadge emotion={post.emotionType as EmotionType} />
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            post.isPrivate
              ? 'bg-muted/50 text-muted-foreground border-border'
              : 'bg-primary/10 text-primary border-primary/30'
          }`}>
            {post.isPrivate ? '🔒 Private' : '🌐 Public'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {createdAt.toLocaleDateString()}
        </span>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs ${requiresMinWords && wordCount < MINIMUM_WORD_COUNT ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {wordCount} {requiresMinWords ? `/ ${MINIMUM_WORD_COUNT} words min` : 'words'}
            </span>
          </div>
          <Textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={5}
            className="resize-none text-sm"
            disabled={editPost.isPending}
          />
          {editError && (
            <p className="text-xs text-amber-700 dark:text-amber-400">{editError}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleEdit}
              disabled={editPost.isPending || !meetsWordCount || !editContent.trim()}
            >
              {editPost.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Save'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setIsEditing(false); setEditContent(post.content); setEditError(null); }}
              disabled={editPost.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Reaction count */}
      {Number(post.reactionCount) > 0 && (
        <p className="text-xs text-muted-foreground">
          {Number(post.reactionCount)} reaction{Number(post.reactionCount) !== 1 ? 's' : ''}
        </p>
      )}

      {/* Action error */}
      {actionError && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{actionError}</p>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {/* Edit — only when editable */}
          {post.editable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setIsEditing(true); setEditContent(post.content); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil size={13} className="mr-1" />
              Edit
            </Button>
          )}

          {/* Privacy toggle */}
          {post.isPrivate ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canPublish || setPostPrivacy.isPending}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {setPostPrivacy.isPending ? <Loader2 className="animate-spin mr-1" size={13} /> : <Globe size={13} className="mr-1" />}
                  Go Public
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Make this post public?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This post will be visible to all Veil members.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMakePublic}>
                    Go Public
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMakePrivate}
              disabled={setPostPrivacy.isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              {setPostPrivacy.isPending ? <Loader2 className="animate-spin mr-1" size={13} /> : <Lock size={13} className="mr-1" />}
              Make Private
            </Button>
          )}

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={deletePost.isPending}
                className="text-muted-foreground hover:text-foreground ml-auto"
              >
                {deletePost.isPending ? <Loader2 className="animate-spin mr-1" size={13} /> : <Trash2 size={13} className="mr-1" />}
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
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
