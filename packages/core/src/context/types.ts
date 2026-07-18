import type {
    Context,
} from './context';

import type {
    EventMap,
} from '../core';

import type {
    Box,
} from '../math';

/** Text direction for the rendering context. */
export type Direction = 'inherit' | 'ltr' | 'rtl';

/** Font kerning mode for the rendering context. */
export type FontKerning = 'auto' | 'none' | 'normal';

/** Line cap style for stroke endpoints. */
export type LineCap = 'butt' | 'round' | 'square';

/** Line join style for stroke corners. */
export type LineJoin = 'bevel' | 'miter' | 'round';

/** Horizontal text alignment relative to the drawing position. */
export type TextAlignment = 'center' | 'end' | 'left' | 'right' | 'start';

/** Vertical text baseline used when rendering text. */
export type TextBaseline = 'alphabetic' | 'bottom' | 'hanging' | 'ideographic' | 'middle' | 'top';

/** Fill rule algorithm used to determine if a point is inside a path. */
export type FillRule = 'evenodd' | 'nonzero';

/** Transform origin value — a numeric pixel offset or a percentage string. */
export type TransformOrigin = number | string;

/** Rotation value — a numeric radian value or a string with `deg`/`rad` suffix. */
export type Rotation = number | string;

/** Controls which pointer events a render element responds to during hit testing. */
export type RenderElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';

/** Options for render element intersection testing. */
export interface RenderElementIntersectionOptions {
    /** Whether the test originates from a pointer interaction rather than a programmatic query. */
    isPointer: boolean;
}

/** Minimal interface for any element that can be rendered and hit-tested by a context. */
export interface RenderElement {
    /** Unique identifier for this element. */
    readonly id: string;
    /** Parent element in the scene graph, if any. */
    parent?: RenderElement;
    /** Whether the element is abstract and therefore excluded from the context's rendered-elements list. */
    abstract: boolean;
    /** Which regions of the element respond to pointer hit testing. */
    pointerEvents: RenderElementPointerEvents;
    /** Stacking order used when sorting hit-test results; higher values are prioritised. */
    zIndex: number;
    /** Returns the element's bounding box: the on-screen (world) box, or the raw local box when `local` is `true`. */
    getBoundingBox?(local?: boolean): Box;
    /** Returns whether the element has any listeners registered for the given event. */
    has(event: string): boolean;
    /** Tests whether the point `(x, y)` lies within the element, honouring its pointer-event region. */
    intersectsWith(x: number, y: number, options?: Partial<RenderElementIntersectionOptions>): boolean;
    /** Emits an event of the given type carrying the given data on this element. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(type: string, data: any): void;
}

/** Event map for a rendering context, including resize and pointer events. */
export interface ContextEventMap extends EventMap {
    /** Emitted when the context's rendering surface is resized. */
    resize: null;
    /** Emitted when the pointer enters the context surface. */
    mouseenter: null;
    /** Emitted when the pointer leaves the context surface. */
    mouseleave: null;
    /** Emitted as the pointer moves over the surface, carrying its position. */
    mousemove: {
        /** X coordinate of the pointer, in surface pixel space. */
        x: number;
        /** Y coordinate of the pointer, in surface pixel space. */
        y: number;
    };
    /** Emitted when the surface is clicked, carrying the pointer position. */
    click: {
        /** X coordinate of the pointer, in surface pixel space. */
        x: number;
        /** Y coordinate of the pointer, in surface pixel space. */
        y: number;
    };
    /** Emitted when a drag gesture begins, carrying the start position. */
    dragstart: {
        /** X coordinate at which the drag started, in surface pixel space. */
        x: number;
        /** Y coordinate at which the drag started, in surface pixel space. */
        y: number;
    };
    /** Emitted continuously during a drag, carrying the current position, drag start, and delta from the start. */
    drag: {
        /** Current X coordinate of the pointer, in surface pixel space. */
        x: number;
        /** Current Y coordinate of the pointer, in surface pixel space. */
        y: number;
        /** X coordinate at which the drag started, in surface pixel space. */
        startX: number;
        /** Y coordinate at which the drag started, in surface pixel space. */
        startY: number;
        /** Horizontal distance moved since the drag started, in pixels. */
        deltaX: number;
        /** Vertical distance moved since the drag started, in pixels. */
        deltaY: number;
    };
    /** Emitted when a drag gesture ends, carrying the final position, drag start, and total delta. */
    dragend: {
        /** Final X coordinate of the pointer, in surface pixel space. */
        x: number;
        /** Final Y coordinate of the pointer, in surface pixel space. */
        y: number;
        /** X coordinate at which the drag started, in surface pixel space. */
        startX: number;
        /** Y coordinate at which the drag started, in surface pixel space. */
        startY: number;
        /** Total horizontal distance moved over the drag, in pixels. */
        deltaX: number;
        /** Total vertical distance moved over the drag, in pixels. */
        deltaY: number;
    };
}

/** Options for constructing a rendering context. */
export interface ContextOptions<TMeta extends Record<string, unknown> = Record<string, unknown>> {
    /** Whether the context listens for and emits pointer and drag events. */
    interactive?: boolean;
    /** Minimum pointer movement, in pixels, before a drag gesture is recognised. */
    dragThreshold?: number;
    /** Arbitrary metadata attached to the context. */
    meta?: TMeta;
}

/**
 * The factory shape every rendering backend exports as `createContext`: target-first, with a
 * backend-specific target and options type. Backends legitimately diverge on `TTarget` — DOM
 * backends (canvas, SVG, 3D) accept a `string | HTMLElement` mount target while non-DOM backends
 * accept their own output adapter (e.g. the terminal backend's `TerminalOutput`). Synchronous
 * backends return the constructed context directly and should conformance-check their factory
 * against this type; asynchronous backends (e.g. WebGPU, which must await device acquisition)
 * export the same target-first shape but return a `Promise` of the context instead.
 *
 * @typeParam TTarget - The backend-specific target the context is created against.
 * @typeParam TOptions - The backend-specific options accepted by the factory.
 * @typeParam TContext - The concrete {@link Context} subclass the factory constructs.
 */
export type ContextFactory<TTarget, TOptions extends ContextOptions, TContext extends Context> = (target: TTarget, options?: TOptions) => TContext;

/**
 * Snapshot exporter returned by {@link Context.export}. Each method serializes the snapshot that
 * was captured at the moment `export()` was called, so later mutations to the context do not
 * affect the exported result. Contexts implement the formats relevant to them (see each context's
 * `export()` for specifics); unsupported formats throw a descriptive error.
 */
export interface ContextExport {
    /** The context's native string form — SVG markup, a PNG data URL, or terminal text. */
    toString(): string;
    /** An openable `Blob` object URL — `image/svg+xml` for SVG, `image/png` for raster contexts. */
    toURL(): string;
    /**
     * Low-level, environment-agnostic pixel data. Promise-wrapped so contexts that must rasterize
     * asynchronously (e.g. SVG) share one signature; pixel-backed contexts resolve immediately.
     */
    toImage(): Promise<ImageData>;
}

/** Options for creating a text element within the context. */
export type TextOptions = {
    /** Optional stable id; a unique id is generated when omitted. */
    id?: string;
    /** X coordinate of the text's anchor position. */
    x: number;
    /** Y coordinate of the text's anchor position. */
    y: number;
    /** The text string to render. */
    content: string;
    /** Maximum width, in pixels, the text is scaled to fit within. */
    maxWidth?: number;
    /** SVG path data along which the text is laid out, for text-on-a-path. */
    pathData?: string;
    /** Offset along the text path at which rendering begins. */
    startOffset?: number;
};

/** Minimal interface for context-level elements (paths, text) identified by a unique id. */
export interface ContextElement {
    /** Unique identifier for this element. */
    readonly id: string;
}

/** The full set of visual state properties inherited by every renderable element. */
export interface BaseState {
    /** Fill style (CSS colour, gradient, or pattern) used to paint filled regions. */
    fill: string;
    /** CSS filter string applied to subsequent drawing operations (e.g. `blur(4px)`). */
    filter: string;
    /** Directionality used when rendering text. */
    direction: Direction;
    /** CSS font shorthand used when rendering text. */
    font: string;
    /** Whether font kerning is applied when rendering text. */
    fontKerning: FontKerning;
    /** Global alpha applied to everything drawn, from 0 to 1. */
    opacity: number;
    /** Compositing operation controlling how new drawing is blended with existing content. */
    globalCompositeOperation: unknown;
    /** Cap style drawn at the endpoints of stroked lines. */
    lineCap: LineCap;
    /** Dash pattern as alternating stroke and gap lengths; empty for a solid line. */
    lineDash: number[];
    /** Distance into the line dash pattern at which dashing begins. */
    lineDashOffset: number;
    /** Join style drawn where two stroked segments meet. */
    lineJoin: LineJoin;
    /** Width, in pixels, of stroked lines. */
    lineWidth: number;
    /** Miter length limit ratio applied to `miter` line joins. */
    miterLimit: number;
    /** Gaussian blur radius applied to drawn shadows. */
    shadowBlur: number;
    /** Colour of drawn shadows. */
    shadowColor: string;
    /** Horizontal offset, in pixels, of drawn shadows. */
    shadowOffsetX: number;
    /** Vertical offset, in pixels, of drawn shadows. */
    shadowOffsetY: number;
    /** Stroke style (CSS colour, gradient, or pattern) used to paint outlines. */
    stroke: string;
    /** Horizontal alignment of text relative to the drawing position. */
    textAlign: TextAlignment;
    /** Vertical baseline used when positioning text. */
    textBaseline: TextBaseline;
    /** Stacking order used to sort elements during rendering; higher values draw on top. */
    zIndex: number;
    /** Horizontal translation, in pixels, applied to the element's transform. */
    translateX: number;
    /** Vertical translation, in pixels, applied to the element's transform. */
    translateY: number;
    /** Horizontal scale factor applied to the element's transform. */
    transformScaleX: number;
    /** Vertical scale factor applied to the element's transform. */
    transformScaleY: number;
    /** Rotation applied to the element's transform, as radians or a `deg`/`rad` string. */
    rotation: Rotation;
    /** Horizontal origin about which rotation and scaling are applied. */
    transformOriginX: TransformOrigin;
    /** Vertical origin about which rotation and scaling are applied. */
    transformOriginY: TransformOrigin;
}

/** Options for measuring text dimensions. */
export type MeasureTextOptions = {
    /** Canvas 2D context used to perform the measurement. */
    context?: CanvasRenderingContext2D;
    /** CSS font shorthand applied before measuring. */
    font?: CanvasRenderingContext2D['font'];
    /** Horizontal text alignment used while measuring. */
    textAlign?: TextAlignment;
    /** Vertical text baseline used while measuring. */
    textBaseline?: TextBaseline;
};