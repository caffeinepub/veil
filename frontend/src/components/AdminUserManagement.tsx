import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { useAdminGetAllUsers, useSuspendUser, useUnsuspendUser, useUpdateSubscriptionStatus } from '../hooks/useQueries';
import { SubscriptionStatus, Region } from '../backend';
import { getSubscriptionLabel, getRegionalPricing } from '../utils/subscriptionHelpers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUserManagement() {
  const { actor, isFetching } = useActor();
  const { data: allUsers, isLoading: usersLoading } = useAdminGetAllUsers();
  const suspendUser = useSuspendUser();
  const unsuspendUser = useUnsuspendUser();
  const updateSub = useUpdateSubscriptionStatus();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const handleSuspend = async (userId: Principal) => {
    try {
      await suspendUser.mutateAsync(userId);
      toast.success('User suspended.');
    } catch {
      toast.error('Could not suspend user.');
    }
  };

  const handleUnsuspend = async (userId: Principal) => {
    try {
      await unsuspendUser.mutateAsync(userId);
      toast.success('User unsuspended.');
    } catch {
      toast.error('Could not unsuspend user.');
    }
  };

  const handleUpdateSub = async (userId: Principal, status: SubscriptionStatus) => {
    try {
      await updateSub.mutateAsync({ userId, status });
      toast.success(`Subscription updated to ${getSubscriptionLabel(status)}.`);
    } catch {
      toast.error('Could not update subscription.');
    }
  };

  if (usersLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    );
  }

  if (!allUsers || allUsers.length === 0) {
    return (
      <div className="text-center py-16">
        <Users size={28} className="text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground font-sans text-sm">No members yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-sans">{allUsers.length} member{allUsers.length !== 1 ? 's' : ''}</p>
      </div>
      {allUsers.map((user) => {
        const userId = user.id.toString();
        const isExpanded = expandedUser === userId;
        return (
          <div key={userId} className="veil-card overflow-hidden">
            <button
              className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedUser(isExpanded ? null : userId)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="font-sans text-sm font-medium text-foreground truncate">{user.pseudonym}</p>
                  <p className="text-xs text-muted-foreground font-sans">
                    {user.region === Region.india ? 'India' : 'Global'} ·{' '}
                    <span className={user.suspended ? 'text-status-expired' : ''}>
                      {user.suspended ? 'Suspended' : getSubscriptionLabel(user.subscriptionStatus)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {user.suspended && (
                  <span className="calm-badge bg-muted text-status-expired border border-border text-xs">
                    Suspended
                  </span>
                )}
                {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                <p className="text-xs font-mono text-muted-foreground break-all">{userId}</p>
                <p className="text-xs text-muted-foreground font-sans">
                  Region: {user.region === Region.india ? 'India' : 'Global'} · {getRegionalPricing(user.region)}
                </p>
                <p className="text-xs text-muted-foreground font-sans">
                  Subscription: <span className="font-medium">{getSubscriptionLabel(user.subscriptionStatus)}</span>
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {user.suspended ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnsuspend(user.id)}
                      disabled={unsuspendUser.isPending}
                      className="rounded-lg font-sans text-xs"
                    >
                      {unsuspendUser.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Unsuspend'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspend(user.id)}
                      disabled={suspendUser.isPending}
                      className="rounded-lg font-sans text-xs"
                    >
                      {suspendUser.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Suspend'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateSub(user.id, SubscriptionStatus.active)}
                    disabled={updateSub.isPending}
                    className="rounded-lg font-sans text-xs"
                  >
                    Set Active
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateSub(user.id, SubscriptionStatus.expired)}
                    disabled={updateSub.isPending}
                    className="rounded-lg font-sans text-xs"
                  >
                    Set Expired
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateSub(user.id, SubscriptionStatus.grace)}
                    disabled={updateSub.isPending}
                    className="rounded-lg font-sans text-xs"
                  >
                    Set Grace
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
