import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useCreatePost, useGetCallerUserProfile, useAcknowledgeEntryMessage, useAcknowledgePublicPostMessage } from '../hooks/useQueries';
import { EmotionType, Visibility } from '../backend';
import { toast } from 'sonner';
import EntryProtectionModal from '../components/EntryProtectionModal';
import PublicPostWarningModal from '../components/PublicPostWarningModal';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { canCreatePost } from '../utils/subscriptionHelpers';
import { hasMinimumWords, needsMinimumWords } from '../utils/wordCounter';

const EMOTION_OPTIONS = [
  {
    type: EmotionType.confess,
    label: 'Confess',
    description: 'Something you need to say out loud.',
  },
  {
    type: EmotionType.broke,
    label: 'Broke',
    description: 'Something that is weighing on you.',
  },
  {
    type: EmotionType.happy,
    label: 'Happy',
    description: 'Something that brought you lightness.',
  },
];

export default function DashboardPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const createPost = useCreatePost();
  const acknowledgeEntry = useAcknowledgeEntryMessage();
  const acknowledgePublicPost = useAcknowledgePublicPostMessage();

  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>(EmotionType.confess);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  const canPost = canCreatePost(profile.subscriptionStatus);
  const needsEntryAck = !profile.hasAcknowledgedEntryMessage;

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const needsMinWords = needsMinimumWords(selectedEmotion);
  const meetsMinWords = !needsMinWords || hasMinimumWords(content);
  const maxChars = 1000;

  const handleAcknowledgeEntry = async () => {
    await acknowledgeEntry.mutateAsync();
  };

  const handleAcknowledgePublicPost = async () => {
    await acknowledgePublicPost.mutateAsync();
    if (pendingSubmit) {
      setPendingSubmit(false);
      await submitPost();
    }
  };

  const submitPost = async () => {
    try {
      await createPost.mutateAsync({
        emotionType: selectedEmotion,
        content: content.trim(),
        visibility: isPublic ? Visibility.publicView : Visibility.privateView,
      });
      toast.success('Your entry has been saved.');
      setContent('');
      setIsPublic(false);
    } catch (err: any) {
      toast.error(err?.message || 'Could not save entry.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !meetsMinWords) return;

    if (isPublic && !profile.hasAcknowledgedPublicPostMessage) {
      setPendingSubmit(true);
      setShowPublicWarning(true);
      return;
    }

    await submitPost();
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-8">
      {needsEntryAck && (
        <EntryProtectionModal open={needsEntryAck} onAcknowledge={handleAcknowledgeEntry} />
      )}
      {showPublicWarning && (
        <PublicPostWarningModal
          open={showPublicWarning}
          onAcknowledge={() => {
            setShowPublicWarning(false);
            handleAcknowledgePublicPost();
          }}
        />
      )}

      {!canPost && profile.region && (
        <SubscriptionBanner region={profile.region} />
      )}

      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-xl font-medium text-foreground">Write</h1>
        <p className="text-sm text-muted-foreground">
          This is your private space. Take your time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Emotion selector */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">How are you feeling?</p>
          <div className="flex gap-2 flex-wrap">
            {EMOTION_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSelectedEmotion(opt.type)}
                className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                  selectedEmotion === opt.type
                    ? 'bg-secondary text-secondary-foreground border-border'
                    : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {EMOTION_OPTIONS.find((o) => o.type === selectedEmotion)?.description}
          </p>
        </div>

        {/* Content area */}
        <div className="flex flex-col gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write here…"
            maxLength={maxChars}
            rows={7}
            disabled={!canPost}
            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed disabled:opacity-40"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {needsMinWords && !meetsMinWords && content.length > 0
                ? `${wordCount} / 24 words minimum`
                : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {content.length} / {maxChars}
            </p>
          </div>
        </div>

        {/* Visibility toggle */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-foreground">Share with community</p>
            <p className="text-xs text-muted-foreground">
              {isPublic ? 'Visible to all members.' : 'Only visible to you.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            disabled={!canPost}
            className={`relative w-10 h-5 rounded-full border transition-colors disabled:opacity-40 ${
              isPublic ? 'bg-secondary border-border' : 'bg-muted border-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all ${
                isPublic ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={createPost.isPending || !content.trim() || !meetsMinWords || !canPost}
          className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-80 disabled:opacity-40"
        >
          {createPost.isPending ? 'Saving…' : 'Save entry'}
        </button>
      </form>
    </div>
  );
}
