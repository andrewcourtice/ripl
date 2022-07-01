import {
    blendHex,
} from '../math/colour';

import {
    continuous,
} from '../math/scale';

import {
    isArray,
    isFunction,
    isNil,
    isNumber,
    isObject,
} from '../utilities/type';

export type ShapeValueFunction<TValue = number> = (time: number) => TValue;
export type ShapeValueBounds<TValue = number> = [first: TValue, last: TValue];
export type ShapeValueKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
}

export type ShapeValue<TValue = number> = TValue
| ShapeValueBounds<TValue>
| ShapeValueKeyFrame<TValue>[]
| ShapeValueFunction<TValue>;

export interface BaseShape {
    strokeStyle?: string;
    fillStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
    lineDashOffset?: CanvasRenderingContext2D['lineDashOffset'];
    lineCap?: CanvasRenderingContext2D['lineCap'];
    lineJoin?: CanvasRenderingContext2D['lineJoin'];
}

export type ShapeOptions<TShape extends BaseShape> = {
    [P in keyof TShape]: ShapeValue<TShape[P]>;
};

export type ShapeValueFunctions<TShape extends BaseShape> = {
    [P in keyof TShape]: ShapeValueFunction<TShape[P]>;
};

export type Calculator<TValue> = (valueA: TValue, valueB: TValue) => ShapeValueFunction<TValue>
export type Calculators<TShape extends BaseShape> = {
    [P in keyof TShape]?: Calculator<TShape[P]>;
}

export type ShapeRenderFunction<TShape extends BaseShape> = (context: CanvasRenderingContext2D, state: TShape) => void;
export type FrameCallback<TShape extends BaseShape> = (key: keyof TShape, value: TShape[typeof key]) => void;
type ContextRen = {
    [P in keyof BaseShape]?: (context: CanvasRenderingContext2D, value: BaseShape[P]) => void;
}

export type Shape<TShape extends BaseShape> = (options: ShapeOptions<TShape>, calculators?: Calculators<TShape>) => ShapeRenderer<TShape>;
export interface ShapeRenderer<TShape extends BaseShape> {
    clone: () => ShapeRenderer<TShape>;
    update: (options: ShapeOptions<TShape>) => void;
    frame: (time: number, callback?: FrameCallback<TShape>) => TShape;
    render: (context: CanvasRenderingContext2D, time?: number) => void;
}

const CONTEXT_MAP = {
    strokeStyle: (context, value) => {
        if (value) context.strokeStyle = value;
    },
    fillStyle: (context, value) => {
        if (value) context.fillStyle = value;
    },
    lineWidth: (context, value) => {
        if (value) context.lineWidth = value;
    },
    lineCap: (context, value) => {
        if (value) context.lineCap = value;
    },
    lineJoin: (context, value) => {
        if (value) context.lineJoin = value;
    },
    lineDash: (context, value) => {
        if (value) context.setLineDash(value);
    },
    lineDashOffset: (context, value) => {
        if (value) context.lineDashOffset = value;
    },
} as ContextRen;

function isShapeValueBound(value: unknown): value is ShapeValueBounds<any> {
    return isArray(value) && value.length === 2;
}

function isShapeValueKeyFrame(value: unknown): value is ShapeValueKeyFrame<any>[] {
    return isArray(value) && value.every(keyframe => isObject(keyframe) && 'value' in keyframe);
}

function getKeyframeValueFns<TValue>(value: ShapeValueKeyFrame<TValue>[], calculator?: Calculator<TValue>): ShapeValueFunction<TValue | undefined> {
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

function getValueFns<TShape extends BaseShape>(options: ShapeOptions<TShape>, calculators: Calculators<TShape> = {}): ShapeValueFunctions<TShape> {
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

export function shape<TShape extends BaseShape>(renderFn: ShapeRenderFunction<TShape>, baseCalculators?: Calculators<TShape>): Shape<TShape> {
    return (options, calculators): ShapeRenderer<TShape> => {
        const mergedCalculators = {
            strokeStyle: (valueA, valueB) => time => blendHex(valueA, valueB, time),
            fillStyle: (valueA, valueB) => time => blendHex(valueA, valueB, time),
            lineDash: (valueA, valueB) => {
                const scales = valueA?.map((segA, i) => continuous([0, 1], [segA, valueB[i]]));
                return time => scales?.map(scale => scale(time, true));
            },
            ...baseCalculators,
            ...calculators,
        } as Calculators<TShape>;

        let valueFns = getValueFns(options, mergedCalculators);

        const clone = () => shape(renderFn, baseCalculators)(options, calculators);
        const update = (options: ShapeOptions<TShape>) => {
            valueFns = getValueFns(options, mergedCalculators);
        };

        const frame = (time: number, callback?: FrameCallback<TShape>) => {
            const state = {} as TShape;

            for (const key in valueFns) {
                const value = valueFns[key](time);
                state[key] = value;

                if (callback) {
                    callback(key, value);
                }
            }

            return state;
        };

        const render = (context: CanvasRenderingContext2D, time: number = 1) => {
            context.save();

            const state = frame(time, (key, value) => {
                if (key in CONTEXT_MAP) {
                    CONTEXT_MAP[key]?.(context, value);
                }
            });

            renderFn(context, state);

            if (state.strokeStyle) {
                context.stroke();
            }

            if (state.fillStyle) {
                context.fill();
            }

            context.restore();
        };

        return {
            clone,
            update,
            frame,
            render,
        };
    };
}