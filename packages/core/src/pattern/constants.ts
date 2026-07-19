import type {
    PatternType,
} from './types';

/** The set of built-in pattern tile types accepted by `pattern(...)` paint strings. */
export const PATTERN_TYPES: readonly PatternType[] = [
    'diagonal',
    'cross-hatch',
    'dots',
    'horizontal',
    'vertical',
];

/** The default foreground color applied when a pattern string omits one. */
export const DEFAULT_PATTERN_FOREGROUND = '#000000';

/** The default background color applied when a pattern string omits one. */
export const DEFAULT_PATTERN_BACKGROUND = 'transparent';

/** The default tile size (in user-space pixels) applied when a pattern string omits one. */
export const DEFAULT_PATTERN_SIZE = 8;
