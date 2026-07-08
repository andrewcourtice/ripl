import type {
    BaseElementState,
    Element,
    ElementEventMap,
} from './element';

import {
    Context,
    typeIsContext,
} from '../context';

import {
    factory,
} from './factory';

import {
    createFrameBuffer,
} from '../animation';

import {
    Group,
    isGroup,
} from './group';

import type {
    GroupOptions,
} from './group';

import {
    isLayout,
} from '../layout';

import type {
    Layout,
} from '../layout';

import {
    typeIsNil,
} from '@ripl/utilities';


/** Event map for the scene, adding a `resize` event to the standard element events. */
export interface SceneEventMap extends ElementEventMap {
    resize: null;
}

/** Options for constructing a scene, extending group options with an optional auto-render-on-resize flag. */
export interface SceneOptions extends GroupOptions {
    renderOnResize?: boolean;
    renderOnUpdate?: boolean;
}

/** The top-level group bound to a rendering context, maintaining a hoisted flat buffer for O(n) rendering. */
export class Scene<TContext extends Context = Context> extends Group<BaseElementState, SceneEventMap> {

    private _frame = createFrameBuffer();
    private _graphDirty = false;
    private _renderOnUpdate: boolean;

    public context: TContext;

    /** Flattened, z-sorted leaf elements — the render buffer. Rebuilt on graph changes. */
    public buffer: Element[] = [];

    /** Layout containers in the scene, outermost-first. Rebuilt on graph changes; reflowed by `reflow()`. */
    public layouts: Layout[] = [];

    /** The renderer driving this scene, if any. Set by `Renderer`; used to avoid redundant renders. */
    public renderer?: { isRunning: boolean };

    /** The pixel width of the scene's rendering context. */
    public get width() {
        return this.context.width;
    }

    /** The pixel height of the scene's rendering context. */
    public get height() {
        return this.context.height;
    }

    constructor(target: Context | string | HTMLElement, options?: SceneOptions) {
        const {
            renderOnResize = true,
            renderOnUpdate = true,
            ...groupOptions
        } = options || {};

        let context: TContext;

        if (typeIsContext(target)) {
            context = target as TContext;
        } else if (factory.createContext) {
            context = factory.createContext(target) as TContext;
        } else {
            throw new Error('Scene requires a Context instance or factory.createContext to be set. Use @ripl/web or call factory.set() with a createContext implementation.');
        }

        context.buffer = false;

        const font = !typeIsNil(globalThis.HTMLElement) && context.element instanceof globalThis.HTMLElement
            ? factory.getComputedStyle(context.element).font
            : undefined;

        super({
            ...font ? { font } : {},
            ...groupOptions,
        });

        this.context = context;
        this.rebuffer();
        this._renderOnUpdate = renderOnUpdate;

        this.retain(context.on('resize', () => {
            this.emit('resize', null);

            if (renderOnResize && !!this.buffer.length) {
                this.render();
            }
        }));

        this.on('graph', () => {
            this._graphDirty = true;
            this.requestRender();
        });

        // A descendant layout requests a repaint after a position-only reflow. Bubbles up to the
        // scene; unlike `graph` it does not rebuffer, so it is a pure coalesced re-render.
        this.on('repaint', () => this.requestRender());
    }

    private rebuffer() {
        // One graph walk: leaves feed the z-sorted render buffer; layout containers are collected
        // (outermost-first, the order `graph(true)` produces) for `reflow()`.
        const graph = this.graph(true);

        this.layouts = graph.filter(isLayout);
        this.buffer = graph
            .filter(element => !isGroup(element))
            .sort((ea, eb) => ea.zIndex - eb.zIndex);
    }

    /** Reflows every layout in the scene, outermost-first, so parents reposition nested layouts
     * before those lay out their own children. Called by the renderer each tick. */
    public reflow(): void {
        this.layouts.forEach(layout => layout.reflow());
    }

    /**
     * Requests a single coalesced render on the next frame. If the scene's graph changed it is
     * rebuffered first (so the render never paints a stale buffer). The render itself is skipped
     * when a renderer loop is actively driving the scene, or when `renderOnUpdate` is disabled.
     */
    private requestRender(): void {
        this._frame(() => {
            if (this._graphDirty) {
                this.rebuffer();
                this.context.invalidateTrackedElements();
                this._graphDirty = false;
            }

            if (this._renderOnUpdate && !this.renderer?.isRunning) {
                this.render();
            }
        });
    }

    /** Destroys the scene (and optionally the context), removing all children and cleaning up event subscriptions. */
    public destroy(includeContext: boolean = false): void {
        this.clear();

        if (includeContext) {
            this.context.destroy();
        }

        super.destroy();
    }

    /** Clears the context and renders the entire element buffer in z-index order. */
    public render(): void {
        this.context.batch(() => {
            this.buffer.forEach(element => element.render(this.context));
        });
    }

}

/** Factory function that creates a new `Scene` instance from a context, selector, or element. */
export function createScene(...options: ConstructorParameters<typeof Scene>) {
    return new Scene(...options);
}
