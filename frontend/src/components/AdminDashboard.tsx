import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminPublicPostsList from './AdminPublicPostsList';
import AdminAllUsersTab from './AdminAllUsersTab';
import AdminInviteCodes from './AdminInviteCodes';
import AdminFlaggedPosts from './AdminFlaggedPosts';
import AdminFlaggedComments from './AdminFlaggedComments';
import AdminEmotionalAlertsTab from './AdminEmotionalAlertsTab';
import AdminCrisisRiskTab from './AdminCrisisRiskTab';
import { useCheckEcosystemSilence, usePublishPromptPost } from '../hooks/useQueries';
import { EmotionType } from '../backend';

export default function AdminDashboard() {
  const { isSilent } = useCheckEcosystemSilence();
  const publishPrompt = usePublishPromptPost();
  const [promptEmotion, setPromptEmotion] = useState<EmotionType>(EmotionType.happy);

  const handlePublishPrompt = async () => {
    const prompts: Record<EmotionType, string> = {
      [EmotionType.happy]: 'A gentle reminder from the VEIL community: you are not alone. Share something small that brought you peace today.',
      [EmotionType.confess]: 'The community is listening. What is something you have been carrying quietly that you would like to set down here?',
      [EmotionType.broke]: 'This space holds you. If you are struggling, you are welcome here.',
    };

    try {
      await publishPrompt.mutateAsync({
        emotionType: promptEmotion,
        content: prompts[promptEmotion],
      });
      toast.success('Prompt post published to the community feed.');
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to publish prompt.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Ecosystem Silence Banner */}
      {isSilent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-5 py-4 space-y-4">
          <div className="flex items-start gap-3">
            <Volume2 className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">Ecosystem Silence Detected</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                No public posts have been shared in the last 5 days. Consider publishing a prompt to re-engage the community.
              </p>
            </div>
          </div>
          <div className="space-y-3 pl-8">
            <RadioGroup
              value={promptEmotion}
              onValueChange={(v) => setPromptEmotion(v as EmotionType)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value={EmotionType.happy} id="prompt-happy" />
                <Label htmlFor="prompt-happy" className="text-sm cursor-pointer">Happy</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value={EmotionType.confess} id="prompt-confess" />
                <Label htmlFor="prompt-confess" className="text-sm cursor-pointer">Confess</Label>
              </div>
            </RadioGroup>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePublishPrompt}
              disabled={publishPrompt.isPending}
              className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
            >
              {publishPrompt.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Publishing…
                </>
              ) : (
                'Publish Prompt Post'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Crisis Banner placeholder — shown in CrisisRiskTab */}

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 rounded-xl">
          <TabsTrigger value="posts" className="rounded-lg text-xs">Public Posts</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg text-xs">Users</TabsTrigger>
          <TabsTrigger value="invites" className="rounded-lg text-xs">Invite Codes</TabsTrigger>
          <TabsTrigger value="flagged" className="rounded-lg text-xs">Flagged</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg text-xs">Emotional Alerts</TabsTrigger>
          <TabsTrigger value="crisis" className="rounded-lg text-xs">Crisis Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <AdminPublicPostsList />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <AdminAllUsersTab />
        </TabsContent>
        <TabsContent value="invites" className="mt-4">
          <AdminInviteCodes />
        </TabsContent>
        <TabsContent value="flagged" className="mt-4">
          <Tabs defaultValue="flagged-posts">
            <TabsList className="bg-muted/30 rounded-lg">
              <TabsTrigger value="flagged-posts" className="text-xs">Posts</TabsTrigger>
              <TabsTrigger value="flagged-comments" className="text-xs">Comments</TabsTrigger>
            </TabsList>
            <TabsContent value="flagged-posts" className="mt-3">
              <AdminFlaggedPosts />
            </TabsContent>
            <TabsContent value="flagged-comments" className="mt-3">
              <AdminFlaggedComments />
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <AdminEmotionalAlertsTab />
        </TabsContent>
        <TabsContent value="crisis" className="mt-4">
          <AdminCrisisRiskTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
