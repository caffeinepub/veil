import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyProfile, useGetMySubscriptionStatus } from '../hooks/useQueries';
import { SubscriptionStatus } from '../backend';
import { canCreatePost } from '../utils/subscriptionHelpers';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { Loader2 } from 'lucide-react';

const emotions = [
  {
    key: 'confess',
    label: 'Confess',
    emoji: '🤫',
    description: 'Something weighing on you',
    color: 'bg-emotion-confess/10 hover:bg-emotion-confess/20 border-emotion-confess/30 text-emotion-confess',
  },
  {
    key: 'broke',
    label: 'Broke',
    emoji: '💸',
    description: 'Financial stress or struggle',
    color: 'bg-emotion-broke/10 hover:bg-emotion-broke/20 border-emotion-broke/30 text-emotion-broke',
  },
  {
    key: 'happy',
    label: 'Happy',
    emoji: '🌸',
    description: 'A moment of joy to share',
    color: 'bg-emotion-happy/10 hover:bg-emotion-happy/20 border-emotion-happy/30 text-emotion-happy',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isFetched: profileFetched, isLoading: profileLoading } = useGetMyProfile();
  const { data: subscriptionStatus, isLoading: subLoading } = useGetMySubscriptionStatus();

  const isAuthenticated = !!identity;

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

  const isExpired = subscriptionStatus === SubscriptionStatus.expired;
  const canPost = canCreatePost(subscriptionStatus ?? SubscriptionStatus.expired);

  const handleEmotionClick = (emotionKey: string) => {
    if (!canPost) return;
    navigate({ to: '/create', search: { emotion: emotionKey } });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Welcome back, {profile.pseudonym}
        </h1>
        <p className="text-sm text-muted-foreground">
          What are you feeling today?
        </p>
      </div>

      {/* Subscription banner */}
      {isExpired && (
        <SubscriptionBanner region={profile.region} />
      )}

      {/* Emotion buttons */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Choose your emotion
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {emotions.map(emotion => (
            <button
              key={emotion.key}
              onClick={() => handleEmotionClick(emotion.key)}
              disabled={!canPost}
              className={`
                relative flex flex-col items-center gap-2 p-5 rounded-xl border transition-all
                ${canPost
                  ? `${emotion.color} cursor-pointer`
                  : 'bg-muted/30 border-border text-muted-foreground cursor-not-allowed opacity-60'
                }
              `}
            >
              <span className="text-3xl">{emotion.emoji}</span>
              <span className="font-medium text-sm">{emotion.label}</span>
              <span className="text-xs opacity-70 text-center">{emotion.description}</span>
            </button>
          ))}
        </div>

        {!canPost && (
          <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2 text-center">
            Your subscription has expired. Renew to create new posts.
          </p>
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate({ to: '/posts' })}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          View my posts →
        </button>
        <button
          onClick={() => navigate({ to: '/community' })}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Community feed →
        </button>
      </div>
    </div>
  );
}
