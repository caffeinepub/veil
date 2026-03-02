import { useAdminGetHighRiskEmotionAlerts, useAdminGetAllUsers } from '../hooks/useQueries';

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminEmotionalAlertsTab() {
  const { data: alerts = [], isLoading } = useAdminGetHighRiskEmotionAlerts();
  const { data: allUsers = [] } = useAdminGetAllUsers();

  const getPseudonym = (principalStr: string): string => {
    const user = allUsers.find((u) => u.id.toString() === principalStr);
    return user?.pseudonym ?? principalStr.slice(0, 8) + '…';
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-muted border border-border px-4 py-3 text-sm text-muted-foreground">
        Users who have posted 5 or more Broke entries within 3 consecutive days appear here.
        Use the All Users tab to take action if needed.
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No alerts at this time.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map(([principal, count]) => {
            const principalStr = principal.toString();
            return (
              <div
                key={principalStr}
                className="bg-card rounded-xl border border-border shadow-soft p-4 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-foreground font-medium">
                    {getPseudonym(principalStr)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(count)} Broke {Number(count) === 1 ? 'post' : 'posts'} in 3 days
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  {Number(count)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
