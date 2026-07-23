import {
    scaleContinuous,
} from '../scales';

import {
    interpolateColor,
} from '../interpolators';

import {
    numberClamp,
    typeIsArray,
} from '@ripl/utilities';

/** A function mapping a normalized position (0–1) to a CSS color string. */
export type ColorInterpolator = (position: number) => string;

/** Either a ready-made color interpolator or an array of color stops to interpolate between. */
export type ColorInterpolatorInput = ColorInterpolator | string[];

/** A callable color scale mapping a numeric value to a CSS color, with domain and tick access. */
export interface ColorScale {
    /** Maps a numeric value from the domain to its corresponding CSS color. */
    (value: number): string;
    /** The numeric input domain the scale maps from. */
    domain: number[];
    /** Generates approximately `count` representative tick values across the domain. */
    ticks(count?: number): number[];
    /** The underlying position (0–1) → color interpolator, e.g. for rendering a legend gradient. */
    interpolator: ColorInterpolator;
}

/** A continuous scale mapping normalized values (0–1) to the RGB channel range (0–255) with clamping. */
export const scaleRGB = scaleContinuous([0, 1], [0, 255], {
    clamp: true,
});

/**
 * Builds a color interpolator from an array of color stops. Position 0 returns the first stop, 1
 * the last, and intermediate positions interpolate (RGBA, channel-wise) between adjacent stops.
 */
export function interpolateColors(colors: string[]): ColorInterpolator {
    if (!colors.length) {
        return () => '#000000';
    }

    if (colors.length === 1) {
        return () => colors[0];
    }

    const segments = colors.length - 1;
    const interpolators = colors.slice(0, -1).map((color, index) => interpolateColor(color, colors[index + 1]));

    return position => {
        const scaled = numberClamp(position, 0, 1) * segments;
        const index = Math.min(Math.floor(scaled), segments - 1);

        return interpolators[index](scaled - index);
    };
}

function resolveInterpolator(input: ColorInterpolatorInput): ColorInterpolator {
    return typeIsArray(input) ? interpolateColors(input) : input;
}

function createColorScale(interpolate: ColorInterpolator, domain: number[], position: (value: number) => number, ticks: (count?: number) => number[]): ColorScale {
    const scale = ((value: number) => interpolate(position(value))) as ColorScale;

    scale.domain = domain;
    scale.interpolator = interpolate;
    scale.ticks = ticks;

    return scale;
}

/**
 * Creates a color scale mapping a numeric `domain` through a color interpolator (or array of stops,
 * e.g. one of the built-in `COLOR_SCHEME_*` palettes). Values are clamped to the domain.
 *
 * - **Sequential** — a two-element domain `[min, max]` maps linearly across the whole interpolator.
 * - **Diverging** — a three-element domain `[min, neutral, max]` maps `neutral` to the interpolator's
 *   midpoint, so signed data reads symmetrically around a reference value.
 *
 * Tick generation defers to an underlying continuous scale; formatting is left to the caller and is
 * never bound to the scale.
 */
export function scaleSequential(interpolator: ColorInterpolatorInput, domain: number[] = [0, 1]): ColorScale {
    const interpolate = resolveInterpolator(interpolator);

    if (domain.length > 2) {
        const [
            min,
            neutral,
            max,
        ] = domain;

        const lower = scaleContinuous([min, neutral], [0, 0.5], {
            clamp: true,
        });
        const upper = scaleContinuous([neutral, max], [0.5, 1], {
            clamp: true,
        });

        return createColorScale(
            interpolate,
            domain,
            value => value < neutral ? lower(value) : upper(value),
            (count?: number) => scaleContinuous([min, max], [0, 1]).ticks(count)
        );
    }

    const position = scaleContinuous(domain, [0, 1], {
        clamp: true,
    });

    return createColorScale(interpolate, domain, position, (count?: number) => position.ticks(count));
}
