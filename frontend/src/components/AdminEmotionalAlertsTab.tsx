import { Principal } from '@dfinity/principal';
import { useAdminGetEmotionalAlerts, useAdminGetAllUsers } from '../hooks/useQueries';
import { type User } from '../backend';
import { Loader2, AlertTriangle, HeartCrack, Info } from 'lucide-react';

function formatWindowDates(): string {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(threeDaysAgo)} – ${fmt(now)}`;
}

interface AlertCardProps {
  userId: Principal;
  brokeCount: number;
  users: User[];
}

function AlertCard({ userId, brokeCount, users }: AlertCardProps) {
  const userRecord = users.find(
    u => (u.id as unknown as Principal).toString() === userId.toString()
  );
  const pseudonym = userRecord?.pseudonym ?? userId.toString().slice(0, 16) + '…';

  return (
    <div className="rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{pseudonym}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300">
              <HeartCrack size={10} />
              {brokeCount} BROKE post{brokeCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Within the last 3 days: <span className="font-medium">{formatWindowDates()}</span>
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {userId.toString().slice(0, 28)}…
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminEmotionalAlertsTab() {
  const { data: alerts, isLoading: alertsLoading } = useAdminGetEmotionalAlerts();
  const { data: users, isLoading: usersLoading } = useAdminGetAllUsers();

  const isLoading = alertsLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50">
        <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Users who have posted <strong>5 or more BROKE posts within 3 consecutive days</strong> appear here.
          No automated action is taken — review each case and use the <strong>All Users</strong> tab to intervene manually.
        </p>
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <AlertTriangle size={32} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No active emotional monitoring alerts.</p>
          <p className="text-xs text-muted-foreground/70">All users are within normal posting patterns.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {alerts.length} user{alerts.length !== 1 ? 's' : ''} flagged for review
          </p>
          {alerts.map(([principal, count]: [Principal, bigint]) => (
            <AlertCard
              key={principal.toString()}
              userId={principal}
              brokeCount={Number(count)}
              users={users ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
