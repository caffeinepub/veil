# Specification

## Summary
**Goal:** Build the VEIL MVP — a closed emotional ecosystem with invite-only registration, pseudonymous identity, a metrics-free community feed, and basic moderation tools.

**Planned changes:**
- **Signup page:** Display remaining available seat count fetched from the backend near the registration form; enforce invite code validation (invalid/used codes show a clear error); allow registration with a pseudonym upon valid code submission; redirect to login after successful registration.
- **Login page:** Implement Internet Identity as the sole authentication method; redirect authenticated users to the community feed/dashboard; redirect unauthenticated users away from protected routes back to `/login`; persist auth state across reloads.
- **Post creation page:** Add emotion selector including a "Happy" option; add a Public/Private visibility toggle defaulting to Private; show a confirmation warning modal when toggling to Public before submission; submit post with correct visibility to the backend.
- **Community feed page:** List all public posts in reverse-chronological order; display each post card with pseudonym, emotion badge, content, and timestamp; show predefined text reactions (e.g., "I feel this", "You are not alone") with no counts — only a personal highlight for the current user's selection; include a comments section per post showing comments in submission order with a text input for authenticated users; show a Flag/Report button on posts not authored by the current user; no engagement metrics, trending sections, or popularity indicators anywhere.
- **Backend:** Store and decrement seat count on registration; validate invite codes (mark as used on success); store posts (public/private), reactions (no counts exposed), comments, and flags associated with posts.
- **Admin panel:** Add a "Flagged Posts" tab listing all reported posts with post content, author pseudonym, and creation date; provide a permanently-remove action behind a confirmation dialog; removed posts disappear from the feed.
- **Global UI:** Remove all gamification elements, streak counters, badges, engagement metrics, leaderboards, and popularity signals from every page; UI should communicate calm, containment, and witnessing.

**User-visible outcome:** Invited users can register with a pseudonym, log in via Internet Identity, create public or private emotional posts, witness others' posts through reactions and comments, flag harmful content, and admins can review and remove flagged posts — all within a metrics-free, non-gamified interface.
