import type {
    ConicGradient,
    Gradient,
    GradientColorStop,
    LinearGradient,
    RadialGradient,
} from './types';

import {
    arrayMap,
} from '@ripl/utilities';

function serialiseStop(stop: GradientColorStop): string {
    if (stop.offset !== undefined) {
        return `${stop.color} ${(stop.offset * 100).toFixed(2)}%`;
    }

    return stop.color;
}

function serialiseStops(stops: GradientColorStop[]): string {
    return arrayMap(stops, serialiseStop).join(', ');
}

function serialiseLinearGradient(gradient: LinearGradient): string {
    const prefix = gradient.repeating ? 'repeating-' : '';
    const parts: string[] = [];

    if (gradient.angle !== 180) {
        parts.push(`${gradient.angle}deg`);
    }

    parts.push(serialiseStops(gradient.stops));

    return `${prefix}linear-gradient(${parts.join(', ')})`;
}

function serialiseRadialGradient(gradient: RadialGradient): string {
    const prefix = gradient.repeating ? 'repeating-' : '';
    const parts: string[] = [];

    const hasNonDefaultShape = gradient.shape !== 'ellipse';
    const hasNonDefaultPosition = gradient.position[0] !== 50 || gradient.position[1] !== 50;

    if (hasNonDefaultShape || hasNonDefaultPosition) {
        let descriptor = gradient.shape;

        if (hasNonDefaultPosition) {
            descriptor += ` at ${gradient.position[0]}% ${gradient.position[1]}%`;
        }

        parts.push(descriptor);
    }

    parts.push(serialiseStops(gradient.stops));

    return `${prefix}radial-gradient(${parts.join(', ')})`;
}

function serialiseConicGradient(gradient: ConicGradient): string {
    const prefix = gradient.repeating ? 'repeating-' : '';
    const parts: string[] = [];

    const hasNonDefaultAngle = gradient.angle !== 0;
    const hasNonDefaultPosition = gradient.position[0] !== 50 || gradient.position[1] !== 50;

    if (hasNonDefaultAngle || hasNonDefaultPosition) {
        let descriptor = '';

        if (hasNonDefaultAngle) {
            descriptor += `from ${gradient.angle}deg`;
        }

        if (hasNonDefaultPosition) {
            descriptor += ` at ${gradient.position[0]}% ${gradient.position[1]}%`;
        }

        parts.push(descriptor.trim());
    }

    parts.push(serialiseStops(gradient.stops));

    return `${prefix}conic-gradient(${parts.join(', ')})`;
}

export function serialiseGradient(gradient: Gradient): string {
    switch (gradient.type) {
        case 'linear': return serialiseLinearGradient(gradient);
        case 'radial': return serialiseRadialGradient(gradient);
        case 'conic': return serialiseConicGradient(gradient);
    }
}
