import { useState } from 'react';
import { useAdminGetAllPosts, useAdminRemovePost, useSendAdminMessage, useSendCrisisResourceMessage } from '../hooks/useQueries';
import { ReviewFlag, MessageType } from '../backend';
import { toast } from 'sonner';
import EmotionBadge from './EmotionBadge';

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminCrisisRiskTab() {
  const { data: allPosts = [], isLoading } = useAdminGetAllPosts();
  const removePost = useAdminRemovePost();
  const sendMessage = useSendAdminMessage();
  const sendCrisisResource = useSendCrisisResourceMessage();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const crisisPosts = allPosts.filter(
    (p) => p.flaggedForReview === ReviewFlag.crisisRisk
  );

  const handleRemove = async (postId: string) => {
    setActioningId(postId + '-remove');
    try {
      await removePost.mutateAsync(postId);
      toast.success('Post removed.');
    } catch {
      toast.error('Could not remove post.');
    } finally {
      setActioningId(null);
    }
  };

  const handleSendMessage = async (authorStr: string, postId: string) => {
    setActioningId(postId + '-msg');
    try {
      await sendMessage.mutateAsync({
        recipient: authorStr,
        messageContent: 'A member of our team has noticed your recent post and wants to check in with you. You are not alone.',
      });
      toast.success('Message sent.');
    } catch {
      toast.error('Could not send message.');
    } finally {
      setActioningId(null);
    }
  };

  const handleSendCrisisResources = async (authorStr: string, postId: string) => {
    setActioningId(postId + '-crisis');
    try {
      await sendCrisisResource.mutateAsync({
        recipient: authorStr,
      });
      toast.success('Crisis resources sent.');
    } catch {
      toast.error('Could not send resources.');
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>;
  }

  if (crisisPosts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">No crisis-risk posts at this time.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-muted border border-border px-4 py-3 text-sm text-muted-foreground">
        These posts were flagged by the system for potential crisis indicators. Review carefully before taking action.
      </div>

      {crisisPosts.map((post) => {
        const authorStr = post.author.toString();
        return (
          <div
            key={post.id}
            className="bg-card rounded-xl border border-border shadow-soft p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <EmotionBadge emotionType={post.emotionType} />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  flagged
                </span>
              </div>
              <time className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</time>
            </div>

            <p className="text-sm text-foreground leading-relaxed">{post.content}</p>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
              <button
                onClick={() => handleRemove(post.id)}
                disabled={actioningId === post.id + '-remove'}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {actioningId === post.id + '-remove' ? 'Removing…' : 'Remove post'}
              </button>
              <button
                onClick={() => handleSendMessage(authorStr, post.id)}
                disabled={actioningId === post.id + '-msg'}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {actioningId === post.id + '-msg' ? 'Sending…' : 'Message user'}
              </button>
              <button
                onClick={() => handleSendCrisisResources(authorStr, post.id)}
                disabled={actioningId === post.id + '-crisis'}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {actioningId === post.id + '-crisis' ? 'Sending…' : 'Send crisis resources'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
