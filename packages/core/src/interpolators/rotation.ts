import {
    typeIsNumber,
    typeIsString,
} from '@ripl/utilities';

import {
    degreesToRadians,
    radiansToDegrees,
} from '../math';

import {
    interpolateNumber,
} from './number';

import type {
    InterpolatorFactory,
} from './types';

const ROTATION_PATTERN = /^-?\d+(\.\d+)?\s*(deg|rad)?$/;

function toRadians(value: number | string): number {
    if (typeIsNumber(value)) {
        return value;
    }

    const trimmed = (value as string).trim();

    if (trimmed.endsWith('deg')) {
        return degreesToRadians(parseFloat(trimmed));
    }

    if (trimmed.endsWith('rad')) {
        return parseFloat(trimmed);
    }

    return parseFloat(trimmed) || 0;
}

export const interpolateRotation: InterpolatorFactory<number | string> = (valueA, valueB) => {
    const radA = toRadians(valueA);
    const radB = toRadians(valueB);
    const numInterp = interpolateNumber(radA, radB);

    const bIsString = typeIsString(valueB);
    const bUnit = bIsString ? (valueB as string).trim().replace(/^-?\d+(\.\d+)?\s*/, '') : '';

    return position => {
        const radians = numInterp(position);

        if (!bIsString) {
            return radians;
        }

        if (bUnit === 'deg') {
            return `${radiansToDegrees(radians)}deg`;
        }

        if (bUnit === 'rad') {
            return `${radians}rad`;
        }

        return radians;
    };
};

interpolateRotation.test = (value: unknown) => {
    if (typeIsNumber(value)) {
        return true;
    }

    if (typeIsString(value)) {
        return ROTATION_PATTERN.test(value.trim());
    }

    return false;
};
