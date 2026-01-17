import type {
    InterpolatorFactory,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const interpolateAny: InterpolatorFactory<any> = (valueA, valueB) => {
    if (valueA === valueB) {
        return () => valueB;
    }

    return time => time > 0.5 ? valueB : valueA;
};

interpolateAny.test = () => true;
