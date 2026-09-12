import {
    RIPL_CONTEXT,
    RIPL_PARENT,
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
    RiplContextProps,
} from '../types';

import {
    createRiplTree,
} from '@ripl/adapters';

import type {
    RiplTree,
} from '@ripl/adapters';

import {
    hasWindow,
} from '@ripl/dom';

import {
    createContext,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    createElement,
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
} from 'react';

import type {
    CSSProperties,
    PropsWithChildren,
} from 'react';

/** The context and the tree coordinating it, built and torn down as one. */
interface RiplSurface {
    /** The tree coordinating the declarative graph drawn to this context. */
    tree: RiplTree;
    /** The rendering context itself. */
    context: Context;
}

/** Fills the component's root, so the canvas inherits whatever size the consumer gives that root. */
const HOST_STYLE: CSSProperties = {
    width: '100%',
    height: '100%',
};

/** Keeps the declarative mirror out of layout; it exists only to be read for ordering. */
const GRAPH_STYLE: CSSProperties = {
    display: 'none',
};

/**
 * Creates a Ripl rendering context and provides it to its subtree, mounting the canvas into its own
 * root element.
 *
 * The context is built in a layout effect, which runs with the DOM already committed, so it is
 * created directly against a host element that is genuinely in the document. Children render once it
 * exists, which is what lets a scene, a renderer or an element read it during its own render.
 *
 * Elements declared without a scene between them and this component are painted directly, so the
 * simplest useful tree is a context and a shape.
 *
 * @example
 * <RiplContext style={{ width: 400, height: 300 }}>
 *     <RiplCircle cx={50} cy={50} radius={20} fill="#f00"/>
 * </RiplContext>
 */
export const RiplContext = forwardRef<Context, PropsWithChildren<RiplContextProps>>((props, ref) => {
    const {
        children,
        className,
        style,
        context: provided,
    } = props;

    const host = useRef<HTMLDivElement>(null);
    const graph = useRef<HTMLDivElement>(null);
    const ready = useRef(props.onReady);

    ready.current = props.onReady;

    const surface = useRiplResource<RiplSurface>(() => {
        const element = host.current;

        const context = provided ?? (hasWindow && element
            ? createContext(element, {
                interactive: props.interactive,
                dragThreshold: props.dragThreshold,
                meta: props.meta,
            })
            : undefined);

        if (!context) {
            return undefined;
        }

        const tree = createRiplTree();
        const node = graph.current;

        tree.context = context;

        if (node) {
            tree.attach(node);
        }

        // The surface has no size until layout has run, so the first real paint comes from the
        // resize that announces it rather than from this frame.
        const resize = context.on('resize', () => tree.requestPaint());

        tree.requestPaint();
        ready.current?.(context);

        return {
            value: {
                tree,
                context,
            },
            destroy: () => {
                // Marked first, and React runs deletion cleanups parent-first, so a descendant's
                // leave destroys its element outright rather than animating it through a renderer
                // that is about to go.
                tree.dispose();
                resize.dispose();
                tree.destroy();

                if (!provided) {
                    context.destroy();
                }
            },
        };
    }, [provided]);

    const tree = surface?.tree;
    const context = surface?.context;

    useImperativeHandle(ref, () => context as Context, [context]);
    useForwardedEvents(context, props);

    // Runs after every descendant's effect, so an enter queued without a transition component
    // between it and here still lands in this commit rather than a microtask later.
    useLayoutEffect(() => tree?.flushEnters());

    // Shadows an enclosing context's scene and renderer, which a nested context must not inherit.
    const scoped = createElement(RIPL_RENDERER.Provider, {
        value: undefined,
    }, createElement(RIPL_SCENE.Provider, {
        value: undefined,
    }, children));

    const graphed = createElement(RIPL_TREE.Provider, {
        value: tree,
    }, createElement(RIPL_CONTEXT.Provider, {
        value: context,
    }, createElement(RIPL_PARENT.Provider, {
        value: tree?.rootGroup,
    }, scoped)));

    return createElement('div', {
        className,
        style,
    }, createElement('div', {
        ref: host,
        style: HOST_STYLE,
    }), createElement('div', {
        ref: graph,
        style: GRAPH_STYLE,
    }, tree ? graphed : null));
});

RiplContext.displayName = 'RiplContext';
