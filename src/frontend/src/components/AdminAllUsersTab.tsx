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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Principal } from "@dfinity/principal";
import { Clock, Loader2, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend";
import {
  useAdminApplyPublicPostingCooldown,
  useAdminGetAllUsersExtended,
  useAdminPermanentlyRemoveUser,
  useAdminToggleUserSuspension,
} from "../hooks/useQueries";

export default function AdminAllUsersTab() {
  const { data: users, isLoading } = useAdminGetAllUsersExtended();
  const toggleSuspension = useAdminToggleUserSuspension();
  const applyCooldown = useAdminApplyPublicPostingCooldown();
  const removeUser = useAdminPermanentlyRemoveUser();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleToggleSuspension = async (user: User) => {
    setPendingId(user.id.toString());
    try {
      await toggleSuspension.mutateAsync({
        userId: user.id,
        suspend: !user.suspended,
      });
      toast.success(user.suspended ? "User unsuspended." : "User suspended.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to toggle suspension.",
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleCooldown = async (userId: Principal) => {
    setPendingId(userId.toString());
    try {
      await applyCooldown.mutateAsync(userId);
      toast.success("Cooldown applied.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to apply cooldown.");
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (userId: Principal) => {
    setPendingId(userId.toString());
    try {
      await removeUser.mutateAsync(userId);
      toast.success("User permanently removed.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove user.");
    } finally {
      setPendingId(null);
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
      {users.map((user: User) => {
        const uid = user.id.toString();
        const isPending = pendingId === uid;
        return (
          <Card
            key={uid}
            className="rounded-xl shadow-card border border-border"
          >
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">{user.pseudonym}</p>
                <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                  {uid}
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
                  className="text-xs text-muted-foreground"
                >
                  {user.subscriptionStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleSuspension(user)}
                  disabled={isPending}
                  className="text-xs"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : user.suspended ? (
                    <UserCheck className="h-3 w-3 mr-1" />
                  ) : (
                    <UserX className="h-3 w-3 mr-1" />
                  )}
                  {user.suspended ? "Unsuspend" : "Suspend"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCooldown(user.id)}
                  disabled={isPending}
                  className="text-xs"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  Cooldown
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Permanently remove <strong>{user.pseudonym}</strong> and
                        all their content? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemove(user.id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
