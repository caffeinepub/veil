import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useGetCallerUserProfile } from '../hooks/useQueries';
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
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: profile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  useEffect(() => {
    if (profileFetched && !profile && isAuthenticated) {
      navigate({ to: '/signup' });
    }
  }, [profileFetched, profile, isAuthenticated, navigate]);

  if (isInitializing || profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  const subscriptionStatus = profile.subscriptionStatus;
  const isExpired = subscriptionStatus === SubscriptionStatus.expired;
  const canPost = canCreatePost(subscriptionStatus);

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
        <p className="text-sm text-muted-foreground">What are you feeling today?</p>
      </div>

      {/* Subscription banner */}
      {isExpired && <SubscriptionBanner region={profile.region} />}

      {/* Emotion buttons */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Choose an emotion to write about
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {emotions.map((emotion) => (
            <button
              key={emotion.key}
              onClick={() => handleEmotionClick(emotion.key)}
              disabled={!canPost}
              className={`
                flex flex-col items-center gap-2 p-5 rounded-xl border transition-all text-center
                ${
                  canPost
                    ? `${emotion.color} cursor-pointer`
                    : 'bg-muted/30 border-border text-muted-foreground cursor-not-allowed opacity-60'
                }
              `}
            >
              <span className="text-2xl">{emotion.emoji}</span>
              <div>
                <p className="font-semibold text-sm">{emotion.label}</p>
                <p className="text-xs opacity-75 mt-0.5">{emotion.description}</p>
              </div>
            </button>
          ))}
        </div>
        {!canPost && (
          <p className="text-xs text-muted-foreground text-center">
            Your subscription has expired. Renew to create new posts.
          </p>
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
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
