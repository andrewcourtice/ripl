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
    BaseShape,
    ShapeCalculator,
    ShapeCalculators,
    ShapeOptions,
    ShapeValueBounds,
    ShapeValueFunction,
    ShapeValueFunctions,
    ShapeValueKeyFrame,
} from './types';

function isShapeValueBound(value: unknown): value is ShapeValueBounds<any> {
    return isArray(value) && value.length === 2;
}

function isShapeValueKeyFrame(value: unknown): value is ShapeValueKeyFrame<any>[] {
    return isArray(value) && value.every(keyframe => isObject(keyframe) && 'value' in keyframe);
}

function getKeyframeValueFns<TValue>(value: ShapeValueKeyFrame<TValue>[], calculator?: ShapeCalculator<TValue>): ShapeValueFunction<TValue | undefined> {
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

    return time => {
        const keyframe = deltaFrames.find(frame => time >= frame.offset);

        if (keyframe) {
            return keyframe.calculate(keyframe.scale(time, true));
        }
    };
}

export function getValueFns<TShape extends BaseShape>(options: ShapeOptions<TShape>, calculators: ShapeCalculators<TShape> = {}): ShapeValueFunctions<TShape> {
    const output = {} as ShapeValueFunctions<TShape>;

    for (const prop in options) {
        const value = options[prop];
        const calculator = calculators[prop] || ((va, vb) => {
            if (isNumber(va) && isNumber(vb)) {
                const scale = continuous([0, 1], [va, vb]);
                return time => scale(time, true);
            }

            return time => time > 0.5 ? vb : va;
        });

        if (isFunction(value)) {
            output[prop] = value;
            continue;
        }

        if (isShapeValueKeyFrame(value)) {
            output[prop] = getKeyframeValueFns(value, calculator);
            continue;
        }

        if (isShapeValueBound(value)) {
            output[prop] = calculator!(value[0], value[1]);
            continue;
        }

        output[prop] = time => value;
    }

    return output;
}