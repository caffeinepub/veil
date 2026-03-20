import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Loader2, Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmotionType } from "../backend";
import {
  useGetAdminAllPostsForEcosystemCheck,
  usePublishPromptPost,
} from "../hooks/useQueries";
import AdminAllUsersTab from "./AdminAllUsersTab";
import AdminCrisisRiskTab from "./AdminCrisisRiskTab";
import AdminEmotionalAlertsTab from "./AdminEmotionalAlertsTab";
import AdminFlaggedComments from "./AdminFlaggedComments";
import AdminFlaggedPosts from "./AdminFlaggedPosts";
import AdminInviteCodes from "./AdminInviteCodes";
import AdminPublicPostsList from "./AdminPublicPostsList";
import AdminSignup from "./AdminSignup";
import AdminUserManagement from "./AdminUserManagement";
import AdminUserPostHistory from "./AdminUserPostHistory";

const FIVE_DAYS_NS = BigInt(5 * 24 * 60 * 60 * 1_000_000_000);

export default function AdminDashboard() {
  const [promptEmotion, setPromptEmotion] = useState<EmotionType>(
    EmotionType.happy,
  );
  const [promptContent, setPromptContent] = useState("");
  const { data: allPosts } = useGetAdminAllPostsForEcosystemCheck();
  const publishPromptPost = usePublishPromptPost();

  // Ecosystem silence: no public post in the last 5 days
  const now = BigInt(Date.now()) * BigInt(1_000_000);
  const recentPublicPost = allPosts?.find(
    (p) =>
      p.visibility === "publicView" &&
      BigInt(p.createdAt) >= now - FIVE_DAYS_NS,
  );
  const ecosystemSilent = allPosts !== undefined && !recentPublicPost;

  // Crisis risk posts: public broke posts flagged for crisis
  const crisisPosts =
    allPosts?.filter(
      (p) =>
        p.visibility === "publicView" && p.flaggedForReview === "crisisRisk",
    ) ?? [];

  const handlePublishPrompt = async () => {
    if (!promptContent.trim()) {
      toast.error("Please enter content for the prompt post.");
      return;
    }
    try {
      const result = await publishPromptPost.mutateAsync({
        emotionType: promptEmotion,
        content: promptContent.trim(),
      });
      if (result.__kind__ === "ok") {
        toast.success("Prompt post published successfully.");
        setPromptContent("");
      } else {
        toast.error(`Failed to publish: ${result.err}`);
      }
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to publish prompt post.",
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Ecosystem Silence Banner */}
      {ecosystemSilent && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <Megaphone className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="flex flex-col gap-3">
              <div>
                <strong>Ecosystem Silence Detected</strong> — No public post has
                been created in the last 5 days. Consider publishing a prompt
                post to re-engage the community.
              </div>
              <div className="flex flex-col gap-2">
                <RadioGroup
                  value={promptEmotion}
                  onValueChange={(v) => setPromptEmotion(v as EmotionType)}
                  className="flex gap-3"
                >
                  <div className="flex items-center gap-1">
                    <RadioGroupItem
                      value={EmotionType.happy}
                      id="prompt-happy"
                    />
                    <Label
                      htmlFor="prompt-happy"
                      className="text-amber-800 dark:text-amber-200 cursor-pointer"
                    >
                      Happy
                    </Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <RadioGroupItem
                      value={EmotionType.confess}
                      id="prompt-confess"
                    />
                    <Label
                      htmlFor="prompt-confess"
                      className="text-amber-800 dark:text-amber-200 cursor-pointer"
                    >
                      Confess
                    </Label>
                  </div>
                </RadioGroup>
                <Input
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Enter prompt post content..."
                  className="text-sm bg-white/60 dark:bg-black/20 border-amber-300"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePublishPrompt}
                  disabled={
                    publishPromptPost.isPending || !promptContent.trim()
                  }
                  className="border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-200 self-start"
                >
                  {publishPromptPost.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Publish Prompt Post
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Crisis Risk Banner */}
      {crisisPosts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {crisisPosts.length} post{crisisPosts.length > 1 ? "s" : ""} flagged
            for crisis risk. Please review the Crisis Risk tab.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="public-posts">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="public-posts">Public Posts</TabsTrigger>
          <TabsTrigger value="flagged-posts">Flagged Posts</TabsTrigger>
          <TabsTrigger value="flagged-comments">Flagged Comments</TabsTrigger>
          <TabsTrigger value="crisis-risk">Crisis Risk</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="emotional-alerts">Emotional Alerts</TabsTrigger>
          <TabsTrigger value="invite-codes">Invite Codes</TabsTrigger>
          <TabsTrigger value="post-history">Post History</TabsTrigger>
          <TabsTrigger value="signup">Add Member</TabsTrigger>
        </TabsList>

        <TabsContent value="public-posts">
          <AdminPublicPostsList />
        </TabsContent>
        <TabsContent value="flagged-posts">
          <AdminFlaggedPosts />
        </TabsContent>
        <TabsContent value="flagged-comments">
          <AdminFlaggedComments />
        </TabsContent>
        <TabsContent value="crisis-risk">
          <AdminCrisisRiskTab />
        </TabsContent>
        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>
        <TabsContent value="all-users">
          <AdminAllUsersTab />
        </TabsContent>
        <TabsContent value="emotional-alerts">
          <AdminEmotionalAlertsTab />
        </TabsContent>
        <TabsContent value="invite-codes">
          <AdminInviteCodes />
        </TabsContent>
        <TabsContent value="post-history">
          <AdminUserPostHistory />
        </TabsContent>
        <TabsContent value="signup">
          <AdminSignup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
