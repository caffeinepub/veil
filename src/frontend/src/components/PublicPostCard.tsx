import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flag,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import type { Post } from "../backend";
import {
  type FlagReason,
  useAddComment,
  useFlagPost,
  useGetCallerUserProfile,
  useGetComments,
} from "../hooks/useQueries";
import EmotionBadge from "./EmotionBadge";

interface PublicPostCardProps {
  post: Post;
  currentUserId?: string;
}

// UI labels mapped to backend FlagReason variants
const FLAG_REASONS: { label: string; reason: FlagReason }[] = [
  { label: "Harmful", reason: { __kind__: "Offensive", Offensive: null } },
  { label: "Abusive", reason: { __kind__: "Harassment", Harassment: null } },
  { label: "Unsafe", reason: { __kind__: "Spam", Spam: null } },
  { label: "Other", reason: { __kind__: "Other", Other: "Other" } },
];

export default function PublicPostCard({
  post,
  currentUserId,
}: PublicPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [selectedFlagReason, setSelectedFlagReason] =
    useState<FlagReason | null>(null);
  const [flagSubmitted, setFlagSubmitted] = useState(false);

  const { data: comments, isLoading: commentsLoading } = useGetComments(
    post.id,
  );
  const { data: userProfile } = useGetCallerUserProfile();
  const addComment = useAddComment();
  const flagPost = useFlagPost();

  const isOwnPost = currentUserId === post.author.toString();

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const pseudonym = userProfile?.pseudonym ?? "Anonymous";
    try {
      await addComment.mutateAsync({
        postId: post.id,
        pseudonym,
        commentText: commentText.trim(),
      });
      setCommentText("");
    } catch {
      // Silently ignore — error is surfaced via isPending/isError state if needed
    }
  };

  const handleFlagSubmit = async () => {
    if (!selectedFlagReason) return;
    try {
      await flagPost.mutateAsync({
        postId: post.id,
        reason: selectedFlagReason,
      });
      setFlagSubmitted(true);
    } catch {
      // Silently ignore on error — do not expose to user
    }
  };

  const handleFlagDialogClose = () => {
    setShowFlagDialog(false);
    setSelectedFlagReason(null);
    setFlagSubmitted(false);
  };

  const formattedDate = new Date(
    Number(post.createdAt / BigInt(1_000_000)),
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <Card className="rounded-xl shadow-card border border-border">
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <EmotionBadge emotionType={post.emotionType} />
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Anonymous
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

        <CardFooter className="flex flex-col gap-3 pt-2">
          {/* Comments toggle — no count displayed */}
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments((v) => !v)}
              className="text-xs text-muted-foreground"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Comments
              {showComments ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Button>

            {!isOwnPost && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFlagDialog(true)}
                className="text-xs text-muted-foreground ml-auto"
              >
                <Flag className="h-3 w-3 mr-1" />
                Report
              </Button>
            )}
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="w-full space-y-2">
              {commentsLoading ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map((c) => {
                  const commentDate = new Date(
                    Number(c.timestamp / BigInt(1_000_000)),
                  ).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <div
                      key={c.id}
                      className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground/80">
                          {c.pseudonym}
                        </span>
                        <span className="text-muted-foreground">
                          {commentDate}
                        </span>
                      </div>
                      <p className="leading-relaxed">{c.comment}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">
                  No comments yet.
                </p>
              )}

              {/* Add comment — only for non-owners */}
              {!isOwnPost && (
                <div className="flex gap-2 pt-1">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a supportive comment..."
                    className="text-xs min-h-[60px]"
                    disabled={addComment.isPending}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleComment}
                    disabled={addComment.isPending || !commentText.trim()}
                    className="shrink-0"
                  >
                    {addComment.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Flag / Report dialog */}
      <Dialog
        open={showFlagDialog}
        onOpenChange={(open) => {
          if (!open) handleFlagDialogClose();
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Report this post</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a reason. Your report is anonymous and will be reviewed by
              our team.
            </DialogDescription>
          </DialogHeader>

          {flagSubmitted ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-center text-muted-foreground">
                Your report has been received.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 py-2">
                {FLAG_REASONS.map(({ label, reason }) => {
                  const isSelected =
                    selectedFlagReason?.__kind__ === reason.__kind__;
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => setSelectedFlagReason(reason)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors text-left ${
                        isSelected
                          ? "border-foreground/40 bg-muted font-medium"
                          : "border-border bg-background hover:bg-muted/50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFlagDialogClose}
                  disabled={flagPost.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFlagSubmit}
                  disabled={!selectedFlagReason || flagPost.isPending}
                >
                  {flagPost.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {flagSubmitted && (
            <DialogFooter>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFlagDialogClose}
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
