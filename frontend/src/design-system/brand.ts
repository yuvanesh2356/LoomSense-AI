/**
 * Brand & Design System — single source of truth.
 *
 * NAME DECISION PENDING: change APP_NAME here (and nowhere else) once the
 * team finalizes it. Every screen reads from this constant, so swapping
 * "Vastrayan" for "WeaverOS" or any other name is a one-line change.
 */
export const APP_NAME = "LoomSense AI";
export const APP_TAGLINE = "Weaving Intelligence into Every Thread.";
export const APP_TAGLINE_ALT = "India's Digital Mission for the Handloom Weaver.";
export const APP_VERSION = "1.0.0-phase12";

// --- Color tokens (mirrors tailwind.config.js `theme.extend.colors`) --------
// Kept as plain hex constants too, because chart libraries (Recharts) and
// inline SVG need raw hex strings, not Tailwind class names.
export const COLORS = {
  emeraldDeep: "#0B4F3C",
  emeraldBright: "#1C7A5A",
  gold: "#C9A24B",
  ivory: "#FBF8F1",
  warmWhite: "#FFFFFF",
  darkGreen: "#06251C",
  charcoalText: "#22281F",

  // Legacy palette — still used by existing Dashboard/Forecast/Income pages
  // and left untouched so those screens keep rendering correctly until
  // their own redesign phase.
  legacyIndigo: "#2B3A67",
  legacyGold: "#E8A33D",
  legacyMadder: "#A63A50",
  legacyCotton: "#FBF7F0",
};

export const FONTS = {
  display: "'Fraunces', Cambria, Georgia, serif",
  body: "'Inter', Calibri, Arial, sans-serif",
};
