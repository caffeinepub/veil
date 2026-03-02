import React from 'react';
import { useAdminGetHighRiskEmotionAlerts, useAdminGetAllUsersExtended } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function AdminEmotionalAlertsTab() {
  const { data: alerts, isLoading: alertsLoading } = useAdminGetHighRiskEmotionAlerts();
  const { data: usersExtended, isLoading: usersLoading } = useAdminGetAllUsersExtended();

  const isLoading = alertsLoading || usersLoading;

  const getUserPseudonym = (principalStr: string): string => {
    if (!usersExtended) return principalStr.slice(0, 12) + '…';
    const entry = usersExtended.find(([p]) => p.toString() === principalStr);
    return entry ? entry[1].pseudonym : principalStr.slice(0, 12) + '…';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex gap-3 items-start">
        <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Users listed here have posted 3 or more "broke" entries within the last 3 days. Consider reaching out via the Crisis Risk tab if their posts contain distress signals.
        </p>
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No high-risk emotional alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(([principal, count]) => (
            <div
              key={principal.toString()}
              className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-medium text-foreground">{getUserPseudonym(principal.toString())}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{principal.toString()}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {Number(count)} broke post{Number(count) !== 1 ? 's' : ''}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
