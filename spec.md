# Specification

## Summary
**Goal:** Fix pre-seeded invite codes (VEIL-001 through VEIL-005) not working on the deployed app, and ensure signup errors are displayed clearly to the user.

**Planned changes:**
- Audit and fix the backend invite code seeding logic so VEIL-001 through VEIL-005 are always present after a fresh deploy or upgrade, using the preupgrade/postupgrade stable var pattern
- Ensure seeding does not overwrite already-used or existing codes on upgrade
- Verify `validateInviteCode` returns true for each pre-seeded code before use, and `register` marks codes as used upon successful registration
- Audit and fix the SignupPage to display backend error messages (e.g. "Invalid invite code", "Invite code already used", "Capacity reached") inline below the form without a modal, keeping the form editable for retry

**User-visible outcome:** Users can successfully register using any of the pre-seeded invite codes on the deployed app, and if a code is invalid or already used, a clear inline error message is shown so they can correct and retry.
