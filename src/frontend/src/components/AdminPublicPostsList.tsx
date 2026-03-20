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
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminGetAllPosts, useAdminRemovePost } from "../hooks/useQueries";
import EmotionBadge from "./EmotionBadge";

export default function AdminPublicPostsList() {
  const { data: posts, isLoading } = useAdminGetAllPosts();
  const removePost = useAdminRemovePost();

  const publicPosts = posts?.filter((p) => p.visibility === "publicView") ?? [];

  const handleRemove = async (postId: string) => {
    try {
      await removePost.mutateAsync(postId);
      toast.success("Post removed.");
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

  if (publicPosts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No public posts.</p>
    );
  }

  return (
    <div className="space-y-3">
      {publicPosts.map((post) => (
        <Card
          key={post.id}
          className="rounded-xl shadow-card border border-border"
        >
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <EmotionBadge emotionType={post.emotionType} />
              {post.flaggedForReview === "crisisRisk" && (
                <Badge variant="destructive" className="text-xs">
                  Crisis Risk
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">
                {new Date(
                  Number(post.createdAt / BigInt(1_000_000)),
                ).toLocaleDateString()}
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={removePost.isPending}
                    className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                  >
                    {removePost.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Post</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove this post? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRemove(post.id)}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
              {post.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
