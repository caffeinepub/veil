import { Region } from '../backend';

interface SubscriptionBannerProps {
  region: Region;
}

export default function SubscriptionBanner({ region }: SubscriptionBannerProps) {
  const price = region === Region.India ? '₹150/month' : '$9/month';

  return (
    <div className="rounded-xl bg-muted border border-border px-4 py-3 text-sm text-muted-foreground">
      <p>
        Your subscription has expired. To continue posting, renew your membership at{' '}
        <span className="text-foreground font-medium">{price}</span>.
      </p>
    </div>
  );
}
