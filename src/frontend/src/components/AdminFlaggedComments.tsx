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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminDeleteComment,
  useAdminGetFlaggedComments,
} from "../hooks/useQueries";

export default function AdminFlaggedComments() {
  const { data: flaggedComments, isLoading } = useAdminGetFlaggedComments();
  const removeComment = useAdminDeleteComment();

  const handleRemove = async (commentId: string) => {
    try {
      await removeComment.mutateAsync(commentId);
      toast.success("Comment removed.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove comment.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!flaggedComments || flaggedComments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No flagged comments.</p>
    );
  }

  return (
    <div className="space-y-3">
      {flaggedComments.map((comment) => (
        <Card
          key={comment.id}
          className="rounded-xl shadow-card border border-border"
        >
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
            <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
              Post: {comment.postId}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={removeComment.isPending}
                  className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5 shrink-0"
                >
                  {removeComment.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Comment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this comment? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRemove(comment.id)}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {comment.comment}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
