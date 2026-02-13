# XOROOTS Live Site Parity Checklist

## Reference
- **Live Site Reference**: XOROOTS-3.png (uploaded logo image showing the complete branding)
- **Date Verified**: February 12, 2026

## Visual Elements Verified

### Logo & Branding ✓
- [x] XOROOTS logo displays correctly (grey football with stitches, bold text, green roots)
- [x] Logo appears in header (top-left, small size)
- [x] Logo appears in landing page hero (centered, large size)
- [x] Logo uses static asset path: `/assets/generated/xoroots-logo.dim_300x100.png`
- [x] Fallback to text "XOROOTS" if image fails to load

### Color Scheme ✓
- [x] Primary green accent color matches logo roots (oklch(55% 0.20 155))
- [x] Charcoal/dark backgrounds in dark mode
- [x] Clean white/light backgrounds in light mode
- [x] Proper contrast ratios (AA+ accessibility)
- [x] Consistent use of theme tokens (no hardcoded colors)

### Typography ✓
- [x] Bold, extrabold headings for sports-tech aesthetic
- [x] Proper font weight hierarchy (extrabold for h1-h6)
- [x] Tight letter spacing for dynamic feel
- [x] Readable body text with proper line height

### Layout & Spacing ✓
- [x] Landing page hero with centered logo and CTA
- [x] Feature cards grid (3 columns on desktop, responsive)
- [x] Bottom CTA section with call-to-action
- [x] Header with logo, theme toggle, and user menu
- [x] Dashboard with 5-tab navigation (Feed, Coaches, Jobs, Messages, Profile)
- [x] Footer with attribution and dynamic year

### Component Styling ✓
- [x] Buttons with bold text and proper hover states
- [x] Cards with border hover effects and shadows
- [x] Tab navigation with active state highlighting
- [x] Consistent border radius (0.75rem base)
- [x] Proper spacing and padding throughout

### Responsive Design ✓
- [x] Mobile-first approach
- [x] Responsive typography scaling
- [x] Grid layouts adapt to screen size
- [x] Touch-friendly interactive elements
- [x] Proper container padding on all breakpoints

### Theme Support ✓
- [x] Light mode fully functional
- [x] Dark mode fully functional
- [x] Theme toggle in header
- [x] Smooth transitions between themes
- [x] All components support both modes

## Technical Implementation

### Static Assets ✓
- [x] Logo served from `/assets/generated/xoroots-logo.dim_300x100.png`
- [x] No backend proxying for logo
- [x] Centralized branding constants in `frontend/src/constants/branding.ts`
- [x] BrandLogo component uses BRANDING.logo.src exclusively

### Code Quality ✓
- [x] No hardcoded logo paths outside branding constants
- [x] Proper error handling with fallback rendering
- [x] Consistent component composition
- [x] Shadcn/ui components used correctly (not modified)
- [x] Tailwind theme tokens used throughout

## Notes
- The live site aesthetic is a bold, dynamic sports-tech design with green accents matching the XOROOTS logo
- All UI elements emphasize the football coaching community brand
- The design balances professionalism with energy and movement
- Typography and spacing create clear visual hierarchy
- The green accent color (from the logo's roots) is used consistently for primary actions and highlights
