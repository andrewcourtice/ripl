import type {
    ColorSpace,
} from './types';

/** Validation patterns for each supported color space, keyed by {@link ColorSpace}. */
export const PATTERNS = {
    // Full 6/8-digit branch first, then the 3/4-digit shorthand, so `#f00` resolves to a colour.
    // The `#` is required, as CSS requires it: without it any string of hex digits is a colour, so
    // a plain number like `136` parses as `#136` and interpolates as one.
    hex: /^#(?:([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})?|([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])?)$/i,
    // Fractional channels are legal CSS and are what an interpolator produces, so accept them.
    rgb: /^rgb\((\d{1,3}(?:\.\d+)?%?),\s*(\d{1,3}(?:\.\d+)?%?),\s*(\d{1,3}(?:\.\d+)?%?)\)$/i,
    rgba: /^rgba\((\d{1,3}(?:\.\d+)?%?),\s*(\d{1,3}(?:\.\d+)?%?),\s*(\d{1,3}(?:\.\d+)?%?),\s*(0|1|0?\.\d+|\d{1,3}(?:\.\d+)?%)\)$/i,
    hsl: /^hsl\((\d{1,3}),\s*(\d{1,3}%),\s*(\d{1,3}%)\)$/i,
    hsla: /^hsla\((\d{1,3}),\s*(\d{1,3}%),\s*(\d{1,3}%),\s*(0|1|0?\.\d+|\d{1,3}%)\)$/i,
    hsv: /^hsv\((\d{1,3}),\s*(\d{1,3}%),\s*(\d{1,3}%)\)$/i,
    hsva: /^hsva\((\d{1,3}),\s*(\d{1,3}%),\s*(\d{1,3}%),\s*(0|1|0?\.\d+|\d{1,3}%)\)$/i,
} as Record<ColorSpace, RegExp>;