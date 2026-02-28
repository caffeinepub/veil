import { Region } from '../backend';
import { getRegionalPricing } from '../utils/subscriptionHelpers';
import { AlertCircle } from 'lucide-react';

interface SubscriptionBannerProps {
  region: Region;
}

export default function SubscriptionBanner({ region }: SubscriptionBannerProps) {
  const pricing = getRegionalPricing(region);

  return (
    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
      <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Subscription Expired
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Renew your Veil membership for {pricing} to continue posting and sharing with the community.
        </p>
      </div>
    </div>
  );
}
