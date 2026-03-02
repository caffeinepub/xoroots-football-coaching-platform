# Specification

## Summary
**Goal:** Use the full-color XOROOTS logo in the header while using a subtle watermark-style XOROOTS logo for the authenticated scrolling background.

**Planned changes:**
- Ensure the full-color XOROOTS logo is available as a static asset at `/assets/generated/xoroots-logo.dim_300x100.png` so `BrandLogo` renders the image via `BRANDING.logo.src`.
- Add a second static asset at `/assets/generated/xoroots-logo-watermark.dim_300x100.png` and switch the authenticated scrolling background to use this watermark variant (keeping the header logo unchanged).
- Adjust authenticated scrolling background styling so the watermark stays subtle and readable in both light and dark themes, remains behind content, and does not capture pointer events; keep it authenticated-pages-only.

**User-visible outcome:** Logged-in pages show the same scrolling XOROOTS background effect but with a subtle watermark logo behind content, while the header continues to display the full-color XOROOTS logo.
