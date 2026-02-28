# Specification

## Summary
**Goal:** Wire all frontend hooks in `useQueries.ts` to their corresponding backend Candid functions, completing the full integration between the Veil frontend and Internet Computer backend.

**Planned changes:**
- Update `useQueries.ts` to correctly call all backend functions (`createPost`, `editPost`, `deletePost`, `setPostPrivacy`, `addReaction`, `getMyReaction`, `getMyPosts`, `getPublicPosts`, `getMyProfile`, `isAdmin`, `register`, `validateInviteCode`, `getMySubscriptionStatus`) with exact Candid-matching parameter shapes and return types, using the actor from `useActor`
- Add cache invalidation on success for all mutation hooks so the UI reflects updated state immediately
- Fix `SignupPage` to call the `register` mutation with `(inviteCode, pseudonym, region)`, handle `#ok`/`#err` Result variants, navigate to `/dashboard` on success, and show backend error messages inline on failure
- Fix `PostCreationPage` to call `createPost` with `(emotionType, content)`, handle Result variants, navigate to `/my-posts` on success, show inline errors on failure, and enforce the 24-word minimum for Confess/Happy posts
- Fix `PostCard` to call `editPost`, `deletePost`, and `setPostPrivacy` with correct arguments, handle Result variants, and invalidate `myPosts`/`publicPosts` query keys on success
- Fix `PublicPostCard` to call `addReaction` and `getMyReaction` with correct arguments, display existing reactions, and disable reaction buttons for the post owner or already-reacted posts
- Expose all admin functions as hooks in `useQueries.ts` and wire them to `AdminPublicPostsList`, `AdminUserManagement`, `AdminInviteCodes`, and `AdminUserPostHistory` components with proper cache invalidation
- Ensure `DashboardPage` and `PostCreationPage` read subscription status from `getMySubscriptionStatus`/`getMyProfile` and correctly gate post creation, public toggling, and `SubscriptionBanner` visibility based on `#expired`, `#grace`, or `#active` status

**User-visible outcome:** All pages and components in Veil fully communicate with the backend — users can register, create/edit/delete posts, react to public posts, manage privacy, and see correct subscription gating; admins can manage users, posts, and invite codes — all without TypeScript errors or stale UI state.
