import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetMySubscriptionStatus, useCreatePost } from '../hooks/useQueries';
import { EmotionType } from '../backend';
import { canCreatePost } from '../utils/subscriptionHelpers';
import { countWords, hasMinimumWords } from '../utils/wordCounter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Lock } from 'lucide-react';

const EMOTION_LABELS: Record<EmotionType, string> = {
  [EmotionType.confess]: 'Confess',
  [EmotionType.broke]: 'Broke',
  [EmotionType.happy]: 'Happy',
};

const EMOTION_DESCRIPTIONS: Record<EmotionType, string> = {
  [EmotionType.confess]: 'Share something you\'ve been holding inside.',
  [EmotionType.broke]: 'Express what has broken or hurt you.',
  [EmotionType.happy]: 'Celebrate something that brought you joy.',
};

const EMOTION_CLASSES: Record<EmotionType, string> = {
  [EmotionType.confess]: 'emotion-confess',
  [EmotionType.broke]: 'emotion-broke',
  [EmotionType.happy]: 'emotion-happy',
};

export default function PostCreationPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/create' });
  const { identity } = useInternetIdentity();

  const ANONYMOUS_PRINCIPAL = '2vxsx-fae';
  const isAuthenticated = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: subscriptionStatus, isLoading: subLoading } = useGetMySubscriptionStatus();
  const createPost = useCreatePost();

  const emotionParam = (search as any)?.emotion as string | undefined;
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(
    emotionParam && Object.values(EmotionType).includes(emotionParam as EmotionType)
      ? (emotionParam as EmotionType)
      : null
  );
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!profileLoading && !userProfile && isAuthenticated) {
      navigate({ to: '/signup' });
    }
  }, [profileLoading, userProfile, isAuthenticated, navigate]);

  if (!isAuthenticated || profileLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canPost = subscriptionStatus ? canCreatePost(subscriptionStatus) : false;
  const wordCount = countWords(content);
  const needsMinWords = selectedEmotion !== null && selectedEmotion !== EmotionType.broke;
  const meetsWordCount = !needsMinWords || hasMinimumWords(content, 24);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEmotion) {
      setError('Please select an emotion type.');
      return;
    }
    if (!content.trim()) {
      setError('Please write something before posting.');
      return;
    }
    if (!meetsWordCount) {
      setError('Please write at least 24 words for this emotion type.');
      return;
    }
    if (!canPost) {
      setError('Your subscription has expired. Please renew to create posts.');
      return;
    }

    try {
      await createPost.mutateAsync({ emotionType: selectedEmotion, content: content.trim() });
      navigate({ to: '/posts' });
    } catch (err: any) {
      setError(err?.message || 'Failed to create post. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-foreground">Share your emotion</h1>
          <p className="text-muted-foreground text-sm">Your post will be private by default.</p>
        </div>

        {/* Subscription gate */}
        {!canPost && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
            Your subscription has expired. Renew to continue posting.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Emotion selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Emotion type</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(EmotionType).map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => setSelectedEmotion(emotion)}
                  className={`
                    rounded-xl border-2 p-4 text-center transition-all
                    ${selectedEmotion === emotion
                      ? `border-primary bg-primary/10 ${EMOTION_CLASSES[emotion]}`
                      : 'border-border bg-card hover:border-primary/50'
                    }
                  `}
                >
                  <div className="font-semibold text-sm">{EMOTION_LABELS[emotion]}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-tight">
                    {EMOTION_DESCRIPTIONS[emotion]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Your words</label>
              {needsMinWords && (
                <span className={`text-xs ${meetsWordCount ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {wordCount} / 24 words minimum
                </span>
              )}
            </div>
            <Textarea
              placeholder={
                selectedEmotion
                  ? EMOTION_DESCRIPTIONS[selectedEmotion]
                  : 'Select an emotion type above, then write here…'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={createPost.isPending || !canPost}
              rows={8}
              className="resize-none bg-background"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="space-y-2">
            <Button
              type="submit"
              disabled={createPost.isPending || !canPost || !selectedEmotion || !content.trim() || !meetsWordCount}
              className="w-full"
              size="lg"
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting…
                </>
              ) : (
                'Post to my veil'
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Posts are private by default. You can make them public from My Posts.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
