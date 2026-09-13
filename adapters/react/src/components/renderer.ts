import {
    RIPL_RENDERER,
    RIPL_SCENE,
    RIPL_TREE,
} from '../core/contexts';

import {
    useForwardedEvents,
} from '../core/use-forwarded-events';

import {
    useRiplResource,
} from '../core/use-ripl-instance';

import type {
    RiplRendererProps,
} from '../types';

import {
    createRenderer,
} from '@ripl/web';

import type {
    Renderer,
    RendererDebugOptions,
} from '@ripl/web';

import {
    createElement,
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
} from 'react';

import type {
    PropsWithChildren,
} from 'react';

/**
 * Drives the enclosing scene with a `requestAnimationFrame` loop, and makes transitions available
 * to its subtree.
 *
 * A renderer is what `<RiplTransition>` needs: enter, update and leave phases are scheduled through
 * it. Without one, elements still paint, they just snap to each new value.
 *
 * @example
 * <RiplContext>
 *     <RiplScene>
 *         <RiplRenderer autoStop={false}>
 *             <RiplCircle cx={x} cy={50} radius={20}/>
 *         </RiplRenderer>
 *     </RiplScene>
 * </RiplContext>
 */
export const RiplRenderer = forwardRef<Renderer, PropsWithChildren<RiplRendererProps>>((props, ref) => {
    const tree = useContext(RIPL_TREE);
    const scene = useContext(RIPL_SCENE);

    const {
        autoStop,
        debug,
    } = props;

    const renderer = useRiplResource<Renderer>(() => {
        if (!scene) {
            console.warn('[@ripl/react] <RiplRenderer> needs a <RiplScene> ancestor; rendering falls back to the scene or context.');
            return undefined;
        }

        const created = createRenderer(scene, {
            autoStart: props.autoStart,
            autoStop: props.autoStop,
            immediate: props.immediate,
            debug: props.debug,
        });

        if (tree) {
            tree.renderer = created;
        }

        return {
            value: created,
            destroy: () => {
                created.destroy();

                if (tree) {
                    tree.renderer = undefined;
                }
            },
        };
    }, [scene, tree]);

    useLayoutEffect(() => {
        if (renderer && autoStop !== undefined) {
            renderer.autoStop = autoStop;
        }
    }, [renderer, autoStop]);

    useLayoutEffect(() => {
        if (renderer && debug !== undefined) {
            renderer.debug = debug as boolean | RendererDebugOptions;
        }
    }, [renderer, debug]);

    useImperativeHandle(ref, () => renderer as Renderer, [renderer]);
    useForwardedEvents(renderer, props);

    return createElement(RIPL_RENDERER.Provider, {
        value: renderer,
    }, renderer ? props.children : null);
});

RiplRenderer.displayName = 'RiplRenderer';
