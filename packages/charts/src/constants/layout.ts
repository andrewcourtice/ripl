import {
    SPACING,
} from './spacing';

/** Default space, in pixels, reserved around every chart when its `padding` option is unset. */
export const DEFAULT_CHART_PADDING = SPACING.md;

/** Gap, in pixels, inserted between two adjacent reserved bands (title, legend, navigator, plot). */
export const ELEMENT_GAP = SPACING.sm;

/** Gap, in pixels, between two same-side axis bands stacked outward from the plot. */
export const AXIS_STACK_GAP = SPACING.sm;

/**
 * Tolerance, in pixels, below which two layout measurements are treated as equal. Bounds the
 * outside-in layout iteration so sub-pixel jitter in text metrics cannot keep it spinning.
 */
export const LAYOUT_EPSILON = 0.5;
