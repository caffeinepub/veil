# Specification

## Summary
**Goal:** Build the complete VEIL platform end-to-end, covering authentication, post creation, reactions, comments, flagging, admin dashboard, invite codes, and seat counter — all wired to a fully implemented Motoko backend.

**Planned changes:**
- Implement end-to-end Internet Identity authentication flow with session persistence, logout, role detection (admin vs. member), and route guards (ProtectedRoute, AdminRoute)
- Implement fully functional post creation with emotion type selection (happy, confess, broke), 24-word minimum enforcement, public/private toggle, entry protection modal, and public post warning modal
- Add inline "broke" emotion mode guidance callout that appears only when the broke emotion type is selected
- Implement reaction system on public post cards: non-authors can add text reactions, reaction count displayed, persisted in backend
- Implement comment system on public post cards: non-authors can add comments, comment count displayed, persisted in backend
- Implement flagging system on public post cards: non-authors can flag posts/comments, report counts tracked in backend
- Build fully functional admin dashboard with six tabs: Public Posts, User Management, Invite Codes, Flagged Content, Emotional Alerts, and Crisis Risk; include ecosystem silence banner
- Implement invite code flow: admin generates/revokes/copies codes; SignupPage validates codes before registration; codes marked as consumed after use
- Implement seat counter on SignupPage showing remaining seats fetched live from backend; disable signup form when seats are full
- Wire all React Query hooks in useQueries.ts to every backend actor method with consistent query keys, mutation invalidation, and error state surfacing
- Implement complete Motoko backend actor in backend/main.mo with all required methods (createUser, createPost, getPublicPosts, getUserPosts, addReaction, addComment, flagPost, flagComment, getFlags, all admin methods, invite code methods, getRemainingSeats, getEmotionalAlerts, getCrisisRiskPosts) using stable variables for persistence

**User-visible outcome:** Users can sign up with an invite code, authenticate via Internet Identity, create emotion-typed posts, react and comment on others' posts, and flag content. Admins can manage users, posts, invite codes, flagged content, emotional alerts, and crisis risk items from a fully operational dashboard.
