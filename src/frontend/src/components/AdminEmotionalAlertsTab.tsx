import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Principal } from "@dfinity/principal";
import { Loader2 } from "lucide-react";
import { useAdminGetHighRiskEmotionAlerts } from "../hooks/useQueries";

export default function AdminEmotionalAlertsTab() {
  const { data: highRiskUsers, isLoading } = useAdminGetHighRiskEmotionAlerts();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!highRiskUsers || highRiskUsers.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground py-4">
          No high-risk emotional alerts at this time.
        </p>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Users who post multiple distress-related entries in a short period
          will appear here for admin review.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        Users who post multiple distress-related entries in a short period will
        appear here for admin review.
      </div>
      {highRiskUsers.map((entry: { userId: Principal; alertCount: number }) => {
        const uid = entry.userId.toString();
        const count = entry.alertCount;
        return (
          <Card
            key={uid}
            className="rounded-xl shadow-card border border-border"
          >
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
              <p className="text-xs font-mono text-muted-foreground truncate max-w-[240px]">
                {uid}
              </p>
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground shrink-0"
              >
                {count} alert{count !== 1 ? "s" : ""}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                This user has triggered {count} emotional alert
                {count !== 1 ? "s" : ""}. Consider reaching out via direct
                message.
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
