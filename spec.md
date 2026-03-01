# Specification

## Summary
**Goal:** Fix the signup flow to guard against invalid or anonymous principals before account creation, preventing RTS errors on the backend.

**Planned changes:**
- In `SignupPage.tsx`, add a guard before calling `createUser()` that checks whether the authenticated principal exists and is not anonymous; if invalid, display an error message ("Authentication required. Please log in before creating an account.") and abort the flow.
- In `SignupPage.tsx`, disable the Create Account button until identity initialization completes and a valid non-anonymous principal is confirmed.
- In the backend `main.mo` `createUser()` function, add an entry-point guard that returns an error variant if the caller is the anonymous principal, preventing any RTS trap from occurring.

**User-visible outcome:** Users attempting to create an account without a valid authenticated identity will see a clear error message and the Create Account button will remain disabled. Once properly authenticated, the signup flow proceeds normally without any backend RTS errors.
