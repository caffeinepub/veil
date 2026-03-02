import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreatePost } from '../hooks/useQueries';
import { EmotionType, Visibility } from '../backend';
import { countWords, needsMinimumWords, hasMinimumWords } from '../utils/wordCounter';
import EntryProtectionModal from '../components/EntryProtectionModal';
import PublicPostWarningModal from '../components/PublicPostWarningModal';
import EmotionBadge from '../components/EmotionBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertTriangle } from 'lucide-react';

const EMOTION_TYPES: EmotionType[] = [EmotionType.happy, EmotionType.confess, EmotionType.broke];

export default function PostCreationPage() {
  const navigate = useNavigate();
  const createPost = useCreatePost();

  const [acknowledged, setAcknowledged] = useState(false);
  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [publicWarningAcknowledged, setPublicWarningAcknowledged] = useState(false);

  const [emotionType, setEmotionType] = useState<EmotionType>(EmotionType.confess);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');

  const wordCount = countWords(content);
  const requiresMinWords = needsMinimumWords(emotionType);
  const meetsWordCount = !requiresMinWords || hasMinimumWords(content);

  const handleVisibilityToggle = (checked: boolean) => {
    setIsPublic(checked);
    if (checked && !publicWarningAcknowledged) {
      setShowPublicWarning(true);
    }
  };

  const handlePublicWarningAcknowledge = () => {
    setPublicWarningAcknowledged(true);
    setShowPublicWarning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please write something before submitting.');
      return;
    }

    if (!meetsWordCount) {
      setError('Please write at least 24 words before submitting.');
      return;
    }

    if (isPublic && !publicWarningAcknowledged) {
      setShowPublicWarning(true);
      return;
    }

    try {
      await createPost.mutateAsync({
        emotionType,
        content: content.trim(),
        visibility: isPublic ? Visibility.publicView : Visibility.privateView,
      });
      navigate({ to: '/posts' });
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Failed to create post.');
    }
  };

  return (
    <>
      <EntryProtectionModal open={!acknowledged} onAcknowledge={() => setAcknowledged(true)} />
      <PublicPostWarningModal
        open={showPublicWarning}
        onAcknowledge={handlePublicWarningAcknowledge}
      />

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-serif font-semibold text-foreground">New Entry</h1>
          <p className="text-sm text-muted-foreground">Express yourself honestly and safely.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Emotion Type Selector */}
          <div className="space-y-2">
            <Label>Emotional Mode</Label>
            <div className="flex gap-2 flex-wrap">
              {EMOTION_TYPES.map((et) => (
                <button
                  key={et}
                  type="button"
                  onClick={() => setEmotionType(et)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                    emotionType === et
                      ? 'ring-2 ring-offset-1 ring-ring border-transparent'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <EmotionBadge emotionType={et} />
                </button>
              ))}
            </div>
          </div>

          {/* Broke Guidance Callout */}
          {emotionType === EmotionType.broke && (
            <div className="rounded-xl border border-emotion-broke/30 bg-emotion-broke/10 px-4 py-3 flex gap-3 items-start">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-emotion-broke" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-emotion-broke">Genuine Distress Mode</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This mode is for moments of real pain. Before you write, take three slow breaths.
                  You are safe here. If you are in crisis, please reach out to a trusted person or
                  a crisis line in your region.
                </p>
              </div>
            </div>
          )}

          {/* Content Textarea */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Entry</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely…"
              rows={8}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {wordCount} word{wordCount !== 1 ? 's' : ''}
                {requiresMinWords && (
                  <span className={meetsWordCount ? 'text-green-600 ml-1' : 'text-destructive ml-1'}>
                    {meetsWordCount ? '(minimum met)' : '(24 words minimum)'}
                  </span>
                )}
              </span>
              <span>{content.length}/1000 characters</span>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="visibility-toggle" className="cursor-pointer">
                Share publicly
              </Label>
              <p className="text-xs text-muted-foreground">
                {isPublic ? 'Visible to all community members' : 'Only visible to you'}
              </p>
            </div>
            <Switch
              id="visibility-toggle"
              checked={isPublic}
              onCheckedChange={handleVisibilityToggle}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={createPost.isPending || !meetsWordCount || !content.trim()}
          >
            {createPost.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save Entry'
            )}
          </Button>
        </form>
      </main>
    </>
  );
}
