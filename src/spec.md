# Specification

## Summary
**Goal:** Fix attachment rendering so images display inline in the live feed (and all other places attachments are shown), while non-image files open via an external link.

**Planned changes:**
- Update attachment rendering to detect image files by MIME type and, when missing/unknown, by filename extension (.jpg, .jpeg, .png, .gif, .webp) and render them inline using an `<img>` preview.
- Change non-image attachment handling (PDF, video, and other types) to show an “Open”/“Download” action that opens the direct attachment URL in a new tab (`target="_blank"` with `rel="noopener noreferrer"`), without inline media previews.
- Apply the updated behavior consistently anywhere `PostAttachmentRenderer` is used (e.g., SocialFeed posts, coach profile post lists, edit post modal previews).

**User-visible outcome:** Image attachments appear directly in the feed as inline previews, while PDFs/videos/other files show an external open/download link that opens in a new browser tab.
