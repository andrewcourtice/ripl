import {
    getColorParser,
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

export const interpolateColor: InterpolatorFactory<string> = (colorA, colorB) => {
    const parserA = getColorParser(colorA);
    const parserB = getColorParser(colorB);

    if (!(parserA && parserB)) {
        return position => position > 0.5 ? colorB : colorA;
    }

    const rgbaA = parserA.parse(colorA);
    const rgbaB = parserB.parse(colorB);

    const interpolators = rgbaA.map((value, index) => {
        return interpolateNumber(value, rgbaB[index]);
    });

    return position => parserB.serialise(
        interpolators[0](position),
        interpolators[1](position),
        interpolators[2](position),
        interpolators[3](position)
    );
};

interpolateColor.test = value => typeIsString(value) && !!getColorParser(value);