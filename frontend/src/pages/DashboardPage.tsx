import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetMySubscriptionStatus } from '../hooks/useQueries';
import { EmotionType } from '../backend';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { canCreatePost, getSubscriptionLabel } from '../utils/subscriptionHelpers';
import { Skeleton } from '@/components/ui/skeleton';

const EMOTIONS = [
  {
    type: EmotionType.confess,
    label: 'Confess',
    description: 'Something weighing on you',
    colorClass: 'bg-emotion-confess border-emotion-confess text-emotion-confess',
    hoverClass: 'hover:bg-emotion-confess/20',
  },
  {
    type: EmotionType.broke,
    label: 'Broke',
    description: 'When you\'re falling apart',
    colorClass: 'bg-emotion-broke border-emotion-broke text-emotion-broke',
    hoverClass: 'hover:bg-emotion-broke/20',
  },
  {
    type: EmotionType.happy,
    label: 'Happy',
    description: 'A moment worth keeping',
    colorClass: 'bg-emotion-happy border-emotion-happy text-emotion-happy',
    hoverClass: 'hover:bg-emotion-happy/20',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: profile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: subscriptionStatus } = useGetMySubscriptionStatus();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
      return;
    }
    if (isFetched && profile === null) {
      navigate({ to: '/signup' });
    }
  }, [isAuthenticated, profile, isFetched, navigate]);

  if (!isAuthenticated || profileLoading || !isFetched) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 space-y-8">
        <Skeleton className="h-8 w-64 mx-auto rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const canPost = canCreatePost(subscriptionStatus);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 animate-fade-in">
      {/* Subscription banner for expired users */}
      {subscriptionStatus && !canPost && (
        <div className="mb-10">
          <SubscriptionBanner region={profile.region} />
        </div>
      )}

      {/* Greeting */}
      <div className="text-center mb-14">
        <p className="text-sm text-muted-foreground font-sans mb-3 tracking-wide uppercase">
          {getSubscriptionLabel(subscriptionStatus) && (
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                subscriptionStatus === 'grace' ? 'bg-status-grace' :
                subscriptionStatus === 'active' ? 'bg-status-grace' :
                'bg-status-expired'
              }`} />
              {getSubscriptionLabel(subscriptionStatus)}
            </span>
          )}
        </p>
        <h1 className="font-serif text-4xl font-medium text-foreground leading-tight">
          What are you feeling today?
        </h1>
        <p className="mt-3 text-muted-foreground font-sans text-base">
          This is your space, {profile.pseudonym}.
        </p>
      </div>

      {/* Emotion buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {EMOTIONS.map((emotion) => (
          <button
            key={emotion.type}
            onClick={() => {
              if (canPost) {
                navigate({ to: '/post/new/$emotion', params: { emotion: emotion.type } });
              }
            }}
            disabled={!canPost}
            className={`
              group relative flex flex-col items-center justify-center
              p-8 rounded-2xl border-2 transition-all duration-200
              ${emotion.colorClass}
              ${canPost ? `${emotion.hoverClass} cursor-pointer` : 'opacity-50 cursor-not-allowed'}
            `}
          >
            <span className="font-serif text-2xl font-medium mb-2">
              {emotion.label}
            </span>
            <span className="text-xs font-sans opacity-70 text-center leading-relaxed">
              {emotion.description}
            </span>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-sans">
        <button
          onClick={() => navigate({ to: '/my-posts' })}
          className="hover:text-foreground transition-colors underline underline-offset-4"
        >
          View my posts
        </button>
        <span className="text-border">·</span>
        <button
          onClick={() => navigate({ to: '/community' })}
          className="hover:text-foreground transition-colors underline underline-offset-4"
        >
          Community feed
        </button>
      </div>
    </div>
  );
}
