import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Globe, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Post } from "../backend";
import { Visibility } from "../backend";
import { useTogglePostVisibility } from "../hooks/useQueries";
import EmotionBadge from "./EmotionBadge";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const toggleVisibility = useTogglePostVisibility();

  const isPublic = post.visibility === Visibility.publicView;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleVisibility.mutateAsync(post.id);
      if (result.__kind__ === "ok") {
        toast.success(
          result.ok.visibility === Visibility.publicView
            ? "Post is now public."
            : "Post is now private.",
        );
      } else {
        toast.error(result.err);
      }
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to toggle visibility.",
      );
    } finally {
      setIsToggling(false);
    }
  };

  const formattedDate = new Date(
    Number(post.createdAt / BigInt(1_000_000)),
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="rounded-xl shadow-card border border-border">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <EmotionBadge emotionType={post.emotionType} />
          <Badge
            variant="outline"
            className={`flex items-center gap-1 text-xs ${
              isPublic
                ? "border-green-300 text-green-700 dark:text-green-400"
                : "border-muted text-muted-foreground"
            }`}
          >
            {isPublic ? (
              <>
                <Globe className="h-3 w-3" /> Public
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" /> Private
              </>
            )}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formattedDate}
        </span>
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          disabled={isToggling || toggleVisibility.isPending}
          className="text-xs"
        >
          {isToggling || toggleVisibility.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : isPublic ? (
            <Lock className="h-3 w-3 mr-1" />
          ) : (
            <Globe className="h-3 w-3 mr-1" />
          )}
          {isPublic ? "Make Private" : "Make Public"}
        </Button>
      </CardFooter>
    </Card>
  );
}
