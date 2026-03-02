# Specification

## Summary
**Goal:** Enforce a strict chronological, public-only home feed in the Veil app with no ranking, metrics, or discovery sections.

**Planned changes:**
- Update the backend feed query (`getPublicPosts` or equivalent) to return only posts with public visibility, sorted strictly by `createdAt` descending, with no ranking score or engagement weighting applied
- Update `CommunityFeedPage` to display posts exactly as returned from the backend (no client-side re-sorting or ranking)
- Remove any explore, suggested posts, or trending sections from `CommunityFeedPage`
- Remove engagement metrics (reaction counts, comment counts, view counts) from `PublicPostCard` within the feed

**User-visible outcome:** The community feed shows only public posts in pure chronological order (newest first), with no algorithmic ranking, no engagement metrics on cards, and no explore or suggested post sections.
