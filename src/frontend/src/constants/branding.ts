/**
 * Centralized branding constants for XOROOTS application.
 * This ensures consistent branding across all components and prevents
 * accidental logo changes during rebuilds.
 */

export const BRANDING = {
  logo: {
    src: '/assets/generated/xoroots-logo.dim_300x100.png',
    alt: 'XOROOTS',
  },
  appName: 'XOROOTS',
} as const;
