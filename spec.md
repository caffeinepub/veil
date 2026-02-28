# Specification

## Summary
**Goal:** Complete the Veil backend with posts, reactions, privacy controls, admin moderation, and wire all existing frontend pages to the live backend.

**Planned changes:**
- Implement `createPost` with emotion-type word-count enforcement, rejection of suspended/expired/unregistered callers, and default fields (`isPrivate=true`, `reactionCount=0`, `editable=true`)
- Implement `editPost` allowing edits only when the caller is the owner and `editable=true` (no reactions yet), with same word-count rules
- Implement `setPostPrivacy` to toggle post visibility; going public requires active subscription and non-suspended status; making private requires ownership only
- Implement `addReaction` (variants: `#support`, `#care`, `#strength`) on public posts only, one per user per post; increments `reactionCount` and sets `editable=false`; expose `getMyReaction` per post
- Implement `deletePost` (owner only) and `adminDeletePost` (admin Principal only), both removing associated reactions from stable state
- Implement admin functions: `adminGetAllPublicPosts`, `adminGetUserPosts`, `adminSuspendUser`, `adminUnsuspendUser`, `adminGetAllUsers`, all gated by hardcoded admin Principal
- Expose query/update functions required by frontend: `getMyProfile`, `getMyPosts`, `getPublicPosts`, `isAdmin`
- Update `useQueries.ts` to call all backend functions via the actor and invalidate correct query keys on mutation success
- Wire `PostCreationPage`, `PostCard`, `PublicPostCard`, dashboard, header, and admin dashboard tabs to the live backend

**User-visible outcome:** All existing frontend screens are fully functional — users can create, edit, delete, and toggle privacy on posts; community feed shows public posts with reaction buttons; the admin dashboard can manage users and posts; subscription and suspension states are enforced throughout.
