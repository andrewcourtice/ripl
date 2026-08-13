import {
    RIPL_RENDERER,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './injection';

import {
    applyFields,
    applyState,
} from './state';

import type {
    RiplPropPartition,
    RiplWritable,
} from './state';

import type {
    RiplTransitionPhaseOptions,
} from './transition';

import {
    objectForEach,
    stringUniqueId,
    typeIsNil,
} from '@ripl/utilities';

import {
    factory,
} from '@ripl/web';

import type {
    Element,
    Group,
    Renderer,
    RendererTransitionOptions,
    Transition,
} from '@ripl/web';

import {
    inject,
} from 'vue';

/** Applies the transition phases in scope across an element's lifecycle. */
export interface RiplElementTransition {
    /** Applies the enter state and schedules the enter transition. */
    enter(element: Element): void;
    /** Writes a changed prop batch, animating the state half through the update phase when one is in scope. */
    update(element: Element, partition: RiplPropPartition): void;
    /** Runs the leave transition, destroying the element once it finishes. */
    leave(element: Element): void;
}

/**
 * Captures the state an entering element should animate *towards*, read before its enter state is
 * applied. Resolving the target from the element is what lets `enter` reference a property the
 * template never bound: fading in from `{ opacity: 0 }` recovers a target of `1` from the
 * element's inherited or default state instead of leaving it stuck at zero.
 */
function resolveEnterTarget(element: Element, state: RiplWritable): RiplWritable {
    const defaults = factory.getDefaultState?.() as unknown as RiplWritable | undefined;
    const target: RiplWritable = {};

    objectForEach(state, key => {
        const current = element.getComputedValue(key as never);
        const value = typeIsNil(current) ? defaults?.[key] : current;

        if (value !== undefined) {
            target[key] = value;
        }
    });

    return target;
}

/** Bridges an untyped state bag onto the renderer's typed transition options. */
function toTransitionOptions(options: RiplTransitionPhaseOptions, state: RiplWritable): RendererTransitionOptions<Element> {
    return {
        ...options,
        state,
    } as RendererTransitionOptions<Element>;
}

/**
 * Resolves the transition phases in scope and applies them across an element's lifecycle.
 *
 * Must be called from a component's `setup()`, and the returned appliers take their element per
 * call, so an element can be constructed after the phases are resolved.
 *
 * @returns The enter, update and leave appliers.
 */
export function useElementTransition(): RiplElementTransition {
    const tree = inject(RIPL_TREE, undefined);
    const renderer = inject(RIPL_RENDERER, undefined);
    const scope = inject(RIPL_TRANSITION, undefined);

    let looping: Transition | undefined;

    const schedule = (active: Renderer, element: Element, options: RiplTransitionPhaseOptions, state: RiplWritable): Transition => {
        const instance = active.transition(element, toTransitionOptions(options, state));

        // Aborting rejects the transition, and nothing here awaits it, so swallow it at the source.
        void instance.catch(() => undefined);

        if (options.loop) {
            // A looping transition never completes, so nothing else will ever evict it.
            looping?.abort();
            looping = instance;
        }

        return instance;
    };

    const enter = (element: Element) => {
        const options = tree && scope && (tree.mounted || scope.appear)
            ? scope.resolve('enter', element)
            : undefined;

        if (!options?.state || !renderer?.value) {
            return;
        }

        const state = options.state as RiplWritable;
        const target = resolveEnterTarget(element, state);

        applyState(element, state);
        void schedule(renderer.value, element, options, target);
    };

    const update = (element: Element, partition: RiplPropPartition) => {
        const {
            state,
            fields,
            hasState,
            hasPaintedField,
        } = partition;

        applyFields(element, fields);

        const options = hasState ? scope?.resolve('update', element) : undefined;

        if (options && renderer?.value) {
            void schedule(renderer.value, element, options, {
                ...state,
                ...options.state as RiplWritable,
            });
        } else {
            applyState(element, state);
        }

        if (hasState || hasPaintedField) {
            tree?.requestPaint();
        }
    };

    const runLeave = (active: Renderer, element: Element, group: Group | undefined, options: RiplTransitionPhaseOptions) => {
        if (group) {
            tree?.retainLeaving(group, element);
        }

        // Retag first, so a key re-entering during the fade cannot collide with this element.
        element.id = `${element.id}:leave:${stringUniqueId()}`;

        // A leave transition owns the element's destruction, so it must be allowed to finish.
        const phase = {
            ...options,
            loop: false,
        };

        void active.transition(element, toTransitionOptions(phase, (phase.state ?? {}) as RiplWritable))
            .catch(() => undefined)
            .then(() => {
                if (group) {
                    tree?.releaseLeaving(group, element);
                }

                element.destroy();
            });
    };

    const leave = (element: Element) => {
        looping?.abort();
        looping = undefined;

        scope?.unregister(element);

        const active = renderer?.value;
        const options = scope?.resolve('leave', element);

        if (!options || !active || !tree || tree.disposing) {
            element.destroy();
            tree?.requestPaint();
            return;
        }

        runLeave(active, element, element.parent, options);
    };

    return {
        enter,
        update,
        leave,
    };
}
