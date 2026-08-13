import type {
    BaseElementState,
    Ease,
    Element,
    ElementInterpolationState,
    ElementInterpolators,
    RendererTransitionDirection,
    TransitionLoopMode,
} from '@ripl/web';

import {
    typeIsFunction,
} from '@ripl/utilities';

/** Resolves an element's state interface, falling back to the shared base state. */
export type RiplElementState<TElement> = TElement extends Element<infer TState> ? TState : BaseElementState;

/** The three phases a transition scope can describe. */
export type RiplTransitionPhaseName = 'enter' | 'update' | 'leave';

/**
 * Options for a single transition phase. Mirrors Ripl's `RendererTransitionOptions`, except that
 * `state` is optional: the update phase derives its target from whichever props changed.
 */
export interface RiplTransitionPhaseOptions<TElement extends Element = Element> {
    /** Duration of the transition, in milliseconds. Defaults to `0`. */
    duration?: number;
    /** Easing function applied to the transition's progress. Defaults to linear. */
    ease?: Ease;
    /**
     * Loop behavior once the transition completes: `true` restarts, `alternate` plays back and
     * forth. Defaults to no looping, and is ignored on the `leave` phase, which owns the element's
     * destruction and so has to finish.
     */
    loop?: TransitionLoopMode;
    /** Delay, in milliseconds, before the transition begins. Defaults to `0`. */
    delay?: number;
    /** Playback direction of the transition. Defaults to `forward`. */
    direction?: RendererTransitionDirection;
    /**
     * The detached state for this phase: the state an entering element animates *from*, or the
     * state a leaving element animates *to*. On the update phase it is merged over the changed
     * props to form the target.
     */
    state?: ElementInterpolationState<RiplElementState<TElement>>;
    /** Interpolators to resolve this phase's state properties with, overriding the element's own. */
    interpolators?: ElementInterpolators<RiplElementState<TElement>>;
    /** Invoked with the element once its transition completes. Never called for a looping phase. */
    onComplete?(element: Element): void;
}

/** A transition phase: static options, or a factory invoked per element for staggering. */
export type RiplTransitionPhase<TElement extends Element = Element> = RiplTransitionPhaseOptions<TElement> | ((
    element: TElement,
    index: number,
    length: number
) => RiplTransitionPhaseOptions<TElement>);

/** The set of phases a transition component contributes to its subtree. */
export interface RiplTransitionPhases {
    /** Applied when an element enters the graph. */
    enter?: RiplTransitionPhase;
    /** Applied when an element's props change. */
    update?: RiplTransitionPhase;
    /** Applied when an element leaves the graph, before it is destroyed. */
    leave?: RiplTransitionPhase;
    /** Whether elements present on the initial mount run their enter phase. Defaults to `true`. */
    appear?: boolean;
}

/**
 * The live transition phases in scope for a subtree of elements, resolved lazily so that reactive
 * prop changes on the transition component take effect without re-registering its descendants.
 *
 * Members are tracked in attachment order so a phase expressed as a factory receives a stable
 * `index` and `length`, which is what makes staggered enters (`delay: index * 20`) work.
 */
export class RiplTransitionScope {

    private _elements: Element[] = [];
    private readonly _getPhases: () => RiplTransitionPhases;

    /** Whether elements present on the initial mount run their enter phase. */
    public get appear(): boolean {
        return this._getPhases().appear ?? true;
    }

    constructor(getPhases: () => RiplTransitionPhases) {
        this._getPhases = getPhases;
    }

    /** Adds an element to the scope, giving it a position for staggered phase factories. */
    public register(element: Element): void {
        this._elements.push(element);
    }

    /** Removes an element from the scope. */
    public unregister(element: Element): void {
        const index = this._elements.indexOf(element);

        if (index < 0) {
            return;
        }

        this._elements.splice(index, 1);
    }

    /**
     * Resolves a phase's options for a single element, invoking the factory form with the
     * element's position in the scope.
     *
     * @param name - The phase to resolve.
     * @param element - The element the phase applies to.
     * @returns The resolved options, or `undefined` when the phase was not supplied.
     */
    public resolve(name: RiplTransitionPhaseName, element: Element): RiplTransitionPhaseOptions | undefined {
        const phase = this._getPhases()[name];

        if (!phase) {
            return undefined;
        }

        if (!typeIsFunction(phase)) {
            return phase;
        }

        return phase(element, Math.max(0, this._elements.indexOf(element)), this._elements.length || 1);
    }

}
