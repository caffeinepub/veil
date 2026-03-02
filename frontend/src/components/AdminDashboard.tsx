import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Loader2, VolumeX, Send } from 'lucide-react';
import { toast } from 'sonner';
import AdminPublicPostsList from './AdminPublicPostsList';
import AdminUserManagement from './AdminUserManagement';
import AdminInviteCodes from './AdminInviteCodes';
import AdminUserPostHistory from './AdminUserPostHistory';
import AdminFlaggedPosts from './AdminFlaggedPosts';
import AdminFlaggedComments from './AdminFlaggedComments';
import AdminAllUsersTab from './AdminAllUsersTab';
import AdminEmotionalAlertsTab from './AdminEmotionalAlertsTab';
import AdminCrisisRiskTab from './AdminCrisisRiskTab';
import {
  useGetCrisisRiskPosts,
  useAdminGetHighRiskEmotionAlerts,
  useCheckEcosystemSilence,
  usePublishPromptPost,
} from '../hooks/useQueries';
import { EmotionType } from '../backend';

export default function AdminDashboard() {
  const { data: crisisRiskPosts } = useGetCrisisRiskPosts();
  const { data: emotionAlerts } = useAdminGetHighRiskEmotionAlerts();
  const { data: isSilent, isLoading: silenceLoading } = useCheckEcosystemSilence();
  const publishPromptPost = usePublishPromptPost();

  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType.happy | EmotionType.confess>(
    EmotionType.happy
  );

  const crisisCount = crisisRiskPosts?.length ?? 0;
  const emotionAlertCount = emotionAlerts?.length ?? 0;

  const handlePublishPrompt = () => {
    publishPromptPost.mutate(selectedEmotion, {
      onSuccess: () => {
        toast.success('Prompt post published to the community feed.');
      },
      onError: (err: any) => {
        toast.error(err?.message ?? 'Failed to publish prompt post.');
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Ecosystem Silence Banner ── */}
      {!silenceLoading && isSilent && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <VolumeX className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                Ecosystem Silence Detected
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                No public posts have been created in the last 5 days. You may publish a gentle
                prompt to encourage the community.
              </p>
            </div>
          </div>

          <div className="pl-8 space-y-3">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              Select emotion mode for the prompt post:
            </p>
            <RadioGroup
              value={selectedEmotion}
              onValueChange={(val) =>
                setSelectedEmotion(val as EmotionType.happy | EmotionType.confess)
              }
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value={EmotionType.happy}
                  id="silence-happy"
                  className="border-amber-500 text-amber-600"
                />
                <Label
                  htmlFor="silence-happy"
                  className="text-sm text-amber-800 dark:text-amber-300 cursor-pointer"
                >
                  Happy
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value={EmotionType.confess}
                  id="silence-confess"
                  className="border-amber-500 text-amber-600"
                />
                <Label
                  htmlFor="silence-confess"
                  className="text-sm text-amber-800 dark:text-amber-300 cursor-pointer"
                >
                  Confess
                </Label>
              </div>
            </RadioGroup>

            <Button
              size="sm"
              onClick={handlePublishPrompt}
              disabled={publishPromptPost.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white border-0 gap-2"
            >
              {publishPromptPost.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Publish Prompt Post
            </Button>
          </div>
        </div>
      )}

      {/* ── Crisis Alert Banner ── */}
      {crisisCount > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
              Crisis Risk Alert
            </p>
            <p className="text-red-700 dark:text-red-400 text-xs mt-0.5">
              {crisisCount} post{crisisCount !== 1 ? 's' : ''} flagged for crisis risk. Review
              immediately in the Crisis Risk tab.
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="crisis" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
          <TabsTrigger value="crisis" className="flex items-center gap-1.5">
            Crisis Risk
            {crisisCount > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-xs">
                {crisisCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="emotional-alerts" className="flex items-center gap-1.5">
            Emotional Alerts
            {emotionAlertCount > 0 && (
              <Badge className="h-4 px-1 text-xs bg-amber-500 hover:bg-amber-500">
                {emotionAlertCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="posts">Public Posts</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Posts</TabsTrigger>
          <TabsTrigger value="flagged-comments">Flagged Comments</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="invite-codes">Invite Codes</TabsTrigger>
          <TabsTrigger value="post-history">Post History</TabsTrigger>
          <TabsTrigger value="signup">New Member</TabsTrigger>
        </TabsList>

        <TabsContent value="crisis">
          <AdminCrisisRiskTab />
        </TabsContent>

        <TabsContent value="emotional-alerts">
          <AdminEmotionalAlertsTab />
        </TabsContent>

        <TabsContent value="posts">
          <AdminPublicPostsList />
        </TabsContent>

        <TabsContent value="flagged">
          <AdminFlaggedPosts />
        </TabsContent>

        <TabsContent value="flagged-comments">
          <AdminFlaggedComments />
        </TabsContent>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="all-users">
          <AdminAllUsersTab />
        </TabsContent>

        <TabsContent value="invite-codes">
          <AdminInviteCodes />
        </TabsContent>

        <TabsContent value="post-history">
          <AdminUserPostHistory />
        </TabsContent>

        <TabsContent value="signup">
          <div className="p-4">
            <p className="text-muted-foreground text-sm">
              Use the Invite Codes tab to generate a code, then share the signup link with the new
              member.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
