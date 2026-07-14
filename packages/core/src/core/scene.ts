import type {
    Element,
    ElementEventMap,
} from './element';

import type {
    Context,
} from '../context';

import {
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
} from './group';

import type {
    GroupOptions,
} from './group';

import {
    typeIsNil,
} from '@ripl/utilities';


/**
 * Event map for the scene. Resize is deliberately *not* re-emitted here — listen for it on the
 * scene's `context` instead (`scene.context.on('resize', …)`), the single source of truth.
 */
export type SceneEventMap = ElementEventMap;

/** Options for constructing a scene, extending group options with an optional auto-render-on-resize flag. */
export interface SceneOptions extends GroupOptions {
    /** Whether the scene re-renders automatically when its context is resized. Defaults to `true`. */
    renderOnResize?: boolean;
    /** Whether the scene re-renders automatically when an element's state is updated. */
    renderOnUpdate?: boolean;
}

/** The top-level group bound to a rendering context, maintaining a hoisted flat buffer for O(n) rendering. */
export class Scene<TContext extends Context = Context> extends Group<SceneEventMap> {

    /** The rendering {@link Context} this scene draws to. */
    public context: TContext;

    /** The hoisted flat buffer of all renderable descendants, kept sorted by z-index for O(n) rendering. */
    public buffer: Element[];

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
            // renderOnUpdate = true,
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
        this.buffer = this.graph();

        const requestFrame = createFrameBuffer();

        this.retain(context.on('resize', () => {
            if (renderOnResize && !!this.buffer.length) {
                this.render();
            }
        }));

        this.on('graph', () => requestFrame(() => {
            this._rebuffer();
            context.invalidateTrackedElements();
        }));

        // this.on('updated', ({ data }) => requestFrame(() => {
        //     if (data.key === 'zIndex') {
        //         this.rebuffer();
        //     }

        //     this.render();
        // }));
    }

    private _rebuffer() {
        this.buffer = this.graph().sort((ea, eb) => ea.zIndex - eb.zIndex);
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
