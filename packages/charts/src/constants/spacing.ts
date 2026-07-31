/**
 * The chart spacing scale.
 *
 * Every gap between chart elements comes from this scale rather than a locally-chosen number, so
 * spacing stays consistent as components are combined. It is an 8-point rhythm with a 4px half-step
 * reserved for gaps *inside* a single component, where a full step would read as separation.
 */
export const SPACING = {
    /** No gap. */
    none: 0,
    /** 4px — half-step, only for gaps within a single component (e.g. a legend swatch and its label). */
    xs: 4,
    /** 8px — adjacent chart bands (title to legend, legend to plot) and two stacked axis bands. */
    sm: 8,
    /** 16px — the chart's own padding, and the gap between an axis title and its tick labels. */
    md: 16,
    /** 24px — generous separation. */
    lg: 24,
    /** 32px — maximum separation. */
    xl: 32,
} as const;

/** A step on the {@link SPACING} scale. */
export type SpacingStep = keyof typeof SPACING;
