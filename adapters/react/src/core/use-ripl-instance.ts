import {
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import type {
    DependencyList,
} from 'react';

/** Holds one Ripl object for a mounted component, and lets an effect rebuild it after teardown. */
export interface RiplInstanceHandle<TValue> {
    /** The object this render sees. */
    instance: TValue;
    /** Marks the object torn down. Call this from the effect cleanup that destroyed it. */
    release(): void;
    /**
     * Rebuilds the object when a previous cleanup released it.
     *
     * @returns Whether it rebuilt, in which case the calling effect should do nothing and wait for
     * the render the rebuild schedules.
     */
    renew(): boolean;
}

/** A resource an effect owns: the object it built, and how to tear that object down. */
export interface RiplResource<TValue> {
    /** The object that was built. */
    value: TValue;
    /** Tears the object down. */
    destroy(): void;
}

/**
 * Constructs an inert Ripl object once per mounted component and hands it back on every render, so
 * descendants can read it from context during their own render rather than a pass later.
 *
 * Only for objects that own nothing outside themselves — an element or a group allocates no DOM, no
 * listeners and no loop, so the copy React's development-mode double render strands is inert and
 * collectable. Anything holding a real resource belongs in {@link useRiplResource}.
 *
 * The instance lives in state rather than a ref because React's development-mode remount re-runs
 * effects *without* re-rendering: an element its own cleanup destroyed would otherwise be handed
 * back dead, and only the effect is in a position to replace it.
 *
 * @typeParam TValue - The object being constructed.
 * @param create - Builds the object from the current props.
 * @returns The instance, and the release/renew pair its effect drives.
 * @example
 * const handle = useRiplInstance(() => createCircle(options));
 *
 * useLayoutEffect(() => {
 *     if (handle.renew()) {
 *         return undefined;
 *     }
 *
 *     return () => handle.release();
 * });
 */
export function useRiplInstance<TValue>(create: () => TValue): RiplInstanceHandle<TValue> {
    const [instance, setInstance] = useState(create);
    const released = useRef(false);

    return {
        instance,
        release: () => {
            released.current = true;
        },
        renew: () => {
            if (!released.current) {
                return false;
            }

            released.current = false;
            setInstance(() => create());

            return true;
        },
    };
}

/**
 * Builds a resource-owning Ripl object in a layout effect and publishes it through state, so the
 * component renders nothing until the object exists and every teardown is symmetric.
 *
 * A context, scene, renderer, chart or camera owns a canvas, an observer or an animation loop, so
 * constructing one during render would leak a copy on every discarded render and on React's
 * development-mode double render. A layout effect also runs with the DOM committed, which is what
 * lets a context be built directly against its host element instead of a detached one.
 *
 * @typeParam TValue - The object being built.
 * @param build - Builds the object and returns it with its teardown, or `undefined` to decline.
 * @param deps - What rebuilds the object when it changes.
 * @returns The object, or `undefined` until the first layout effect has run.
 */
export function useRiplResource<TValue>(build: () => RiplResource<TValue> | undefined, deps: DependencyList): TValue | undefined {
    const [value, setValue] = useState<TValue>();

    useLayoutEffect(() => {
        const resource = build();

        if (!resource) {
            return undefined;
        }

        setValue(() => resource.value);

        return () => {
            setValue(undefined);
            resource.destroy();
        };
    }, deps);

    return value;
}

/**
 * Builds a value once per mounted component, for objects with no teardown of their own.
 *
 * @typeParam TValue - The value being built.
 * @param create - Builds the value.
 * @returns The same value on every render.
 */
export function useRiplLazy<TValue extends object>(create: () => TValue): TValue {
    const ref = useRef<TValue>(undefined);

    ref.current ??= create();

    return ref.current;
}
