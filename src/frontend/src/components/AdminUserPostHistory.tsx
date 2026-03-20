import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Post } from "../backend";
import EmotionBadge from "./EmotionBadge";

export default function AdminUserPostHistory() {
  const [principalInput, setPrincipalInput] = useState("");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!principalInput.trim()) {
      toast.error("Please enter a principal ID.");
      return;
    }

    setIsLoading(true);
    try {
      // adminGetUserPosts is not yet available in the backend
      toast.error("User post history lookup is not yet available.");
      setPosts([]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch posts.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="principal-input">User Principal ID</Label>
          <Input
            id="principal-input"
            value={principalInput}
            onChange={(e) => setPrincipalInput(e.target.value)}
            placeholder="e.g. aaaaa-aa"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSearch}
          disabled={isLoading || !principalInput.trim()}
          className="text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {posts !== null && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No posts found for this user.
            </p>
          ) : (
            posts.map((post) => (
              <Card
                key={post.id}
                className="rounded-xl shadow-card border border-border"
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                  <EmotionBadge emotionType={post.emotionType} />
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {post.visibility === "publicView" ? "Public" : "Private"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(
                        Number(post.createdAt / BigInt(1_000_000)),
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {post.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
