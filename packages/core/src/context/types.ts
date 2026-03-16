import {
    EventMap,
} from '../core';

import {
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
    isPointer: boolean;
}

/** Minimal interface for any element that can be rendered and hit-tested by a context. */
export interface RenderElement {
    readonly id: string;
    parent?: RenderElement;
    abstract: boolean;
    pointerEvents: RenderElementPointerEvents;
    zIndex: number;
    getBoundingBox?(): Box;
    has(event: string): boolean;
    intersectsWith(x: number, y: number, options?: Partial<RenderElementIntersectionOptions>): boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(type: string, data: any): void;
}

/** Event map for a rendering context, including resize and pointer events. */
export interface ContextEventMap extends EventMap {
    resize: null;
    mouseenter: null;
    mouseleave: null;
    mousemove: {
        x: number;
        y: number;
    };
    click: {
        x: number;
        y: number;
    };
    dragstart: {
        x: number;
        y: number;
    };
    drag: {
        x: number;
        y: number;
        startX: number;
        startY: number;
        deltaX: number;
        deltaY: number;
    };
    dragend: {
        x: number;
        y: number;
        startX: number;
        startY: number;
        deltaX: number;
        deltaY: number;
    };
}

/** Options for constructing a rendering context. */
export interface ContextOptions {
    interactive?: boolean;
    dragThreshold?: number;
}

/** Options for creating a text element within the context. */
export type TextOptions = {
    id?: string;
    x: number;
    y: number;
    content: string;
    maxWidth?: number;
    pathData?: string;
    startOffset?: number;
};

/** Minimal interface for context-level elements (paths, text) identified by a unique id. */
export interface ContextElement {
    readonly id: string;
}

/** The full set of visual state properties inherited by every renderable element. */
export interface BaseState {
    fill: string;
    filter: string;
    direction: Direction;
    font: string;
    fontKerning: FontKerning;
    opacity: number;
    globalCompositeOperation: unknown;
    lineCap: LineCap;
    lineDash: number[];
    lineDashOffset: number;
    lineJoin: LineJoin;
    lineWidth: number;
    miterLimit: number;
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
    stroke: string;
    textAlign: TextAlignment;
    textBaseline: TextBaseline;
    zIndex: number;
    translateX: number;
    translateY: number;
    transformScaleX: number;
    transformScaleY: number;
    rotation: Rotation;
    transformOriginX: TransformOrigin;
    transformOriginY: TransformOrigin;
}

/** Options for measuring text dimensions. */
export type MeasureTextOptions = {
    context?: CanvasRenderingContext2D;
    font?: CanvasRenderingContext2D['font'];
};