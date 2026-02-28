import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyProfile, useGetMySubscriptionStatus, useCreatePost } from '../hooks/useQueries';
import { EmotionType, SubscriptionStatus } from '../backend';
import { countWords, MINIMUM_WORD_COUNT, needsMinimumWords } from '../utils/wordCounter';
import { canCreatePost } from '../utils/subscriptionHelpers';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const emotionOptions = [
  { key: EmotionType.confess, label: 'Confess', emoji: '🤫' },
  { key: EmotionType.broke, label: 'Broke', emoji: '💸' },
  { key: EmotionType.happy, label: 'Happy', emoji: '🌸' },
];

export default function PostCreationPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { emotion?: string };
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isFetched: profileFetched, isLoading: profileLoading } = useGetMyProfile();
  const { data: subscriptionStatus, isLoading: subLoading } = useGetMySubscriptionStatus();
  const createPost = useCreatePost();

  const initialEmotion = (() => {
    const e = search?.emotion;
    if (e === 'confess') return EmotionType.confess;
    if (e === 'broke') return EmotionType.broke;
    if (e === 'happy') return EmotionType.happy;
    return EmotionType.confess;
  })();

  const [emotionType, setEmotionType] = useState<EmotionType>(initialEmotion);
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isAuthenticated = !!identity;
  const wordCount = countWords(content);
  const requiresMinWords = needsMinimumWords(emotionType);
  const meetsWordCount = !requiresMinWords || wordCount >= MINIMUM_WORD_COUNT;
  const canPost = canCreatePost(subscriptionStatus ?? SubscriptionStatus.expired);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && profileFetched && !profileLoading && !profile) {
      navigate({ to: '/signup' });
    }
  }, [isAuthenticated, profile, profileFetched, profileLoading, navigate]);

  if (isInitializing || profileLoading || subLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canPost) {
      setFormError('Your subscription has expired. Please renew to create posts.');
      return;
    }

    if (!content.trim()) {
      setFormError('Please write something before posting.');
      return;
    }

    if (!meetsWordCount) {
      setFormError(`Please write at least ${MINIMUM_WORD_COUNT} words for this emotion type. You have ${wordCount} so far.`);
      return;
    }

    try {
      await createPost.mutateAsync({ emotionType, content: content.trim() });
      navigate({ to: '/posts' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create post. Please try again.';
      setFormError(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate({ to: '/dashboard' })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        Back to dashboard
      </button>

      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-foreground">New Post</h1>
        <p className="text-sm text-muted-foreground">Express yourself anonymously</p>
      </div>

      {/* Subscription gating */}
      {!canPost && (
        <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
          Your subscription has expired. Please renew your membership to create new posts.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Emotion selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Emotion</p>
          <div className="flex gap-2">
            {emotionOptions.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setEmotionType(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
                  emotionType === opt.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Your thoughts</p>
            <span className={`text-xs ${requiresMinWords && wordCount < MINIMUM_WORD_COUNT ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
              {wordCount} {requiresMinWords ? `/ ${MINIMUM_WORD_COUNT} words min` : 'words'}
            </span>
          </div>
          <Textarea
            placeholder={
              emotionType === EmotionType.confess
                ? 'What have you been holding inside?'
                : emotionType === EmotionType.broke
                ? 'Share your financial struggle…'
                : 'What made you smile today?'
            }
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={createPost.isPending || !canPost}
            rows={8}
            className="resize-none"
          />
        </div>

        {/* Error */}
        {formError && (
          <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
            {formError}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={createPost.isPending || !canPost || !meetsWordCount || !content.trim()}
        >
          {createPost.isPending ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Posting…
            </>
          ) : (
            'Post'
          )}
        </Button>

        {/* Privacy notice */}
        <p className="text-xs text-muted-foreground text-center">
          🔒 Your post is private by default — only you can see it until you choose to share it.
        </p>
      </form>
    </div>
  );
}
