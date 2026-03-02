# Specification

## Summary
**Goal:** Extend the Veil admin dashboard with full moderation tools — user management, flagged post removal, and an emotional monitoring alert system — backed by admin-restricted backend functions.

**Planned changes:**
- Add backend functions: `adminRemoveUser`, `adminSuspendUser`, `adminApplyCooldown`, `adminRemovePost`, `adminGetAllUsers`, `adminGetFlaggedPosts`, and `adminGetEmotionalAlerts`, all restricted to admin-role callers
- Add `isSuspended` and `cooldownUntil` fields to user records; create a migration module (`backend/migration.mo`) to backfill existing users with safe defaults
- Track BROKE-emotion post counts per user per day to support the 5-BROKE-in-3-consecutive-days alert threshold
- Add an "All Users" tab to the AdminDashboard listing every user with pseudonym, region, subscription status, suspended badge, and cooldown expiry, with Suspend/Unsuspend, Apply 24-hr Cooldown, and Permanently Remove User (confirmation dialog) action buttons
- Update the "Flagged Posts" tab to show flag reason, reporter, timestamp, and a "Remove Post" button with a confirmation dialog
- Add an "Emotional Monitoring Alerts" tab showing alert cards (pseudonym, BROKE post count, 3-day window) in a soft amber/warning style; no automated actions are triggered
- Add React Query hooks to `useQueries.ts`: `useAdminGetAllUsers`, `useAdminRemoveUser`, `useAdminSuspendUser`, `useAdminApplyCooldown`, `useAdminRemovePost`, `useAdminGetFlaggedPosts`, and `useAdminGetEmotionalAlerts`

**User-visible outcome:** Admins can view and manage all users, remove flagged posts, and monitor emotionally at-risk users from a dedicated dashboard, with confirmation dialogs protecting destructive actions.
