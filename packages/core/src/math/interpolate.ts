import {
    isNil,
} from '../utilities/type';

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

export function interpolateNumber(valueA: number, valueB: number, position: number): number {
    return valueA + (valueB - valueA) * position;
}

export function interpolateString(callback: (tag: typeof tagIntStr) => StringInterpolationSet, position: number, formatter?: StringInterpolationFormatter): string {
    const [tagA, tagB] = callback(tagIntStr);

    if (tagA.args.length !== tagB.args.length) {
        throw new Error('Interpolation strings must have a matching number of interpolated args');
    }

    const format = formatter || (value => value);

    return tagA.fragments.reduce((input, fragment, index) => {
        const output = input + fragment;
        const valueA = tagA.args[index];
        const valueB = tagB.args[index];

        if (isNil(valueA) || isNil(valueB)) {
            return output;
        }

        return output + format(interpolateNumber(valueA, valueB, position));
    }, '');
}