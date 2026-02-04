# Specification

## Summary
**Goal:** Restore reliable vertical scrolling in the coach profile detail modal so Posts, Jobs, and Comments content isn’t clipped when it exceeds the viewport.

**Planned changes:**
- Update `frontend/src/components/CoachProfileDetailModal.tsx` layout/overflow so the modal has a bounded height (e.g., `max-h-[90vh]`) and a dedicated `overflow-y-auto` scroll region for the tab content.
- Ensure the modal scroll behavior works consistently on desktop (wheel/trackpad) and mobile (swipe), avoiding “stuck” scrolling caused by nested overflow/height issues.
- Verify the change does not require edits to any `frontend/src/components/ui/*` files and does not break existing scrolling behavior in other dialogs (e.g., Job Board dialogs).

**User-visible outcome:** When viewing another coach’s profile, users can scroll through long Posts, Jobs, and Comments lists inside the modal without content being cut off.
