import type {
    ColorSpace,
} from './types';

//const RGB_FRAGMENT = Array.from({ length: 3 }, () => '(0|255|25[0-4]|2[0-4]\\d|1\\d\\d|0?\\d?\\d)').join(',\\s*');

export const PATTERNS = {
    hex: /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})?$/i,
    rgb: /^rgb\((\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?)\)$/i,
    rgba: /^rgba\((\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?),\s*(1|0?\.\d+|\d{1,3}%)\)$/i,
} as Record<ColorSpace, RegExp>;