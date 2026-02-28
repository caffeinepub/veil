import { SubscriptionStatus, Region } from '../backend';

export function canCreatePost(status: SubscriptionStatus | null | undefined): boolean {
  if (!status) return false;
  return status === SubscriptionStatus.grace || status === SubscriptionStatus.active;
}

export function canMakePublic(status: SubscriptionStatus | null | undefined): boolean {
  if (!status) return false;
  return status === SubscriptionStatus.grace || status === SubscriptionStatus.active;
}

export function getRegionalPricing(region: Region | null | undefined): string {
  if (region === Region.india) return '₹150/month';
  return '$9/month';
}

export function getSubscriptionLabel(status: SubscriptionStatus | null | undefined): string {
  if (!status) return '';
  switch (status) {
    case SubscriptionStatus.grace:
      return 'Grace Period';
    case SubscriptionStatus.active:
      return 'Active';
    case SubscriptionStatus.expired:
      return 'Expired';
    default:
      return '';
  }
}
