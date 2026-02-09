# Specification

## Summary
**Goal:** Render post attachments inline with built-in viewers for videos and PDFs, using direct blob URLs.

**Planned changes:**
- Update attachment rendering in the social feed so video attachments display as a responsive inline `<video>` player with controls, sourced from `attachment.blob.getDirectURL()`.
- Update attachment rendering in the social feed so PDF attachments display inline (e.g., via `<iframe>`/`<embed>`) sourced from `attachment.blob.getDirectURL()`, with a fallback action to open in a new tab if inline viewing fails.
- Apply the same inline viewer behavior anywhere attachments are previewed/rendered (including `EditPostModal`), while keeping current behavior for images and other file types.

**User-visible outcome:** Videos and PDFs attached to posts can be viewed directly inside the feed and edit-post previews, without downloading first; other attachment types continue to show the existing link/download UI.
