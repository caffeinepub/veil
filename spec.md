# Specification

## Summary
**Goal:** Build VEIL, an invite-only private emotional infrastructure app MVP where authenticated users can post emotional content across three lanes (Happy, Confess, Broke), react to and comment on public posts, and be moderated by an admin dashboard — all with a calm, minimal UI and no gamification.

**Planned changes:**
- Invite-only user registration (max 100 seats) with pseudonym and region, backed by Internet Identity authentication
- Three emotional post lanes: Happy, Confess, and Broke — each post requires 24+ words and a Public/Private visibility toggle
- Witnessing-based reactions (Support, Care, Strength) on public posts — non-metric display, no self-reactions, no duplicates
- Commenting on public posts only; private posts have no comment section
- Flagging system for authenticated users to flag posts for admin review
- Emotional Stability Protocol (ESP): if a user posts in the Broke lane more than 3 times in 7 days, flag the account for admin review and show the user a calm supportive message (no metrics shown)
- Admin dashboard: post management with delete, member management with suspend/unsuspend, invite code management (create/revoke/copy), flagged posts review queue, per-user post history, and seat counter display
- Frontend pages: Welcome/Landing, Login (Internet Identity), Signup (invite code + pseudonym + region), Dashboard with emotion-lane navigation, Post Creation, My Posts, Community Feed (public posts only), Admin Dashboard
- Calm, minimal visual theme — muted neutral palette, clean typography, no follower counts, no metric displays, no gamification visuals

**User-visible outcome:** Users can register with an invite code, log in via Internet Identity, post emotional content across three lanes, witness others' public posts with non-metric reactions and comments, and be gently supported if they post frequently in the Broke lane — all within a calm, private, minimal interface. Admins can manage users, posts, invite codes, and review flagged content from a dedicated dashboard.
