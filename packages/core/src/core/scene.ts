import type {
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
} from './group';

import type {
    GroupOptions,
} from './group';


/** Event map for the scene, adding a `resize` event to the standard element events. */
export interface SceneEventMap extends ElementEventMap {
    resize: null;
}

/** Options for constructing a scene, extending group options with an optional auto-render-on-resize flag. */
export interface SceneOptions extends GroupOptions {
    renderOnResize?: boolean;
}

/** The top-level group bound to a rendering context, maintaining a hoisted flat buffer for O(n) rendering. */
export class Scene<TContext extends Context = Context> extends Group<SceneEventMap> {

    public context: TContext;

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

        const font = factory.getComputedStyle
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
            this.emit('resize', null);

            if (renderOnResize && !!this.buffer.length) {
                this.render();
            }
        }));

        this.on('graph', () => requestFrame(() => {
            this.buffer = this.graph().sort((ea, eb) => ea.zIndex - eb.zIndex);
            context.invalidateTrackedElements('');
        }));
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
        this.context.clear();
        this.context.markRenderStart();
        this.buffer.forEach(element => element.render(this.context));
        this.context.markRenderEnd();
    }

}

/** Factory function that creates a new `Scene` instance from a context, selector, or element. */
export function createScene(...options: ConstructorParameters<typeof Scene>) {
    return new Scene(...options);
}
