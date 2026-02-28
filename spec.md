# Specification

## Summary
**Goal:** Complete a full end-to-end audit and fix of the Veil app so that every screen is functional, all buttons are clickable, and the backend and frontend are fully wired together.

**Planned changes:**
- Fix `backend/main.mo` to compile correctly, expose all 22 required public functions with correct signatures, pre-seed at least 5 invite codes, and use stable var with preupgrade/postupgrade hooks
- Fix `useQueries.ts` to include complete, correctly-typed React Query hooks for every backend function, with proper cache invalidation on mutation success
- Fix `LoginPage` to trigger Internet Identity login, redirect to `/dashboard` or `/signup` based on profile existence, and protect all authenticated routes
- Fix `SignupPage` to pre-fill invite code from URL params, offer exactly India and Global region options, call the register mutation, and show inline errors
- Fix `DashboardPage` to display the user's pseudonym, wire emotion buttons to navigate to `/create` with the correct emotion param, and show a subscription banner when expired
- Fix `PostCreationPage` to read emotion from params, enforce 24-word minimum for confess/happy, show a live word counter, and navigate to `/posts` on success
- Fix `MyPostsPage` and `PostCard` to wire edit, delete, and privacy toggle mutations with correct cache invalidation and the exact 'Go Public' confirmation text
- Fix `CommunityFeedPage` and `PublicPostCard` to fetch existing reactions, highlight the user's reaction, disable reaction buttons for post owners and already-reacted posts, and sort posts newest-first
- Fix `AdminPage` and all admin sub-components (public posts list, user management, invite codes, user post history) to correctly call all admin hooks and reflect changes immediately

**User-visible outcome:** Users can log in, sign up with an invite code, create posts, manage their posts, react in the community feed, and admins can manage users, posts, and invite codes — all screens are fully functional and interactive.
