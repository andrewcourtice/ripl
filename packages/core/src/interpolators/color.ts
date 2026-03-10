import {
    getColorParser,
    serialiseRGBA,
} from '../color';

import {
    interpolateNumber,
} from './number';

import {
    typeIsString,
} from '@ripl/utilities';

import type {
    InterpolatorFactory,
} from './types';

/** Interpolator factory that smoothly transitions between two CSS color strings by interpolating their RGBA channels. */
export const interpolateColor: InterpolatorFactory<string> = (valueA, valueB) => {
    const parserA = getColorParser(valueA);
    const parserB = getColorParser(valueB);

    if (!(parserA && parserB)) {
        return position => position > 0.5 ? valueB : valueA;
    }

    const rgbaA = parserA.parse(valueA);
    const rgbaB = parserB.parse(valueB);

    const interpolators = rgbaA.map((value, index) => {
        return interpolateNumber(value, rgbaB[index]);
    });

    return position => serialiseRGBA(
        interpolators[0](position),
        interpolators[1](position),
        interpolators[2](position),
        interpolators[3](position)
    );
};

interpolateColor.test = value => typeIsString(value) && !!getColorParser(value);