/**
 * Continuous color-scale utilities for the MedWatch heatmap.
 *
 * Color ramp (5 stops, "classic risk-matrix"):
 *   green -> light-green -> pale-yellow -> orange -> red
 *
 * The ramp aligns with the existing palette semantics:
 *   - low values = safe (sage/green)
 *   - mid values = warn (amber)
 *   - high values = critical (terracotta red)
 *
 * Uses d3-scale + d3-interpolate which are already in package.json.
 */
import { scaleLinear } from "d3-scale";
import { interpolateRgbBasis, piecewise, interpolateRgb } from "d3-interpolate";

/** 5-stop classic risk-matrix ramp. */
export const RISK_RAMP: readonly string[] = [
  "#1A9850", // strong green   - lowest
  "#A6D96A", // light green
  "#FFFFBF", // pale yellow    - middle
  "#FDAE61", // orange
  "#D7191C", // strong red     - highest
] as const;

/**
 * Build a continuous color function mapping value -> hex color in the ramp.
 * Domain is [min, max]. Zero falls at the lightest tint of the ramp (the
 * green end) so even empty cells are colored, satisfying the "no blank
 * cells where data exists" acceptance criterion.
 */
export function buildColorScale(min: number, max: number) {
  // Guard: if all values are identical, fall back to the lightest stop.
  if (max <= min) {
    return (_v: number) => RISK_RAMP[0];
  }
  const interpolator = piecewise(interpolateRgb, RISK_RAMP as string[]);
  const scale = scaleLinear<number, number>().domain([min, max]).range([0, 1]).clamp(true);
  return (v: number) => interpolator(scale(v));
}

/**
 * Parse a CSS color string ("#RRGGBB" or "rgb(r, g, b)") into sRGB [0..255]
 * components. Returns null if parsing fails.
 */
function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const trimmed = color.trim();
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    return null;
  }
  const m = trimmed.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

/**
 * Compute the WCAG relative luminance of a sRGB color.
 * Returns a number in [0..1], higher means brighter.
 */
export function relativeLuminance(color: string): number {
  const rgb = parseRgb(color);
  if (!rgb) return 0.5;
  const channel = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const r = channel(rgb.r);
  const g = channel(rgb.g);
  const b = channel(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Choose a readable text color (black or white) given the cell background
 * color, using relative luminance. Threshold 0.55 is a touch above the
 * mathematical midpoint to favour black on amber and pale yellow tints,
 * which are common in this ramp.
 */
export function getContrastingTextColor(bg: string): string {
  return relativeLuminance(bg) > 0.55 ? "#1A1815" : "#FFFFFF";
}

/**
 * Build evenly-spaced gradient stops for a CSS linear-gradient legend.
 * Mirrors the RISK_RAMP exactly so the swatch on screen matches the cells.
 */
export function buildGradientCss(): string {
  const stops = RISK_RAMP.map(
    (c, i) => `${c} ${(i / (RISK_RAMP.length - 1)) * 100}%`
  ).join(", ");
  return `linear-gradient(90deg, ${stops})`;
}

/**
 * Convenience: return the color at the lightest end of the ramp, used for
 * empty/zero cells.
 */
export function colorForZero(): string {
  return RISK_RAMP[0];
}

/**
 * Build a continuous interpolator (0..1 -> color) that can be sampled
 * independently of a domain. Useful for drawing the legend.
 */
export function rampInterpolator(): (t: number) => string {
  return piecewise(interpolateRgb, RISK_RAMP as string[]);
}

/**
 * Note about d3 typing: scaleLinear with range as numbers gives a number
 * scale, ignore the unused import notice if a linter flags it. interpolateRgbBasis
 * is exported intentionally for callers that prefer a smoother basis spline.
 */
export { interpolateRgbBasis };
