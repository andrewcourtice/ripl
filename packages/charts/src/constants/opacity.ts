/**
 * Shared mark opacities.
 *
 * A chart whose marks need a different rest tint declares its own named constant beside the mark it
 * applies to, rather than redefining these — a `REST_ALPHA` that means 0.7 in one file and 0.25 in
 * the next is the thing this module exists to prevent.
 */

/** The opacity a mark's fill carries at rest, so hovering it reads as that mark coming to full. */
export const REST_ALPHA = 0.7;
