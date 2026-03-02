# Specification

## Summary
**Goal:** Enforce post visibility rules so that private posts are only visible to their author, public posts appear in chronological order in the community feed, and no resharing or link-sharing functionality exists anywhere in the app.

**Planned changes:**
- Backend: Filter out private posts from all community feed/public post queries; only the authenticated author can retrieve their own private posts (e.g., via `getMyPosts`)
- Backend: A non-author caller cannot retrieve a specific private post by ID
- Backend: Ensure community feed returns public posts sorted consistently by creation timestamp
- Backend: Remove any resharing or shareable link generation methods if they exist
- Frontend: Update `CommunityFeedPage` to display only public posts in chronological order
- Frontend: Remove any share, copy link, or reshare buttons from `PublicPostCard` and any other feed-related components
- Frontend: Update `MyPostsPage` and `PostCard` to display a visibility label/badge (private or public) on each post
- Frontend: Ensure no share or copy-link controls appear on post cards in `MyPostsPage`

**User-visible outcome:** Private posts never appear in the community feed for any user; public posts are shown in chronological order with no sharing controls; users viewing their own posts see a clear private/public label on each post card.
