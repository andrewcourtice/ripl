import {
    CALCULATORS,
    CONTEXT_MAP,
} from './constants';

import {
    getValueFns,
} from './utilities';

import type {
    BaseShape,
    FrameCallback,
    Shape,
    ShapeCalculators,
    ShapeDefinition,
    ShapeOptions,
    ShapeRenderer,
} from './types';

export * from './constants';
export * from './types';

export function shape<TShape extends BaseShape>(definition: ShapeDefinition<TShape>): Shape<TShape> {
    return (options, calculators): ShapeRenderer<TShape> => {
        const id = Symbol();

        const {
            name,
            validate,
            onRender,
            autoStroke = true,
            autoFill = true,
            calculators: rootCalculators,
        } = definition;

        if (validate && !validate(options)) {
            throw new Error('invalid shape options provided');
        }

        const mergedCalculators = {
            ...CALCULATORS,
            ...rootCalculators,
            ...calculators,
        } as ShapeCalculators<TShape>;

        let valueFns = getValueFns(options, mergedCalculators);

        const clone = () => shape(definition)(options, calculators);
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

            onRender(context, state);

            if (autoStroke && state.strokeStyle) {
                context.stroke();
            }

            if (autoFill && state.fillStyle) {
                context.fill();
            }

            context.restore();
        };

        return {
            id,
            name,
            clone,
            update,
            frame,
            render,
        };
    };
}