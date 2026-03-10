import {
    interpolateNumber,
} from './number';


import type {
    Interpolator,
} from './types';

/** A pair of tagged template results representing the start and end states for string interpolation. */
export type StringInterpolationSet = [valueA: StringInterpolatorTag, valueB: StringInterpolatorTag];

/** Optional formatter applied to each interpolated numeric value before insertion into the output string. */
export type StringInterpolationFormatter = (value: number) => number;

/** A tagged template result capturing the static fragments and dynamic numeric arguments. */
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

/** Creates a string interpolator by interpolating between numeric values embedded in tagged template literals. */
export function interpolateString(callback: (tag: typeof tagIntStr) => StringInterpolationSet, formatter?: StringInterpolationFormatter): Interpolator<string> {
    const [tagA, tagB] = callback(tagIntStr);

    if (tagA.args.length !== tagB.args.length) {
        throw new Error('Interpolation strings must have a matching number of interpolated args');
    }

    const format = formatter || (value => value);
    const interpolators = tagA.args.map((arg, index) => interpolateNumber(arg, tagB.args[index]));

    return position => Array.from(tagA.fragments).reduce((input, fragment, index) => {
        const output = input + fragment;
        const interpolator = interpolators[index];

        return output + format(interpolator(position));
    }, '');
}