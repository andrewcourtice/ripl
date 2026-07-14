import {
    isGradientString,
    parseGradient,
    serialiseGradient,
} from '../gradient';

import type {
    ConicGradient,
    Gradient,
    GradientColorStop,
    GradientType,
    LinearGradient,
    RadialGradient,
} from '../gradient';

import {
    interpolateColor,
} from './color';

import {
    interpolateNumber,
} from './number';

import type {
    InterpolatorFactory,
} from './types';

function canInterpolateGradients(gradientA: Gradient, gradientB: Gradient): boolean {
    if (gradientA.type !== gradientB.type) {
        return false;
    }

    if (gradientA.repeating !== gradientB.repeating) {
        return false;
    }

    if (gradientA.stops.length !== gradientB.stops.length) {
        return false;
    }

    if (gradientA.type === 'radial' && gradientB.type === 'radial') {
        if (gradientA.shape !== gradientB.shape) {
            return false;
        }
    }

    return true;
}

function interpolateStops(stopsA: GradientColorStop[], stopsB: GradientColorStop[]) {
    const interpolators = stopsA.map((stopA, index) => {
        const stopB = stopsB[index];

        return {
            color: interpolateColor(stopA.color, stopB.color),
            offset: interpolateNumber(stopA.offset ?? 0, stopB.offset ?? 0),
        };
    });

    return (position: number): GradientColorStop[] => interpolators.map(({ color, offset }) => ({
        color: color(position),
        offset: offset(position),
    }));
}

type StopsInterpolator = (position: number) => GradientColorStop[];
type GradientInterpolator = (position: number) => Gradient;

/**
 * Builds a per-type interpolator between two same-type gradients. Callers guarantee both gradients
 * share a type (via {@link canInterpolateGradients}), so narrowing casts here are safe.
 */
const GRADIENT_INTERPOLATORS: Record<GradientType, (gradientA: Gradient, gradientB: Gradient, stops: StopsInterpolator) => GradientInterpolator> = {
    linear: (gradientA, gradientB, stops) => {
        const from = gradientA as LinearGradient;
        const to = gradientB as LinearGradient;
        const angleInterpolator = interpolateNumber(from.angle, to.angle);

        return position => ({
            type: 'linear',
            repeating: from.repeating,
            angle: angleInterpolator(position),
            stops: stops(position),
        });
    },
    radial: (gradientA, gradientB, stops) => {
        const from = gradientA as RadialGradient;
        const to = gradientB as RadialGradient;
        const posXInterpolator = interpolateNumber(from.position[0], to.position[0]);
        const posYInterpolator = interpolateNumber(from.position[1], to.position[1]);

        return position => ({
            type: 'radial',
            repeating: from.repeating,
            shape: from.shape,
            position: [posXInterpolator(position), posYInterpolator(position)],
            stops: stops(position),
        });
    },
    conic: (gradientA, gradientB, stops) => {
        const from = gradientA as ConicGradient;
        const to = gradientB as ConicGradient;
        const angleInterpolator = interpolateNumber(from.angle, to.angle);
        const posXInterpolator = interpolateNumber(from.position[0], to.position[0]);
        const posYInterpolator = interpolateNumber(from.position[1], to.position[1]);

        return position => ({
            type: 'conic',
            repeating: from.repeating,
            angle: angleInterpolator(position),
            position: [posXInterpolator(position), posYInterpolator(position)],
            stops: stops(position),
        });
    },
};

function interpolateMatchingGradients(gradientA: Gradient, gradientB: Gradient): GradientInterpolator {
    const stopsInterpolator = interpolateStops(gradientA.stops, gradientB.stops);

    return GRADIENT_INTERPOLATORS[gradientA.type](gradientA, gradientB, stopsInterpolator);
}

/** Interpolator factory that transitions between two CSS gradient strings by interpolating their stops, angles, and positions. */
export const interpolateGradient: InterpolatorFactory<string> = (valueA, valueB) => {
    const gradientA = parseGradient(valueA);
    const gradientB = parseGradient(valueB);

    if (!(gradientA && gradientB)) {
        return position => position > 0.5 ? valueB : valueA;
    }

    if (!canInterpolateGradients(gradientA, gradientB)) {
        return position => position > 0.5 ? valueB : valueA;
    }

    const gradientInterpolator = interpolateMatchingGradients(gradientA, gradientB);

    return position => serialiseGradient(gradientInterpolator(position));
};

/** Reports whether this factory can interpolate the given value (a CSS gradient string). */
interpolateGradient.test = value => typeof value === 'string' && isGradientString(value);
