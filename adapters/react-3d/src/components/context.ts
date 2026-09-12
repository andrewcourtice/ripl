import {
    RIPL_CAMERA,
    RIPL_CAMERA_SLOT,
    RIPL_CONTEXT_3D,
} from '../core/contexts';

import type {
    RiplContext3DProps,
} from '../types';

import {
    createContext as createContext3D,
} from '@ripl/3d';

import type {
    Camera,
    CanvasContext3D,
    Context3DOptions,
    Light,
} from '@ripl/3d';

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
    RIPL_CONTEXT,
    RIPL_PARENT,
    RIPL_RENDERER,
    RIPL_SCENE,
    RIPL_TREE,
    useForwardedEvents,
    useRiplResource,
} from '@ripl/react';

import type {
    RiplHostProps,
} from '@ripl/react';

import {
    createElement,
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import type {
    CSSProperties,
    PropsWithChildren,
} from 'react';

/** The 3D context and the tree coordinating it, built and torn down as one. */
interface RiplSurface3D {
    /** The tree coordinating the declarative graph drawn to this context. */
    tree: RiplTree;
    /** The 3D rendering context itself. */
    context: CanvasContext3D;
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
 * Creates a Ripl 3D rendering context and provides it to its subtree, mounting the canvas into its
 * own root element.
 *
 * A 3D context is an ordinary Ripl context, so `<RiplScene>`, `<RiplRenderer>` and
 * `<RiplTransition>` from `@ripl/react` work inside it unchanged — this component replaces
 * `<RiplContext>` and nothing else.
 *
 * @example
 * <RiplContext3D>
 *     <RiplScene>
 *         <RiplRenderer autoStop={false}>
 *             <RiplCamera position={[0, 2, 5]} interactions/>
 *             <RiplCube size={1} fill="#4488ff"/>
 *         </RiplRenderer>
 *     </RiplScene>
 * </RiplContext3D>
 */
export const RiplContext3D = forwardRef<CanvasContext3D, PropsWithChildren<RiplContext3DProps & RiplHostProps>>((props, ref) => {
    const {
        children,
        className,
        style,
        context: provided,
    } = props;

    const host = useRef<HTMLDivElement>(null);
    const graph = useRef<HTMLDivElement>(null);
    const ready = useRef(props.onReady);
    const [camera, setCamera] = useState<Camera>();

    ready.current = props.onReady;

    const surface = useRiplResource<RiplSurface3D>(() => {
        const element = host.current;

        const context = (provided as CanvasContext3D | undefined) ?? (hasWindow && element
            ? createContext3D(element, {
                interactive: props.interactive,
                dragThreshold: props.dragThreshold,
                meta: props.meta,
                fov: props.fov,
                near: props.near,
                far: props.far,
                lightDirection: props.lightDirection,
                lightMode: props.lightMode,
                lights: props.lights,
                ambientIntensity: props.ambientIntensity,
                fog: props.fog,
            } as Context3DOptions)
            : undefined);

        if (!context) {
            return undefined;
        }

        // A declared light must not stack on the default ambient-plus-directional rig, and binding
        // `lights` is the only signal that the consumer intends to own the lighting.
        if (props.lights) {
            context.lights.clear();
            context.lights.add(...props.lights as Light[]);
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

    useImperativeHandle(ref, () => context as CanvasContext3D, [context]);
    useForwardedEvents(context, props);

    useLayoutEffect(() => tree?.flushEnters());

    // Shadows an enclosing context's scene and renderer, which a nested context must not inherit.
    const scoped = createElement(RIPL_RENDERER.Provider, {
        value: undefined,
    }, createElement(RIPL_SCENE.Provider, {
        value: undefined,
    }, children));

    const aimed = createElement(RIPL_CAMERA.Provider, {
        value: camera,
    }, createElement(RIPL_CAMERA_SLOT.Provider, {
        value: setCamera,
    }, createElement(RIPL_PARENT.Provider, {
        value: tree?.rootGroup,
    }, scoped)));

    const graphed = createElement(RIPL_TREE.Provider, {
        value: tree,
    }, createElement(RIPL_CONTEXT.Provider, {
        value: context,
    }, createElement(RIPL_CONTEXT_3D.Provider, {
        value: context,
    }, aimed)));

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

RiplContext3D.displayName = 'RiplContext3D';
