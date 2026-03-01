# Specification

## Summary
**Goal:** Eliminate the recurring `RTS error: blob_of_principal: invalid principal` error by adding comprehensive anonymous principal guards across the backend, migration hook, and frontend query layer.

**Planned changes:**
- In `backend/main.mo`, add a `Principal.isAnonymous(caller)` guard at the top of every public function so anonymous callers receive a safe early exit (error, false, or empty array) before any `Principal.toBlob` or HashMap operation is attempted.
- In `backend/main.mo`, audit all iterations over the users, posts, and reactions maps to check `isAnonymous` before any `toBlob` or equality operation on stored Principal keys, skipping/removing anonymous entries instead of trapping.
- In `backend/migration.mo`, update the `postupgrade` hook to check `Principal.isAnonymous` on every stored user Principal key before any map operation, silently removing anonymous entries without trapping, and re-seed invite codes VEIL-001 through VEIL-005 as unused only if they are absent.
- In `frontend/src/hooks/useQueries.ts`, add a pre-dispatch check verifying both `isAuthenticated === true` and `identity.getPrincipal().isAnonymous() === false` before any actor call; queries return empty/null and mutations are skipped if either check fails.

**User-visible outcome:** Authenticated users with a valid Internet Identity principal can log in and use the app without encountering the `blob_of_principal: invalid principal` runtime trap.
