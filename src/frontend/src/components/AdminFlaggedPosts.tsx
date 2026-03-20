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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type FlagV2, useGetFlags, useRemovePost } from "../hooks/useQueries";

// Map backend FlagReason __kind__ to human-readable label
function formatFlagReason(flag: FlagV2): string {
  switch (flag.reason.__kind__) {
    case "Offensive":
      return "Harmful";
    case "Harassment":
      return "Abusive";
    case "Spam":
      return "Unsafe";
    case "Other":
      return `Other${flag.reason.Other ? `: ${flag.reason.Other}` : ""}`;
    default:
      return "Unknown";
  }
}

function formatTimestamp(ts: bigint): string {
  return new Date(Number(ts / BigInt(1_000_000))).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function truncatePrincipal(p: { toString(): string }): string {
  const s = p.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

export default function AdminFlaggedPosts() {
  const { data: flags, isLoading } = useGetFlags();
  const removePost = useRemovePost();

  const handleRemove = async (postId: string) => {
    try {
      await removePost.mutateAsync(postId);
      toast.success("Post removed successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove post.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!flags || flags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No flagged posts.</p>
    );
  }

  // Group flags by postId
  const byPost = flags.reduce<Record<string, FlagV2[]>>((acc, flag) => {
    if (!acc[flag.postId]) acc[flag.postId] = [];
    acc[flag.postId].push(flag);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(byPost).map(([postId, postFlags]) => (
        <Card
          key={postId}
          className="rounded-xl shadow-card border border-border"
        >
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                  {postId}
                </CardTitle>
                <Badge variant="outline" className="text-xs shrink-0">
                  <Flag className="h-2.5 w-2.5 mr-1" />
                  {postFlags.length} report{postFlags.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={removePost.isPending}
                  className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5 shrink-0"
                >
                  {removePost.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove Post
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the post and all associated
                    comments and reports. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRemove(postId)}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2">
              {postFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="rounded-lg bg-muted/40 px-3 py-2 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {formatFlagReason(flag)}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatTimestamp(flag.timestamp)}
                    </span>
                  </div>
                  <p className="text-muted-foreground font-mono">
                    Reporter: {truncatePrincipal(flag.reporter)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
