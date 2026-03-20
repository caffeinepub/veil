import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionStatus } from "../backend";
import type { User } from "../backend";
import {
  useAdminGetAllUsersExtended,
  useAdminToggleUserSuspension,
} from "../hooks/useQueries";

export default function AdminUserManagement() {
  const { data: users, isLoading } = useAdminGetAllUsersExtended();
  const toggleSuspension = useAdminToggleUserSuspension();

  const handleToggleSuspension = async (user: User) => {
    try {
      await toggleSuspension.mutateAsync({
        userId: user.id,
        suspend: !user.suspended,
      });
      toast.success(user.suspended ? "User unsuspended." : "User suspended.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update suspension.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No users found.</p>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user: User) => (
        <Card
          key={user.id.toString()}
          className="rounded-xl shadow-card border border-border"
        >
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">{user.pseudonym}</p>
              <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                {user.id.toString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge
                variant="outline"
                className={`text-xs ${
                  user.suspended
                    ? "border-destructive/40 text-destructive"
                    : "border-muted text-muted-foreground"
                }`}
              >
                {user.suspended ? "Suspended" : "Active"}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  user.subscriptionStatus === SubscriptionStatus.active
                    ? "border-green-300 text-green-700 dark:text-green-400"
                    : user.subscriptionStatus === SubscriptionStatus.grace
                      ? "border-amber-300 text-amber-700 dark:text-amber-400"
                      : "border-muted text-muted-foreground"
                }`}
              >
                {user.subscriptionStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleSuspension(user)}
                disabled={toggleSuspension.isPending}
                className="text-xs"
                data-ocid="admin.user.toggle"
              >
                {toggleSuspension.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : user.suspended ? (
                  <UserCheck className="h-3 w-3 mr-1" />
                ) : (
                  <UserX className="h-3 w-3 mr-1" />
                )}
                {user.suspended ? "Unsuspend" : "Suspend"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
