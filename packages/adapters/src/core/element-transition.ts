import {
    applyFields,
    applyState,
    DEFAULT_CLASS_KEY,
} from './state';

import type {
    RiplFieldWriters,
    RiplPropPartition,
    RiplWritable,
} from './state';

import type {
    RiplTransitionPhaseOptions,
    RiplTransitionScope,
} from './transition';

import type {
    RiplTree,
} from './tree';

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

/** Applies the transition phases in scope across an element's lifecycle. */
export interface RiplElementTransition {
    /** Applies the enter state and schedules the enter transition. */
    enter(element: Element): void;
    /** Writes a changed prop batch, animating the state half through the update phase when one is in scope. */
    update(element: Element, partition: RiplPropPartition): void;
    /** Runs the leave transition, destroying the element once it finishes. */
    leave(element: Element): void;
}

/** What a component supplies to resolve and apply the transition phases around one element. */
export interface RiplElementTransitionOptions {
    /** The tree coordinating the enclosing context, used to gate `appear` and request repaints. */
    tree?: RiplTree;
    /** The transition phases in scope, when a transition component encloses the element. */
    scope?: RiplTransitionScope;
    /** Resolves the renderer transitions are scheduled through, re-read on each call. */
    getRenderer(): Renderer | undefined;
    /** Write overrides for fields an element exposes through a method rather than a setter. */
    writers?: RiplFieldWriters;
    /** The prop name carrying class names. Defaults to `class`. */
    classKey?: string;
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
 * Applies the transition phases in scope across an element's lifecycle.
 *
 * The returned appliers take their element per call, so an element can be constructed after the
 * phases are resolved.
 *
 * @param options - The phases in scope and how to reach the renderer.
 * @returns The enter, update and leave appliers.
 */
export function createElementTransition(options: RiplElementTransitionOptions): RiplElementTransition {
    const {
        tree,
        scope,
        getRenderer,
        writers,
        classKey = DEFAULT_CLASS_KEY,
    } = options;

    let looping: Transition | undefined;

    const schedule = (active: Renderer, element: Element, phase: RiplTransitionPhaseOptions, state: RiplWritable): Transition => {
        const instance = active.transition(element, toTransitionOptions(phase, state));

        // Aborting rejects the transition, and nothing here awaits it, so swallow it at the source.
        void instance.catch(() => undefined);

        if (phase.loop) {
            // A looping transition never completes, so nothing else will ever evict it.
            looping?.abort();
            looping = instance;
        }

        return instance;
    };

    const enter = (element: Element) => {
        const renderer = getRenderer();
        const phase = scope && (scope.settled || scope.appear)
            ? scope.resolve('enter', element)
            : undefined;

        if (!phase?.state || !renderer) {
            return;
        }

        const state = phase.state as RiplWritable;
        const target = resolveEnterTarget(element, state);

        applyState(element, state);
        void schedule(renderer, element, phase, target);
    };

    const update = (element: Element, partition: RiplPropPartition) => {
        const {
            state,
            fields,
            hasState,
            hasPaintedField,
        } = partition;

        applyFields(element, fields, writers, classKey);

        const renderer = getRenderer();
        const phase = hasState ? scope?.resolve('update', element) : undefined;

        if (phase && renderer) {
            void schedule(renderer, element, phase, {
                ...state,
                ...phase.state as RiplWritable,
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

        const active = getRenderer();
        const phase = scope?.resolve('leave', element);

        if (!phase || !active || !tree || tree.disposing) {
            element.destroy();
            tree?.requestPaint();
            return;
        }

        runLeave(active, element, element.parent, phase);
    };

    return {
        enter,
        update,
        leave,
    };
}
