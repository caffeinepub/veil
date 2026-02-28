import { useState } from 'react';
import { Post, SubscriptionStatus, Region } from '../backend';
import { useEditPost, useDeletePost, useSetPostPrivacy } from '../hooks/useQueries';
import { canMakePublic, getRegionalPricing } from '../utils/subscriptionHelpers';
import { countWords, MIN_WORDS_CONFESS_HAPPY } from '../utils/wordCounter';
import EmotionBadge from './EmotionBadge';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Lock, Globe, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { EmotionType } from '../backend';

interface PostCardProps {
  post: Post;
  subscriptionStatus: SubscriptionStatus | null;
  region: Region | null;
}

export default function PostCard({ post, subscriptionStatus, region }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const editPost = useEditPost();
  const deletePost = useDeletePost();
  const setPrivacy = useSetPostPrivacy();

  const needsMinWords = post.emotionType === EmotionType.confess || post.emotionType === EmotionType.happy;
  const editWordCount = countWords(editContent);
  const editMeetsRequirement = !needsMinWords || editWordCount >= MIN_WORDS_CONFESS_HAPPY;
  const canPublish = canMakePublic(subscriptionStatus);

  const handleSaveEdit = async () => {
    if (!editMeetsRequirement) return;
    try {
      await editPost.mutateAsync({ postId: post.id, newContent: editContent });
      setIsEditing(false);
      toast.success('Post updated.');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('editable')) {
        toast.error('This post can no longer be edited.');
      } else {
        toast.error('Could not save changes.');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success('Post removed quietly.');
    } catch {
      toast.error('Could not delete post.');
    }
  };

  const handleGoPublic = async () => {
    try {
      await setPrivacy.mutateAsync({ postId: post.id, isPrivate: false });
      toast.success('Your post is now visible to the community.');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('expired')) {
        toast.error('Your subscription has expired.');
      } else {
        toast.error('Could not make post public.');
      }
    }
  };

  const handleMakePrivate = async () => {
    try {
      await setPrivacy.mutateAsync({ postId: post.id, isPrivate: true });
      toast.success('Post is private again.');
    } catch {
      toast.error('Could not update privacy.');
    }
  };

  const formattedDate = new Date(Number(post.createdAt / BigInt(1_000_000))).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="veil-card p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <EmotionBadge emotion={post.emotionType} />
          <span className="text-xs text-muted-foreground font-sans">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {post.isPrivate ? (
            <span className="calm-badge bg-muted text-muted-foreground border border-border">
              <Lock size={11} />
              Private
            </span>
          ) : (
            <span className="calm-badge bg-secondary text-secondary-foreground border border-border">
              <Globe size={11} />
              Public
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[160px] rounded-xl font-sans text-sm leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between">
            {needsMinWords && (
              <span className={`text-xs font-sans ${editMeetsRequirement ? 'text-status-grace' : 'text-muted-foreground'}`}>
                {editWordCount} / {MIN_WORDS_CONFESS_HAPPY} words
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                className="font-sans text-xs rounded-lg"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editMeetsRequirement || editPost.isPending}
                className="font-sans text-xs rounded-lg"
              >
                {editPost.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="font-sans text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Reaction count (owner only) */}
      {Number(post.reactionCount) > 0 && (
        <p className="text-xs text-muted-foreground font-sans">
          {Number(post.reactionCount)} {Number(post.reactionCount) === 1 ? 'person' : 'people'} felt this
        </p>
      )}

      {/* Subscription block for go public */}
      {!canPublish && post.isPrivate && (
        <div className="p-3 rounded-xl bg-muted/60 border border-border">
          <p className="text-xs text-muted-foreground font-sans">
            Renew your subscription ({getRegionalPricing(region)}) to make posts public.
          </p>
        </div>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          {/* Edit */}
          {post.editable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs font-sans text-muted-foreground hover:text-foreground gap-1.5 rounded-lg h-8"
            >
              <Pencil size={12} />
              Edit
            </Button>
          )}

          {/* Privacy toggle */}
          {post.isPrivate ? (
            canPublish ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-sans text-muted-foreground hover:text-foreground gap-1.5 rounded-lg h-8"
                  >
                    <Eye size={12} />
                    Go Public
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif text-xl">Share with the room?</AlertDialogTitle>
                    <AlertDialogDescription className="font-sans text-sm leading-relaxed">
                      This post will be visible to all Veil members. You can make it private again at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-sans">Keep Private</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleGoPublic}
                      className="rounded-xl font-sans"
                    >
                      {setPrivacy.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Share'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMakePrivate}
              disabled={setPrivacy.isPending}
              className="text-xs font-sans text-muted-foreground hover:text-foreground gap-1.5 rounded-lg h-8"
            >
              {setPrivacy.isPending ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
              Make Private
            </Button>
          )}

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-sans text-muted-foreground hover:text-foreground gap-1.5 rounded-lg h-8 ml-auto"
              >
                <Trash2 size={12} />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-xl">Remove this post?</AlertDialogTitle>
                <AlertDialogDescription className="font-sans text-sm leading-relaxed">
                  This will be removed quietly. No one will be notified.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-sans">Keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-xl font-sans"
                >
                  {deletePost.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Remove'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </article>
  );
}
