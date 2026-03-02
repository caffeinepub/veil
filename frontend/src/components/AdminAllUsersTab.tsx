import { useState } from 'react';
import { useAdminGetAllUsers, useAdminSuspendUser, useAdminUnsuspendUser, useAdminApplyCooldown, useAdminRemoveUser } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
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

export default function AdminAllUsersTab() {
  const { data: users = [], isLoading } = useAdminGetAllUsers();
  const suspendUser = useAdminSuspendUser();
  const unsuspendUser = useAdminUnsuspendUser();
  const applyCooldown = useAdminApplyCooldown();
  const removeUser = useAdminRemoveUser();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleSuspend = async (userId: string) => {
    setActioningId(userId + '-suspend');
    try {
      const principal = Principal.fromText(userId);
      await suspendUser.mutateAsync(principal);
      toast.success('User suspended.');
    } catch {
      toast.error('Could not suspend user.');
    } finally {
      setActioningId(null);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    setActioningId(userId + '-unsuspend');
    try {
      const principal = Principal.fromText(userId);
      await unsuspendUser.mutateAsync(principal);
      toast.success('User unsuspended.');
    } catch {
      toast.error('Could not unsuspend user.');
    } finally {
      setActioningId(null);
    }
  };

  const handleCooldown = async (userId: string) => {
    setActioningId(userId + '-cooldown');
    try {
      const principal = Principal.fromText(userId);
      await applyCooldown.mutateAsync(principal);
      toast.success('Cooldown applied.');
    } catch {
      toast.error('Could not apply cooldown.');
    } finally {
      setActioningId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setActioningId(userId + '-remove');
    try {
      const principal = Principal.fromText(userId);
      await removeUser.mutateAsync(principal);
      toast.success('User removed.');
    } catch {
      toast.error('Could not remove user.');
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>;
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No users yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => {
        const userId = user.id.toString();
        return (
          <div
            key={userId}
            className="bg-card rounded-xl border border-border shadow-soft p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm text-foreground font-medium">{user.pseudonym}</p>
                <p className="text-xs text-muted-foreground font-mono">{userId.slice(0, 16)}…</p>
              </div>
              <div className="flex items-center gap-2">
                {user.suspended && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    suspended
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground capitalize">
                  {user.subscriptionStatus}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
              {user.suspended ? (
                <button
                  onClick={() => handleUnsuspend(userId)}
                  disabled={actioningId === userId + '-unsuspend'}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  {actioningId === userId + '-unsuspend' ? 'Updating…' : 'Unsuspend'}
                </button>
              ) : (
                <button
                  onClick={() => handleSuspend(userId)}
                  disabled={actioningId === userId + '-suspend'}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  {actioningId === userId + '-suspend' ? 'Updating…' : 'Suspend'}
                </button>
              )}
              <button
                onClick={() => handleCooldown(userId)}
                disabled={actioningId === userId + '-cooldown'}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {actioningId === userId + '-cooldown' ? 'Applying…' : '24h cooldown'}
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={actioningId === userId + '-remove'}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    Remove
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif">Remove {user.pseudonym}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the user and all their content. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl bg-secondary text-secondary-foreground hover:opacity-80"
                      onClick={() => handleRemove(userId)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
