import { useState } from 'react';
import { useAdminGetAllUsers, useAdminSuspendUser, useAdminUnsuspendUser, useSetSubscriptionStatus } from '../hooks/useQueries';
import { SubscriptionStatus, type User } from '../backend';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Users } from 'lucide-react';

export default function AdminUserManagement() {
  const { data: users, isLoading } = useAdminGetAllUsers();
  const suspendUser = useAdminSuspendUser();
  const unsuspendUser = useAdminUnsuspendUser();
  const setSubStatus = useSetSubscriptionStatus();
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const handleSuspend = async (userId: string) => {
    try {
      await suspendUser.mutateAsync(userId);
      setActionErrors(prev => { const n = { ...prev }; delete n[userId]; return n; });
    } catch (err: unknown) {
      setActionErrors(prev => ({ ...prev, [userId]: err instanceof Error ? err.message : 'Action failed.' }));
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      await unsuspendUser.mutateAsync(userId);
      setActionErrors(prev => { const n = { ...prev }; delete n[userId]; return n; });
    } catch (err: unknown) {
      setActionErrors(prev => ({ ...prev, [userId]: err instanceof Error ? err.message : 'Action failed.' }));
    }
  };

  const handleSetSubStatus = async (userId: string, status: SubscriptionStatus) => {
    try {
      await setSubStatus.mutateAsync({ userId, status });
      setActionErrors(prev => { const n = { ...prev }; delete n[userId + '_sub']; return n; });
    } catch (err: unknown) {
      setActionErrors(prev => ({ ...prev, [userId + '_sub']: err instanceof Error ? err.message : 'Action failed.' }));
    }
  };

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
        <p className="text-sm text-muted-foreground">No members yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{users.length} member{users.length !== 1 ? 's' : ''}</p>
      <Accordion type="multiple" className="space-y-2">
        {users.map((user: User) => {
          const userId = user.id.toString();
          return (
            <AccordionItem key={userId} value={userId} className="veil-card border-0 px-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.pseudonym}</p>
                    <p className="text-xs text-muted-foreground font-mono">{userId.slice(0, 20)}…</p>
                  </div>
                  <div className="flex gap-1.5 ml-auto mr-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      user.suspended
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                        : 'bg-muted/50 text-muted-foreground border-border'
                    }`}>
                      {user.suspended ? 'Suspended' : 'Active'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground border-border">
                      {user.subscriptionStatus}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Region: {user.region}</p>
                  <p>Joined: {new Date(Number(user.createdAt / BigInt(1_000_000))).toLocaleDateString()}</p>
                  <p>Invite code: {user.inviteCode}</p>
                </div>

                {/* Suspend/Unsuspend */}
                <div className="flex gap-2">
                  {user.suspended ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnsuspend(userId)}
                      disabled={unsuspendUser.isPending}
                    >
                      {unsuspendUser.isPending ? <Loader2 className="animate-spin mr-1" size={13} /> : null}
                      Unsuspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSuspend(userId)}
                      disabled={suspendUser.isPending}
                    >
                      {suspendUser.isPending ? <Loader2 className="animate-spin mr-1" size={13} /> : null}
                      Suspend
                    </Button>
                  )}
                </div>

                {actionErrors[userId] && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">{actionErrors[userId]}</p>
                )}

                {/* Subscription status */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Subscription Status</p>
                  <div className="flex gap-2 items-center">
                    <Select
                      defaultValue={user.subscriptionStatus}
                      onValueChange={val => handleSetSubStatus(userId, val as SubscriptionStatus)}
                      disabled={setSubStatus.isPending}
                    >
                      <SelectTrigger className="h-8 text-xs w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SubscriptionStatus.active}>Active</SelectItem>
                        <SelectItem value={SubscriptionStatus.grace}>Grace</SelectItem>
                        <SelectItem value={SubscriptionStatus.expired}>Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    {setSubStatus.isPending && <Loader2 className="animate-spin text-muted-foreground" size={14} />}
                  </div>
                  {actionErrors[userId + '_sub'] && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">{actionErrors[userId + '_sub']}</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
