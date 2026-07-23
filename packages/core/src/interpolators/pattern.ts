import {
    isPatternString,
    parsePattern,
    serializePattern,
} from '../pattern';

import type {
    Pattern,
} from '../pattern';

import {
    interpolateColor,
} from './color';

import {
    interpolateNumber,
} from './number';

import type {
    InterpolatorFactory,
} from './types';

// Patterns interpolate only when their tile motifs match; a diagonal tile cannot morph into dots,
// so mismatched types fall back to a discrete swap, mirroring how gradients handle mismatched types.
function canInterpolatePatterns(patternA: Pattern, patternB: Pattern): boolean {
    return patternA.type === patternB.type;
}

/** Interpolator factory that transitions between two `pattern(...)` paint strings sharing a tile type by interpolating their foreground/background colors and tile size. */
export const interpolatePattern: InterpolatorFactory<string> = (valueA, valueB) => {
    const patternA = parsePattern(valueA);
    const patternB = parsePattern(valueB);

    if (!(patternA && patternB)) {
        return position => position > 0.5 ? valueB : valueA;
    }

    if (!canInterpolatePatterns(patternA, patternB)) {
        return position => position > 0.5 ? valueB : valueA;
    }

    const foregroundInterpolator = interpolateColor(patternA.foreground, patternB.foreground);
    const backgroundInterpolator = interpolateColor(patternA.background, patternB.background);
    const sizeInterpolator = interpolateNumber(patternA.size, patternB.size);

    return position => serializePattern({
        type: patternA.type,
        foreground: foregroundInterpolator(position),
        background: backgroundInterpolator(position),
        size: sizeInterpolator(position),
    });
};

/** Reports whether this factory can interpolate the given value (a `pattern(...)` paint string). */
interpolatePattern.test = value => typeof value === 'string' && isPatternString(value);
