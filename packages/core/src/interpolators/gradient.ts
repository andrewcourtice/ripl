import {
    isGradientString,
    parseGradient,
    serialiseGradient,
} from '../gradient';

import {
    interpolateColor,
} from './color';

import {
    interpolateNumber,
} from './number';

import type {
    Gradient,
    GradientColorStop,
} from '../gradient';

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

function interpolateMatchingGradients(gradientA: Gradient, gradientB: Gradient) {
    const stopsInterpolator = interpolateStops(gradientA.stops, gradientB.stops);

    if (gradientA.type === 'linear' && gradientB.type === 'linear') {
        const angleInterpolator = interpolateNumber(gradientA.angle, gradientB.angle);

        return (position: number): Gradient => ({
            type: 'linear',
            repeating: gradientA.repeating,
            angle: angleInterpolator(position),
            stops: stopsInterpolator(position),
        });
    }

    if (gradientA.type === 'radial' && gradientB.type === 'radial') {
        const posXInterpolator = interpolateNumber(gradientA.position[0], gradientB.position[0]);
        const posYInterpolator = interpolateNumber(gradientA.position[1], gradientB.position[1]);

        return (position: number): Gradient => ({
            type: 'radial',
            repeating: gradientA.repeating,
            shape: gradientA.shape,
            position: [posXInterpolator(position), posYInterpolator(position)],
            stops: stopsInterpolator(position),
        });
    }

    if (gradientA.type === 'conic' && gradientB.type === 'conic') {
        const angleInterpolator = interpolateNumber(gradientA.angle, gradientB.angle);
        const posXInterpolator = interpolateNumber(gradientA.position[0], gradientB.position[0]);
        const posYInterpolator = interpolateNumber(gradientA.position[1], gradientB.position[1]);

        return (position: number): Gradient => ({
            type: 'conic',
            repeating: gradientA.repeating,
            angle: angleInterpolator(position),
            position: [posXInterpolator(position), posYInterpolator(position)],
            stops: stopsInterpolator(position),
        });
    }

    // Fallback (should not reach here if canInterpolateGradients is correct)
    return (position: number) => position > 0.5 ? gradientB : gradientA;
}

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

interpolateGradient.test = value => typeof value === 'string' && isGradientString(value);
