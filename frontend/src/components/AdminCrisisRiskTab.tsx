import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { AlertTriangle, Trash2, MessageSquare, HeartHandshake, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  useGetCrisisRiskPosts,
  useAdminRemovePost,
  useSendAdminMessage,
  useSendCrisisResourceMessage,
  useAdminGetAllUsers,
} from '../hooks/useQueries';
import type { Post } from '../backend';

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPseudonym(
  authorPrincipal: Principal,
  users: Array<{ id: Principal; pseudonym: string }> | undefined
): string {
  if (!users) return '…';
  const match = users.find(u => u.id.toString() === authorPrincipal.toString());
  return match?.pseudonym ?? authorPrincipal.toString().slice(0, 12) + '…';
}

// ─── Remove Post Button ───────────────────────────────────────────────────────

function RemovePostButton({ post }: { post: Post }) {
  const removePost = useAdminRemovePost();

  const handleRemove = async () => {
    try {
      await removePost.mutateAsync(post.id);
      toast.success('Post removed successfully.');
    } catch {
      toast.error('Failed to remove post. Please try again.');
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="h-8 text-xs gap-1.5"
          disabled={removePost.isPending}
        >
          <Trash2 size={13} />
          Remove Post
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this post?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the post from the community feed. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, Remove Post
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Message User Button ──────────────────────────────────────────────────────

function MessageUserButton({ post, pseudonym }: { post: Post; pseudonym: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const sendMessage = useSendAdminMessage();

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMessage.mutateAsync({
        recipient: post.author,
        messageContent: message.trim(),
      });
      toast.success(`Message sent to ${pseudonym}.`);
      setMessage('');
      setOpen(false);
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <MessageSquare size={13} />
          Message User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {pseudonym}</DialogTitle>
          <DialogDescription>
            Compose a private message to this user. This message will only be visible to them.
            No message is sent without your explicit action.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Textarea
            placeholder="Write your message here…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            className="resize-none text-sm"
          />
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="gap-1.5"
          >
            {sendMessage.isPending ? (
              <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <MessageSquare size={13} />
            )}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Send Crisis Resources Button ─────────────────────────────────────────────

function SendCrisisResourcesButton({ post, pseudonym }: { post: Post; pseudonym: string }) {
  const sendResources = useSendCrisisResourceMessage();

  const handleSend = async () => {
    try {
      await sendResources.mutateAsync({ recipient: post.author });
      toast.success(`Crisis resources sent to ${pseudonym}.`);
    } catch {
      toast.error('Failed to send crisis resources. Please try again.');
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
          disabled={sendResources.isPending}
        >
          <HeartHandshake size={13} />
          Send Crisis Resources
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send crisis resource template?</AlertDialogTitle>
          <AlertDialogDescription>
            This will send a private message to <strong>{pseudonym}</strong> containing crisis
            support resources and helpline information. The message will only be sent after your
            confirmation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSend}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            Yes, Send Resources
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Crisis Post Card ─────────────────────────────────────────────────────────

function CrisisPostCard({
  post,
  users,
}: {
  post: Post;
  users: Array<{ id: Principal; pseudonym: string }> | undefined;
}) {
  const pseudonym = getPseudonym(post.author, users);

  return (
    <Card className="border-2 border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-rose-600 text-white text-[11px] font-bold tracking-wide px-2 py-0.5 uppercase gap-1 hover:bg-rose-600">
              <ShieldAlert size={11} />
              Crisis Risk
            </Badge>
            <span className="text-xs font-medium text-foreground">{pseudonym}</span>
            <span className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Post content */}
        <div className="rounded-lg bg-background/70 border border-rose-200 dark:border-rose-900 p-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        </div>

        {/* Admin notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Human-led response only.</strong> No automated actions have been taken. Review
            this post and choose an appropriate response below.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <RemovePostButton post={post} />
          <MessageUserButton post={post} pseudonym={pseudonym} />
          <SendCrisisResourcesButton post={post} pseudonym={pseudonym} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Tab Component ───────────────────────────────────────────────────────

export default function AdminCrisisRiskTab() {
  const { data: crisisPosts, isLoading } = useGetCrisisRiskPosts();
  const { data: allUsers } = useAdminGetAllUsers();

  // Map users to a simpler shape for pseudonym lookup
  const usersForLookup = allUsers?.map(u => ({ id: u.id, pseudonym: u.pseudonym }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border-2 border-rose-200 dark:border-rose-900 p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-36" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!crisisPosts || crisisPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
          <ShieldAlert size={22} className="text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm font-medium text-foreground">No crisis-flagged posts</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          BROKE public posts containing crisis keywords will appear here for human review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
        <ShieldAlert size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
        <p className="text-xs text-rose-800 dark:text-rose-300">
          <strong>{crisisPosts.length} post{crisisPosts.length !== 1 ? 's' : ''}</strong> flagged
          for crisis risk. All responses are human-led — no automated actions are taken.
        </p>
      </div>

      {crisisPosts.map(post => (
        <CrisisPostCard key={post.id} post={post} users={usersForLookup} />
      ))}
    </div>
  );
}
