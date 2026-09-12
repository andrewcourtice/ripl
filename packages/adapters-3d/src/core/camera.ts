import {
    CAMERA_SYNC_KEYS,
} from './constants';

import {
    typeIsArray,
} from '@ripl/utilities';

import type {
    RiplWritable,
} from '@ripl/adapters';

function isSameValue(previous: unknown, next: unknown): boolean {
    if (previous === next) {
        return true;
    }

    return typeIsArray(previous) && typeIsArray(next)
        && previous.length === next.length
        && previous.every((value, index) => value === next[index]);
}

function snapshot(value: unknown): unknown {
    return typeIsArray(value) ? value.slice() : value;
}

/**
 * Reads the camera props that differ from the ones last written.
 *
 * Vectors are compared by value, and a copy is kept rather than the caller's array, so a vector
 * rebuilt on every render does not overwrite the pose the camera's own pointer interactions gave it.
 *
 * @param props - The camera component's props object.
 * @param applied - The values last written to the camera; mutated in place.
 * @returns The changed props, or `undefined` when none changed.
 */
export function collectChangedCameraProps(props: RiplWritable, applied: RiplWritable): RiplWritable | undefined {
    let changed: RiplWritable | undefined;

    CAMERA_SYNC_KEYS.forEach(key => {
        const value = props[key];

        if (value === undefined || isSameValue(applied[key], value)) {
            return;
        }

        applied[key] = snapshot(value);
        (changed ??= {})[key] = value;
    });

    return changed;
}
