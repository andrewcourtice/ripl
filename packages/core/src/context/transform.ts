import {
    degreesToRadians,
} from '../math';

import type {
    Rotation,
    TransformOrigin,
} from './types';

import {
    typeIsNumber,
} from '@ripl/utilities';

/** Resolves a rotation value (number, degrees string, or radians string) to radians. */
export function resolveRotation(value: Rotation): number {
    if (typeIsNumber(value)) {
        return value;
    }

    const trimmed = value.trim();

    if (trimmed.endsWith('deg')) {
        return degreesToRadians(parseFloat(trimmed));
    }

    if (trimmed.endsWith('rad')) {
        return parseFloat(trimmed);
    }

    return parseFloat(trimmed) || 0;
}

/** Resolves a transform-origin value (number or percentage string) to a pixel offset relative to the given dimension. */
export function resolveTransformOrigin(value: TransformOrigin, dimension: number): number {
    if (typeIsNumber(value)) {
        return value;
    }

    const trimmed = value.trim();

    if (trimmed.endsWith('%')) {
        return (parseFloat(trimmed) / 100) * dimension;
    }

    return parseFloat(trimmed) || 0;
}
