import { useState } from 'react';
import { useAdminGetAllUsersExtended, useAdminSetSubscriptionStatus } from '../hooks/useQueries';
import { SubscriptionStatus, Region } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminUserManagement() {
  const { data: usersExtended = [], isLoading } = useAdminGetAllUsersExtended();
  const setSubStatus = useAdminSetSubscriptionStatus();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleSetSubStatus = async (userId: string, status: SubscriptionStatus) => {
    setUpdatingId(userId);
    try {
      const principal = Principal.fromText(userId);
      await setSubStatus.mutateAsync({ userId: principal, status });
      toast.success('Subscription updated.');
    } catch {
      toast.error('Could not update subscription.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>;
  }

  if (usersExtended.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No users yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {usersExtended.map(([principal, profile]) => {
        const userId = principal.toString();
        return (
          <div
            key={userId}
            className="bg-card rounded-xl border border-border shadow-soft p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm text-foreground font-medium">{profile.pseudonym}</p>
                <p className="text-xs text-muted-foreground">
                  {profile.region === Region.India ? 'India' : 'Global'}
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground capitalize">
                {profile.subscriptionStatus}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-border">
              <p className="text-xs text-muted-foreground">Subscription</p>
              <Select
                value={profile.subscriptionStatus}
                onValueChange={(val) => handleSetSubStatus(userId, val as SubscriptionStatus)}
                disabled={updatingId === userId}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={SubscriptionStatus.grace}>Grace</SelectItem>
                  <SelectItem value={SubscriptionStatus.active}>Active</SelectItem>
                  <SelectItem value={SubscriptionStatus.expired}>Expired</SelectItem>
                </SelectContent>
              </Select>
              {updatingId === userId && (
                <span className="text-xs text-muted-foreground">Updating…</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
