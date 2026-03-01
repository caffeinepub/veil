import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCallerUserProfile,
  useCreatePost,
  useGetESPStatus,
  useAcknowledgeEntryMessage,
  useAcknowledgePublicPostMessage,
} from '../hooks/useQueries';
import { EmotionType, Visibility } from '../backend';
import { countWords } from '../utils/wordCounter';
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
import EntryProtectionModal from '../components/EntryProtectionModal';
import PublicPostWarningModal from '../components/PublicPostWarningModal';

const MAX_CHARS = 1000;

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

// Guidance text shown beneath the emotion selector when a mode is active
const EMOTION_GUIDANCE: Record<EmotionType, string> = {
  [EmotionType.happy]: 'Share something real, not something impressive.',
  [EmotionType.confess]: 'This space is for release, not applause.',
  [EmotionType.broke]: 'Share what feels true right now. You don\'t have to explain everything.',
};

// Tonal styling for the guidance banner per emotion mode
const EMOTION_GUIDANCE_STYLES: Record<EmotionType, string> = {
  [EmotionType.happy]: 'bg-emotion-happy-bg text-emotion-happy-text border border-emotion-happy-accent',
  [EmotionType.confess]: 'bg-emotion-confess-bg text-emotion-confess-text border border-emotion-confess-accent',
  [EmotionType.broke]: 'bg-emotion-broke-bg text-emotion-broke-text border border-emotion-broke-accent',
};

// Tonal styling for the form area per emotion mode
const EMOTION_FORM_STYLES: Record<EmotionType, string> = {
  [EmotionType.happy]: 'ring-1 ring-emotion-happy-accent/40',
  [EmotionType.confess]: 'ring-1 ring-emotion-confess-accent/40',
  [EmotionType.broke]: 'ring-1 ring-emotion-broke-accent/40',
};

function getRateLimitErrorMessage(errorMsg: string): string {
  const lower = errorMsg.toLowerCase();
  if (lower.includes('5 private posts') || (lower.includes('rate limit') && lower.includes('private'))) {
    return "You've reached your daily limit of 5 private posts. Try again tomorrow or make your post public.";
  }
  if (lower.includes('content exceeds') || lower.includes('1000 characters')) {
    return 'Your post exceeds the 1000 character limit. Please shorten it.';
  }
  if (lower.includes('content cannot be empty') || lower.includes('empty')) {
    return 'Please write something before posting.';
  }
  return errorMsg;
}

export default function PostCreationPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/create' });
  const { identity } = useInternetIdentity();

  const ANONYMOUS_PRINCIPAL = '2vxsx-fae';
  const isAuthenticated = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const createPost = useCreatePost();
  const acknowledgeEntry = useAcknowledgeEntryMessage();
  const acknowledgePublic = useAcknowledgePublicPostMessage();

  const emotionParam = (search as any)?.emotion as string | undefined;
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(
    emotionParam && Object.values(EmotionType).includes(emotionParam as EmotionType)
      ? (emotionParam as EmotionType)
      : null
  );
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(Visibility.privateView);
  const [error, setError] = useState<string | null>(null);
  const [showESPModal, setShowESPModal] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);

  // Entry protection modal: show when profile is loaded and flag is false
  const [showEntryModal, setShowEntryModal] = useState(false);
  // Public post warning modal
  const [showPublicModal, setShowPublicModal] = useState(false);
  // Tracks whether the public toggle was set while waiting for acknowledgement
  const [pendingPublicToggle, setPendingPublicToggle] = useState(false);

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

  // Show entry protection modal once profile is loaded and flag is false
  useEffect(() => {
    if (profileFetched && userProfile && !userProfile.hasAcknowledgedEntryMessage) {
      setShowEntryModal(true);
    }
  }, [profileFetched, userProfile]);

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

  const charCount = content.length;
  const charsRemaining = MAX_CHARS - charCount;
  const exceedsLimit = charCount > MAX_CHARS;
  const wordCount = countWords(content);

  // Determine if the form should be blocked (entry modal not yet acknowledged)
  const entryNotAcknowledged = profileFetched && userProfile
    ? !userProfile.hasAcknowledgedEntryMessage
    : false;

  const isPrivate = visibility === Visibility.privateView;

  // Safety footer: only for BROKE + PUBLIC
  const showSafetyFooter =
    selectedEmotion === EmotionType.broke && visibility === Visibility.publicView;

  const handleEntryAcknowledge = async () => {
    try {
      await acknowledgeEntry.mutateAsync();
      setShowEntryModal(false);
    } catch {
      // Keep modal open on error; user can retry
    }
  };

  const handlePublicToggle = () => {
    // If already public, switch back to private
    if (visibility === Visibility.publicView) {
      setVisibility(Visibility.privateView);
      return;
    }

    // Switching to public: check if public post message has been acknowledged
    const alreadyAcknowledged = userProfile?.hasAcknowledgedPublicPostMessage ?? false;

    if (alreadyAcknowledged) {
      setVisibility(Visibility.publicView);
    } else {
      // Show warning modal; keep toggle in pending state
      setPendingPublicToggle(true);
      setShowPublicModal(true);
    }
  };

  const handlePublicAcknowledge = async () => {
    try {
      await acknowledgePublic.mutateAsync();
      setShowPublicModal(false);
      if (pendingPublicToggle) {
        setVisibility(Visibility.publicView);
        setPendingPublicToggle(false);
      }
    } catch {
      // On error, revert the pending toggle and close modal
      setShowPublicModal(false);
      setPendingPublicToggle(false);
    }
  };

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
    if (exceedsLimit) {
      setError(`Your post exceeds the ${MAX_CHARS} character limit. Please shorten it.`);
      return;
    }

    try {
      const post = await createPost.mutateAsync({
        emotionType: selectedEmotion,
        content: content.trim(),
        visibility,
      });
      setCreatedPostId(post.id);

      // Check ESP status after broke posts
      if (selectedEmotion === EmotionType.broke) {
        await refetchESP();
      } else {
        navigate({ to: '/posts' });
      }
    } catch (err: any) {
      const rawMessage = err?.message || 'Failed to create post. Please try again.';
      setError(getRateLimitErrorMessage(rawMessage));
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
          <p className="text-muted-foreground text-sm">Up to {MAX_CHARS} characters. Default visibility is private.</p>
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
                  disabled={entryNotAcknowledged || createPost.isPending}
                  className={`
                    rounded-xl border-2 p-4 text-center transition-all
                    ${selectedEmotion === emotion
                      ? `border-primary bg-primary/10 ${EMOTION_CLASSES[emotion]}`
                      : 'border-border bg-card hover:border-primary/50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
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

          {/* Emotion guidance banner */}
          {selectedEmotion && (
            <div
              className={`rounded-xl px-4 py-3 text-sm leading-relaxed transition-all ${EMOTION_GUIDANCE_STYLES[selectedEmotion]}`}
            >
              <span className="italic">{EMOTION_GUIDANCE[selectedEmotion]}</span>
            </div>
          )}

          {/* Content */}
          <div
            className={`space-y-2 rounded-xl transition-all ${
              selectedEmotion ? `p-4 -mx-4 ${EMOTION_FORM_STYLES[selectedEmotion]}` : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Your words</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
                <span className={`text-xs font-medium tabular-nums ${
                  exceedsLimit
                    ? 'text-destructive'
                    : charsRemaining <= 100
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
                }`}>
                  {charCount} / {MAX_CHARS}
                </span>
              </div>
            </div>
            <Textarea
              placeholder={
                selectedEmotion
                  ? EMOTION_DESCRIPTIONS[selectedEmotion]
                  : 'Select an emotion type above, then write here…'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={entryNotAcknowledged || createPost.isPending}
              rows={8}
              className={`resize-none bg-background ${exceedsLimit ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {exceedsLimit && (
              <p className="text-xs text-destructive">
                {Math.abs(charsRemaining)} character{Math.abs(charsRemaining) !== 1 ? 's' : ''} over the limit.
              </p>
            )}
          </div>

          {/* Privacy toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Visibility</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVisibility(Visibility.privateView)}
                disabled={entryNotAcknowledged || createPost.isPending}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                  isPrivate
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Lock size={14} />
                Private
              </button>
              <button
                type="button"
                onClick={handlePublicToggle}
                disabled={entryNotAcknowledged || createPost.isPending}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                  !isPrivate
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
              disabled={
                entryNotAcknowledged ||
                createPost.isPending ||
                !selectedEmotion ||
                !content.trim() ||
                exceedsLimit
              }
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

        {/* Safety footer — BROKE + PUBLIC only */}
        {showSafetyFooter && (
          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed pt-2 pb-4">
            Veil is a reflection space. If you are in immediate danger, please contact local emergency services.
          </p>
        )}
      </div>

      {/* Entry Protection Modal */}
      <EntryProtectionModal
        isOpen={showEntryModal}
        onAcknowledge={handleEntryAcknowledge}
        isPending={acknowledgeEntry.isPending}
      />

      {/* Public Post Warning Modal */}
      <PublicPostWarningModal
        isOpen={showPublicModal}
        onAcknowledge={handlePublicAcknowledge}
        isPending={acknowledgePublic.isPending}
      />

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
