import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@dfinity/principal";
import { AlertTriangle, Heart, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MessageType, ReviewFlag } from "../backend";
import {
  useAdminGetAllPosts,
  useSendCrisisResourceMessage,
  useSendMessage,
} from "../hooks/useQueries";
import EmotionBadge from "./EmotionBadge";

export default function AdminCrisisRiskTab() {
  const { data: allPosts, isLoading } = useAdminGetAllPosts();
  const sendMessage = useSendMessage();
  const sendCrisisResource = useSendCrisisResourceMessage();
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>(
    {},
  );

  const crisisPosts =
    allPosts?.filter(
      (p) =>
        p.visibility === "publicView" &&
        p.flaggedForReview === ReviewFlag.crisisRisk,
    ) ?? [];

  const handleSendMessage = async (recipient: Principal, postId: string) => {
    const content = messageInputs[postId]?.trim();
    if (!content) {
      toast.error("Please enter a message.");
      return;
    }
    try {
      await sendMessage.mutateAsync({
        recipient,
        messageType: MessageType.admin,
        content,
      });
      setMessageInputs((prev) => ({ ...prev, [postId]: "" }));
      toast.success("Message sent.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send message.");
    }
  };

  const handleSendCrisisResource = async (recipient: Principal) => {
    try {
      await sendCrisisResource.mutateAsync({
        recipient,
        messageType: MessageType.resource,
      });
      toast.success("Crisis resource sent.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to send crisis resource.",
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

  if (crisisPosts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No crisis risk posts at this time.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {crisisPosts.map((post) => (
        <Card
          key={post.id}
          className="rounded-xl shadow-card border border-border"
        >
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <EmotionBadge emotionType={post.emotionType} />
              <Badge
                variant="destructive"
                className="text-xs flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" /> Crisis Risk
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(
                Number(post.createdAt / BigInt(1_000_000)),
              ).toLocaleDateString()}
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
            <div className="flex flex-col gap-2">
              <Textarea
                value={messageInputs[post.id] ?? ""}
                onChange={(e) =>
                  setMessageInputs((prev) => ({
                    ...prev,
                    [post.id]: e.target.value,
                  }))
                }
                placeholder="Send a supportive message to this user..."
                className="text-xs min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendMessage(post.author, post.id)}
                  disabled={sendMessage.isPending}
                  className="text-xs"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Send className="h-3 w-3 mr-1" />
                  )}
                  Send Message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendCrisisResource(post.author)}
                  disabled={sendCrisisResource.isPending}
                  className="text-xs"
                >
                  {sendCrisisResource.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Heart className="h-3 w-3 mr-1" />
                  )}
                  Send Crisis Resource
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
