import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetMySubscriptionStatus, useCreatePost } from '../hooks/useQueries';
import { EmotionType } from '../backend';
import { countWords, MIN_WORDS_CONFESS_HAPPY } from '../utils/wordCounter';
import { canCreatePost } from '../utils/subscriptionHelpers';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';

const EMOTION_CONFIG: Record<string, { label: string; colorClass: string; placeholder: string }> = {
  confess: {
    label: 'Confess',
    colorClass: 'text-emotion-confess',
    placeholder: 'What have you been carrying? Let it out here...',
  },
  broke: {
    label: 'Broke',
    colorClass: 'text-emotion-broke',
    placeholder: 'You don\'t have to explain. Just write...',
  },
  happy: {
    label: 'Happy',
    colorClass: 'text-emotion-happy',
    placeholder: 'What made you feel alive today? Capture it...',
  },
};

export default function PostCreationPage() {
  const navigate = useNavigate();
  const { emotion } = useParams({ from: '/post/new/$emotion' });
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: subscriptionStatus } = useGetMySubscriptionStatus();
  const createPost = useCreatePost();

  const [content, setContent] = useState('');

  const emotionType = emotion as EmotionType;
  const config = EMOTION_CONFIG[emotion] || EMOTION_CONFIG.confess;
  const wordCount = countWords(content);
  const needsMinWords = emotionType === EmotionType.confess || emotionType === EmotionType.happy;
  const meetsRequirement = !needsMinWords || wordCount >= MIN_WORDS_CONFESS_HAPPY;
  const canPost = canCreatePost(subscriptionStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsRequirement || !canPost) return;

    try {
      await createPost.mutateAsync({ emotionType, content });
      toast.success('Your post has been saved privately.');
      navigate({ to: '/my-posts' });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('24 words')) {
        toast.error('Please write at least 24 words for this emotion type.');
      } else if (msg.includes('expired')) {
        toast.error('Your subscription has expired. You cannot create new posts.');
      } else if (msg.includes('Suspended')) {
        toast.error('Your account is suspended. You cannot create posts.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans mb-10"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      {/* Subscription banner */}
      {!canPost && profile && (
        <div className="mb-8">
          <SubscriptionBanner region={profile.region} />
        </div>
      )}

      {/* Emotion title */}
      <div className="mb-8">
        <h1 className={`font-serif text-4xl font-medium ${config.colorClass}`}>
          {config.label}
        </h1>
        {needsMinWords && (
          <p className="mt-3 text-sm text-muted-foreground font-sans leading-relaxed">
            Please share at least 24 words so your future self understands this moment.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Textarea */}
        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={config.placeholder}
            disabled={!canPost}
            className="min-h-[240px] rounded-2xl font-sans text-base leading-relaxed resize-none border-border focus:ring-ring/30 p-5"
          />
        </div>

        {/* Word counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {needsMinWords && (
              <span className={`text-sm font-sans ${
                wordCount >= MIN_WORDS_CONFESS_HAPPY
                  ? 'text-status-grace'
                  : 'text-muted-foreground'
              }`}>
                {wordCount} / {MIN_WORDS_CONFESS_HAPPY} words
              </span>
            )}
            {!needsMinWords && (
              <span className="text-sm text-muted-foreground font-sans">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={!meetsRequirement || !canPost || createPost.isPending}
            className="rounded-xl font-sans px-8"
          >
            {createPost.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </span>
            ) : (
              'Post'
            )}
          </Button>
        </div>

        {/* Private notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/60 border border-border">
          <Lock size={14} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            🔒 Your post is private by default. Only you can see it. You can choose to make it public after posting.
          </p>
        </div>
      </form>
    </div>
  );
}
