import React, { useState } from 'react';
import { useAdminGetAllUsers, useAdminSuspendUser, useAdminUnsuspendUser, useAdminApplyCooldown, useAdminRemoveUser } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Loader2, UserX, UserCheck, Clock, Trash2 } from 'lucide-react';
import type { User } from '../backend';

export default function AdminAllUsersTab() {
  const { data: users, isLoading } = useAdminGetAllUsers();
  const suspendUser = useAdminSuspendUser();
  const unsuspendUser = useAdminUnsuspendUser();
  const applyCooldown = useAdminApplyCooldown();
  const removeUser = useAdminRemoveUser();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<unknown>, id: string) => {
    setPendingId(id);
    try {
      await action();
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No users found.</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user: User) => {
        const uid = user.id.toString();
        const isPending = pendingId === uid;
        return (
          <div key={uid} className="rounded-xl border border-border bg-card shadow-card px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{user.pseudonym}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{uid}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant={user.suspended ? 'destructive' : 'secondary'} className="text-xs">
                  {user.suspended ? 'Suspended' : 'Active'}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {user.subscriptionStatus}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {user.suspended ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  disabled={isPending}
                  onClick={() => handleAction(() => unsuspendUser.mutateAsync(user.id), uid)}
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
                  Unsuspend
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  disabled={isPending}
                  onClick={() => handleAction(() => suspendUser.mutateAsync(user.id), uid)}
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />}
                  Suspend
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                disabled={isPending}
                onClick={() => handleAction(() => applyCooldown.mutateAsync(user.id), uid)}
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                Cooldown
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive" disabled={isPending}>
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove User</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove <strong>{user.pseudonym}</strong> and all their content. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAction(() => removeUser.mutateAsync(user.id), uid)}>
                      Remove Permanently
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
