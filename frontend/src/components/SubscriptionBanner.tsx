import { Region } from '../backend';
import { getRegionalPricing } from '../utils/subscriptionHelpers';
import { Info } from 'lucide-react';

interface SubscriptionBannerProps {
  region: Region | null;
}

export default function SubscriptionBanner({ region }: SubscriptionBannerProps) {
  const price = getRegionalPricing(region);

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/70 border border-border">
      <Info size={16} className="text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-sans text-foreground font-medium mb-1">
          Your grace period has ended
        </p>
        <p className="text-sm text-muted-foreground font-sans leading-relaxed">
          You can still read all posts and your archive. To create new posts or share with the community,
          renew your membership for {price}. Contact your moderator to activate.
        </p>
      </div>
    </div>
  );
}
