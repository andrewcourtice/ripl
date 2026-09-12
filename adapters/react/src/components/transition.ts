import {
    RIPL_RENDERER,
    RIPL_TRANSITION,
    RIPL_TREE,
} from '../core/contexts';

import {
    useRiplLazy,
} from '../core/use-ripl-instance';

import type {
    RiplTransitionProps,
} from '../types';

import {
    RiplTransitionScope,
} from '@ripl/adapters';

import type {
    RiplTransitionPhases,
} from '@ripl/adapters';

import {
    createElement,
    useContext,
    useLayoutEffect,
    useRef,
} from 'react';

import type {
    PropsWithChildren,
    ReactElement,
} from 'react';

/**
 * Animates the descendants it wraps as they enter, update and leave.
 *
 * Each phase is either an options object or a factory called per element with its index and the
 * scope's size, which is what makes staggering work. Requires a `<RiplRenderer>` ancestor:
 * transitions are scheduled through the renderer's loop.
 *
 * @param props - The phases to apply, and the elements to apply them to.
 * @returns The subtree, with the phases in scope for it.
 * @example
 * <RiplTransition
 *     enter={(element, index, length) => ({ duration: 400, delay: (index / length) * 200, state: { opacity: 0, radius: 0 } })}
 *     update={{ duration: 250 }}
 *     leave={{ duration: 200, state: { opacity: 0 } }}
 * >
 *     {items.map(item => <RiplCircle key={item.id} cx={item.x} cy={item.y} radius={item.r}/>)}
 * </RiplTransition>
 */
export function RiplTransition(props: PropsWithChildren<RiplTransitionProps>): ReactElement {
    const renderer = useContext(RIPL_RENDERER);

    // Held in a ref rather than closed over, because the scope resolves phases once per element per
    // phase and a closure would rebuild the same object on every one of those calls.
    const phases = useRef<RiplTransitionPhases>({});

    phases.current = {
        enter: props.enter,
        update: props.update,
        leave: props.leave,
        appear: props.appear,
    };

    const scope = useRiplLazy(() => new RiplTransitionScope(() => phases.current));
    const tree = useContext(RIPL_TREE);

    // Descendants queue their enter so a stagger spans the whole set; this component's own effect
    // runs after all of theirs, so the common case lands in the same commit rather than a microtask
    // later. The queue's own microtask stays the backstop for an element added on its own.
    useLayoutEffect(() => {
        tree?.flushEnters();
        scope.settle();
    });

    useLayoutEffect(() => {
        if (!renderer) {
            console.warn('[@ripl/react] <RiplTransition> needs a <RiplRenderer> ancestor; its children will apply their props directly.');
        }
    }, [renderer]);

    return createElement(RIPL_TRANSITION.Provider, {
        value: scope,
    }, props.children);
}
