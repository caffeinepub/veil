# Specification

## Summary
**Goal:** Fix the "RTS error: blob_of_principal: invalid principal" crash by guarding all backend functions and migration logic against anonymous principals, and reinforcing the frontend to never dispatch actor calls when unauthenticated.

**Planned changes:**
- In `backend/main.mo`, add `Principal.isAnonymous(caller)` checks at the top of every public function (register, createPost, editPost, deletePost, setPostPrivacy, addReaction, getMyReaction, getMyProfile, getMyPosts, getMySubscriptionStatus, and all admin functions), returning an immediate error or false if the caller is anonymous.
- In `backend/migration.mo`, update the `postupgrade` hook to check each stored user entry's Principal key with `Principal.isAnonymous` before any blob conversion or comparison, silently removing anonymous-keyed entries without trapping, while preserving all legitimate user entries and re-seeding invite codes VEIL-001 through VEIL-005 as before.
- In `frontend/src/hooks/useQueries.ts`, reinforce the anonymous-identity guard so all actor calls verify both `isAuthenticated` and that the identity is not anonymous before proceeding; all `useQuery` hooks set `enabled: false` and all `useMutation` hooks return early when the caller is unauthenticated or anonymous.

**User-visible outcome:** Anonymous or unauthenticated sessions no longer cause a backend trap. Authenticated users continue to register, post, react, and use admin functions normally without any crashes.
