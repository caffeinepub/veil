# Specification

## Summary
**Goal:** Replace the existing emoji reaction system with an emotion-type-specific text reaction system — no emojis, no counts, one reaction per user per post.

**Planned changes:**
- Add a `reactions` table to the backend with fields: id, postId, userId, reactionText, createdAt; enforce one reaction per user per post
- Expose `addReaction(postId, reactionText)` and `getReactionsForPost(postId)` backend functions; no aggregate counts returned
- Add `useAddReaction` mutation hook and `usePostReactions` query hook in `useQueries.ts`
- Replace emoji reaction UI in `PublicPostCard.tsx` with text-only reaction buttons based on the post's emotionType:
  - HAPPY → 4 HAPPY-specific phrases
  - CONFESS → 4 CONFESS-specific phrases
  - BROKE → 4 BROKE-specific phrases
- If the user has already reacted, highlight their chosen reaction softly and deactivate other options
- Hide reaction buttons entirely for post owners viewing their own posts

**User-visible outcome:** Users can respond to posts with emotion-appropriate text phrases instead of emojis. No counts or numbers are shown anywhere. Each user can react once per post, with soft visual confirmation of their chosen reaction.
