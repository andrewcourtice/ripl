import type {
    Element,
} from '@ripl/core';

import type {
    Context3D,
} from './context';

export function depthSort(context: Context3D): (buffer: Element[]) => Element[] {
    return (buffer: Element[]) => {
        context.faceBuffer = [];
        return buffer;
    };
}
