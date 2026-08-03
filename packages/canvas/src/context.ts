import {
    canvas2DStateMixin,
} from './mixins';

import {
    releaseCanvasPaintCache,
    rescaleCanvas,
} from './utilities';

import type {
    ContextExport,
    ContextFactory,
    ContextOptions,
} from '@ripl/core';

import {
    createCanvasExport,
    DOMContext,
} from '@ripl/dom';

/** Fixed-generic alias so the mixin can extend `DOMContext` without a generic base class expression. */
abstract class CanvasDOMBase extends DOMContext<HTMLCanvasElement> {}

/** Canvas 2D rendering context implementation, mapping the unified API to `CanvasRenderingContext2D`. */
export class CanvasContext extends canvas2DStateMixin(CanvasDOMBase) {

    declare protected context: CanvasRenderingContext2D;

    /** Canvas path creation is a side-effect-free `new CanvasPath()`, so cached paths may be reused across render cycles. */
    public get supportsPathCaching(): boolean {
        return true;
    }

    constructor(target: string | HTMLElement, options?: ContextOptions) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Failed to acquire a 2D canvas rendering context: the environment does not support the Canvas API');
        }

        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        super('canvas', target, canvas, options);

        this.context = context;
        this.init();
    }

    // Gated on the logical size, never the backing store: a fresh canvas is already 300x150.
    protected rescale(width: number, height: number) {
        if (width === this.width && height === this.height) {
            return;
        }

        const {
            scaleX,
            scaleY,
        } = rescaleCanvas(this.element, this.context, width, height);

        this.width = width;
        this.height = height;
        this.scaleX = scaleX;
        this.scaleY = scaleY;

        // Not `super.rescale`: it installs identity scales and emits before the DPR-aware ones land.
        this.emit('resize', null);
    }

    /** Captures a snapshot of the canvas and returns format-specific exporters (see {@link ContextExport}). */
    public export(): ContextExport {
        return createCanvasExport(this.element);
    }

    /** Destroys the context, releasing its cached paint and the canvas backing store on top of the base teardown. */
    public destroy(): void {
        releaseCanvasPaintCache(this.context);

        // A detached canvas holds width*height*4 bytes until it is collected; zeroing frees it now.
        this.element.width = 0;
        this.element.height = 0;

        super.destroy();
    }

}

/**
 * Creates a Canvas 2D rendering context (a concrete `Context`) attached to the given DOM target.
 *
 * @param target - A DOM element or CSS selector identifying the element to mount the canvas into.
 * @param options - Optional context configuration such as interactivity and metadata.
 * @returns The constructed {@link CanvasContext}.
 * @example
 * const context = createContext(target);
 */
export function createContext(target: string | HTMLElement, options?: ContextOptions): CanvasContext {
    return new CanvasContext(target, options);
}

// Compile-time conformance: the canvas backend factory matches the shared `ContextFactory` contract.
createContext satisfies ContextFactory<string | HTMLElement, ContextOptions, CanvasContext>;
