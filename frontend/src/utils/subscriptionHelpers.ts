import { SubscriptionStatus, Region } from '../backend';

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.active || status === SubscriptionStatus.grace;
}

export function canCreatePost(status: SubscriptionStatus): boolean {
  return isSubscriptionActive(status);
}

export function canGoPublic(status: SubscriptionStatus): boolean {
  return isSubscriptionActive(status);
}

export function getRegionalPricing(region: Region): string {
  if (region === Region.India) {
    return '₹150/month';
  }
  return '$9/month';
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case SubscriptionStatus.active:
      return 'Active';
    case SubscriptionStatus.grace:
      return 'Grace Period';
    case SubscriptionStatus.expired:
      return 'Expired';
    default:
      return 'Unknown';
  }
}
