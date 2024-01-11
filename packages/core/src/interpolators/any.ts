import type {
    InterpolatorFactory,
} from './types';

export const interpolateAny: InterpolatorFactory<any> = (valueA, valueB) => {
    if (valueA === valueB) {
        return () => valueB;
    }

    return time => time > 0.5 ? valueB : valueA;
};

interpolateAny.test = () => true;