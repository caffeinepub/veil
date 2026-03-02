import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import {
  useAdminGetAllUsers,
  useAdminToggleUserSuspension,
  useAdminApplyCooldown,
  useAdminRemoveUser,
} from '../hooks/useQueries';
import { type User, Region, SubscriptionStatus } from '../backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Users, ShieldOff, Shield, Clock, Trash2 } from 'lucide-react';

function regionLabel(region: Region): string {
  return region === Region.India ? 'India' : 'Global';
}

function subscriptionLabel(status: SubscriptionStatus): string {
  switch (status) {
    case SubscriptionStatus.active: return 'Active';
    case SubscriptionStatus.grace: return 'Grace';
    case SubscriptionStatus.expired: return 'Expired';
    default: return String(status);
  }
}

function subscriptionVariant(status: SubscriptionStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case SubscriptionStatus.active: return 'default';
    case SubscriptionStatus.grace: return 'secondary';
    case SubscriptionStatus.expired: return 'destructive';
    default: return 'outline';
  }
}

interface UserRowProps {
  user: User;
}

function UserRow({ user }: UserRowProps) {
  const toggleSuspension = useAdminToggleUserSuspension();
  const applyCooldown = useAdminApplyCooldown();
  const removeUser = useAdminRemoveUser();

  const userId = user.id as unknown as Principal;
  const isPending = toggleSuspension.isPending || applyCooldown.isPending || removeUser.isPending;

  const handleToggleSuspension = async () => {
    try {
      const nowSuspended = await toggleSuspension.mutateAsync(userId);
      toast.success(nowSuspended ? `${user.pseudonym} suspended.` : `${user.pseudonym} unsuspended.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update suspension.');
    }
  };

  const handleApplyCooldown = async () => {
    try {
      await applyCooldown.mutateAsync(userId);
      toast.success(`24-hour public posting cooldown applied to ${user.pseudonym}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply cooldown.');
    }
  };

  const handleRemoveUser = async () => {
    try {
      await removeUser.mutateAsync(userId);
      toast.success(`${user.pseudonym} has been permanently removed.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove user.');
    }
  };

  return (
    <div className="veil-card space-y-3">
      {/* User info row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{user.pseudonym}</span>
            {user.suspended && (
              <Badge variant="destructive" className="text-xs h-5">Suspended</Badge>
            )}
            <Badge variant={subscriptionVariant(user.subscriptionStatus as SubscriptionStatus)} className="text-xs h-5">
              {subscriptionLabel(user.subscriptionStatus as SubscriptionStatus)}
            </Badge>
            <Badge variant="outline" className="text-xs h-5">
              {regionLabel(user.region as Region)}
            </Badge>
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            {(user.id as unknown as Principal).toString().slice(0, 28)}…
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
        {/* Suspend / Unsuspend */}
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleToggleSuspension}
          className="h-7 text-xs gap-1.5"
        >
          {toggleSuspension.isPending ? (
            <Loader2 size={11} className="animate-spin" />
          ) : user.suspended ? (
            <Shield size={11} />
          ) : (
            <ShieldOff size={11} />
          )}
          {user.suspended ? 'Unsuspend' : 'Suspend'}
        </Button>

        {/* 24-hr Cooldown */}
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleApplyCooldown}
          className="h-7 text-xs gap-1.5"
        >
          {applyCooldown.isPending ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Clock size={11} />
          )}
          24-hr Cooldown
        </Button>

        {/* Permanently Remove */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={11} />
              Remove User
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently remove {user.pseudonym}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user account, all their posts, comments, and reactions.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeUser.isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
                Remove Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function AdminAllUsersTab() {
  const { data: users, isLoading } = useAdminGetAllUsers();
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <Users size={32} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No users registered yet.</p>
      </div>
    );
  }

  const filtered = search.trim()
    ? users.filter(u =>
        u.pseudonym.toLowerCase().includes(search.toLowerCase()) ||
        (u.id as unknown as Principal).toString().includes(search)
      )
    : users;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {users.length} registered user{users.length !== 1 ? 's' : ''}
        </p>
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-xs px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No users match your search.</p>
      ) : (
        filtered.map((user: User) => (
          <UserRow key={(user.id as unknown as Principal).toString()} user={user} />
        ))
      )}
    </div>
  );
}
