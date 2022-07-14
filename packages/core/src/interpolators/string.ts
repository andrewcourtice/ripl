import {
    interpolateNumber,
} from './number';

import type {
    Interpolator,
} from './types';

export type StringInterpolationSet = [valueA: StringInterpolatorTag, valueB: StringInterpolatorTag];
export type StringInterpolationFormatter = (value: number) => number;
export interface StringInterpolatorTag {
    fragments: TemplateStringsArray;
    args: number[];
}

function tagIntStr(fragments: TemplateStringsArray, ...args: number[]): StringInterpolatorTag {
    return {
        fragments,
        args,
    };
}

export function interpolateString(callback: (tag: typeof tagIntStr) => StringInterpolationSet, formatter?: StringInterpolationFormatter): Interpolator<string> {
    const [tagA, tagB] = callback(tagIntStr);

    if (tagA.args.length !== tagB.args.length) {
        throw new Error('Interpolation strings must have a matching number of interpolated args');
    }

    const format = formatter || (value => value);
    const interpolators = tagA.args.map((arg, index) => interpolateNumber(arg, tagB.args[index]));

    return position => tagA.fragments.reduce((input, fragment, index) => {
        const output = input + fragment;
        const interpolator = interpolators[index];

        return output + format(interpolator(position));
    }, '');
}