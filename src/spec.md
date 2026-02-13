# Specification

## Summary
**Goal:** Update authenticated pages to consistently show the XOROOTS logo in the top-left header area and add a subtle, transparent, continuously scrolling XOROOTS logo watermark background behind dashboard content (authenticated-only).

**Planned changes:**
- Ensure the shared authenticated `<Header />` layout anchors the existing `BrandLogo` to the far left of the header content area across mobile and desktop breakpoints (no centering shifts).
- Implement an authenticated-only background layer behind dashboard content that repeats the XOROOTS logo with low opacity and continuously scrolls/loops seamlessly.
- Wire both the header logo and the authenticated scrolling background to the same centralized logo source (e.g., `BRANDING.logo.src` used by `BrandLogo`) and serve it from static frontend assets.

**User-visible outcome:** When logged in, users see the XOROOTS logo fixed at the top-left in the header on all dashboard pages, and a subtle animated repeating XOROOTS watermark background behind the UI; when logged out, the landing page remains unchanged and has no scrolling watermark background.
