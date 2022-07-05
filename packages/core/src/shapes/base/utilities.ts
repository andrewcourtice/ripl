import {
    interpolateNumber,
} from '../../math/interpolate';

import {
    continuous,
} from '../../math/scale';

import {
    isArray,
    isFunction,
    isNil,
    isNumber,
    isObject,
} from '../../utilities/type';

import type {
    BaseElement,
    ElementCalculator,
    ElementCalculators,
    ElementProperties,
    ElementValueBounds,
    ElementValueFunction,
    ElementValueFunctions,
    ElementValueKeyFrame,
} from './types';

function isElementValueBound(value: unknown): value is ElementValueBounds<any> {
    return isArray(value) && value.length === 2;
}

function isElementValueKeyFrame(value: unknown): value is ElementValueKeyFrame<any>[] {
    return isArray(value) && value.every(keyframe => isObject(keyframe) && 'value' in keyframe);
}

function getKeyframeValueFns<TValue>(value: ElementValueKeyFrame<TValue>[], calculator?: ElementCalculator<TValue>): ElementValueFunction<TValue | undefined> {
    const lastIndex = value.length - 1;
    const keyframes = value.map(({ offset, value }, index) => ({
        value,
        offset: isNil(offset) ? index / lastIndex : offset,
    }));

    if (keyframes[0].offset !== 0) {
        keyframes.unshift({
            offset: 0,
            value: keyframes[0].value,
        });
    }

    if (keyframes[lastIndex].offset !== 1) {
        keyframes.push({
            offset: 1,
            value: keyframes[lastIndex ].value,
        });
    }

    keyframes.sort(({ offset: oa }, { offset: ob }) => oa - ob);

    const deltaFrames = Array.from({ length: keyframes.length - 1 }, (_, index) => {
        const frameA = keyframes[index];
        const frameB = keyframes[index + 1];
        const scale = continuous([frameA.offset, frameB.offset], [0, 1]);
        const calculate = calculator(frameA.value, frameB.value);

        return {
            scale,
            calculate,
            ...frameA,
        };
    }).reverse();

    //console.log(deltaFrames);

    return time => {
        const keyframe = deltaFrames.find(frame => time >= frame.offset);

        if (keyframe) {
            return keyframe.calculate(keyframe.scale(time));
        }
    };
}

export function defaultCalculator<TElement extends BaseElement>(valueA: TElement[keyof TElement], valueB: TElement[keyof TElement]): ElementValueFunction<TElement[keyof TElement]> {
    if (isNumber(valueA) && isNumber(valueB)) {
        return time => interpolateNumber(valueA, valueB, time) as typeof valueA;
    }

    return time => time > 0.5 ? valueB : valueA;
}

export function getValueFns<TElement extends BaseElement>(properties: Partial<ElementProperties<TElement>>, calculators: ElementCalculators<TElement> = {}): ElementValueFunctions<TElement> {
    const output = {} as ElementValueFunctions<TElement>;

    for (const key in properties) {
        const value = properties[key];
        const calculator = calculators[key] || defaultCalculator;

        if (isFunction(value)) {
            output[key] = value;
            continue;
        }

        if (isElementValueKeyFrame(value)) {
            output[key] = getKeyframeValueFns(value, calculator);
            continue;
        }

        if (isElementValueBound(value)) {
            output[key] = calculator!(value[0], value[1]);
            continue;
        }

        output[key] = time => value;
    }

    return output;
}