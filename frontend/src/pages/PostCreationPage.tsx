import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useCreatePost, useGetESPStatus } from '../hooks/useQueries';
import { EmotionType } from '../backend';
import { countWords, hasMinimumWords } from '../utils/wordCounter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Lock, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
  const createPost = useCreatePost();

  const emotionParam = (search as any)?.emotion as string | undefined;
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(
    emotionParam && Object.values(EmotionType).includes(emotionParam as EmotionType)
      ? (emotionParam as EmotionType)
      : null
  );
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showESPModal, setShowESPModal] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);

  // Check ESP status after a broke post is created
  const { data: espTriggered, refetch: refetchESP } = useGetESPStatus();

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

  // Show ESP modal if triggered after posting
  useEffect(() => {
    if (createdPostId && espTriggered) {
      setShowESPModal(true);
    }
  }, [createdPostId, espTriggered]);

  if (!isAuthenticated || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const wordCount = countWords(content);
  // All emotion types require 24 words minimum (backend enforces this)
  const meetsWordCount = hasMinimumWords(content, 24);

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
      setError('Please write at least 24 words.');
      return;
    }

    try {
      const postId = await createPost.mutateAsync({
        emotionType: selectedEmotion,
        content: content.trim(),
        isPrivate,
      });
      setCreatedPostId(postId);

      // Check ESP status after broke posts
      if (selectedEmotion === EmotionType.broke) {
        await refetchESP();
      } else {
        navigate({ to: '/posts' });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create post. Please try again.');
    }
  };

  const handleESPAcknowledge = () => {
    setShowESPModal(false);
    navigate({ to: '/dashboard' });
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
          <p className="text-muted-foreground text-sm">All posts require at least 24 words.</p>
        </div>

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
              <span className={`text-xs ${meetsWordCount ? 'text-primary' : 'text-muted-foreground'}`}>
                {wordCount} / 24 words minimum
              </span>
            </div>
            <Textarea
              placeholder={
                selectedEmotion
                  ? EMOTION_DESCRIPTIONS[selectedEmotion]
                  : 'Select an emotion type above, then write here…'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={createPost.isPending}
              rows={8}
              className="resize-none bg-background"
            />
          </div>

          {/* Privacy toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Visibility</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                  isPrivate
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                <Lock size={14} />
                Private
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                  !isPrivate
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                <Globe size={14} />
                Public
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isPrivate
                ? 'Only you can see this post.'
                : 'This post will appear in the community feed.'}
            </p>
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
              disabled={createPost.isPending || !selectedEmotion || !content.trim() || !meetsWordCount}
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
          </div>
        </form>
      </div>

      {/* ESP Modal */}
      <Dialog open={showESPModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">A gentle pause</DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-2">
              We noticed you've been sharing some difficult feelings recently. Taking a pause can be helpful.
              Your well-being matters, and we're glad you're here.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you're going through a hard time, please know that reaching out to someone you trust can make a difference.
            You don't have to carry this alone.
          </p>
          <DialogFooter>
            <Button onClick={handleESPAcknowledge} className="w-full">
              I understand, take me home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
