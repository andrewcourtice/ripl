import {
    typeIsNumber,
    typeIsString,
} from '@ripl/utilities';

import {
    interpolateNumber,
} from './number';

import type {
    InterpolatorFactory,
} from './types';

const ORIGIN_PATTERN = /^-?\d+(\.\d+)?%?$/;

export const interpolateTransformOrigin: InterpolatorFactory<number | string> = (valueA, valueB) => {
    const aIsPercent = typeIsString(valueA) && (valueA as string).trim().endsWith('%');
    const bIsPercent = typeIsString(valueB) && (valueB as string).trim().endsWith('%');
    const hasPercent = aIsPercent || bIsPercent;

    const numA = typeIsNumber(valueA) ? valueA : parseFloat(valueA as string) || 0;
    const numB = typeIsNumber(valueB) ? valueB : parseFloat(valueB as string) || 0;

    const numInterp = interpolateNumber(numA, numB);

    return position => {
        const value = numInterp(position);
        return hasPercent ? `${value}%` : value;
    };
};

interpolateTransformOrigin.test = (value: unknown) => {
    if (typeIsNumber(value)) {
        return true;
    }

    if (typeIsString(value)) {
        return ORIGIN_PATTERN.test(value.trim());
    }

    return false;
};
