import { Region, SubscriptionStatus, type UserProfile } from "../backend";

/**
 * Returns true if the user can create posts (not expired).
 */
export function canCreatePost(
  profile: UserProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return profile.subscriptionStatus !== SubscriptionStatus.expired;
}

/**
 * Returns true if the user can make posts public (active subscription only).
 */
export function canGoPublic(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return profile.subscriptionStatus === SubscriptionStatus.active;
}

/**
 * Returns a region-appropriate pricing string.
 */
export function getPricingString(
  profile: UserProfile | null | undefined,
): string {
  if (!profile) return "";
  if (profile.region === Region.India) {
    return "₹299/month";
  }
  return "$9.99/month";
}
