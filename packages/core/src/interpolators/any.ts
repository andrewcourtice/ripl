import type {
    InterpolatorFactory,
} from './types';

/** Fallback interpolator factory that snaps from the first value to the second at the halfway point. */
export const interpolateAny: InterpolatorFactory<unknown> = (valueA, valueB) => {
    if (valueA === valueB) {
        return () => valueB;
    }

    return time => time > 0.5 ? valueB : valueA;
};

interpolateAny.test = () => true;
