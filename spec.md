# Specification

## Summary
**Goal:** Fix the "RTS error: blob_of_principal: invalid principal" crash by guarding all backend functions against anonymous principals and ensuring the frontend never fires actor calls before authentication is confirmed.

**Planned changes:**
- Add `Principal.isAnonymous(caller)` guard at the entry point of all state-mutating backend functions (`register`, `createPost`, `editPost`, `deletePost`, `setPostPrivacy`, `addReaction`, `adminSuspendUser`, `adminUnsuspendUser`, `setSubscriptionStatus`) and any function that performs a Principal lookup or blob conversion, returning a descriptive `#err` instead of trapping.
- Update the `postupgrade`/migration hook in `backend/migration.mo` to skip and remove any stored user entries whose Principal key is anonymous or invalid before iterating, preventing RTS traps on upgrade.
- In the frontend (`useQueries.ts` and related components), gate all backend actor calls behind a check that `isAuthenticated` is `true` and the identity is non-anonymous; return early or skip the query otherwise.

**User-visible outcome:** Anonymous/unauthenticated users no longer cause an RTS trap — they receive a graceful error. Authenticated users continue to work normally, and canister upgrades complete without crashing.
