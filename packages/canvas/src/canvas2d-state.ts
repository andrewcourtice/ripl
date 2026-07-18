import {
    applyCanvasFill,
    applyCanvasStroke,
    canvasDrawImage,
    canvasIsPointInPath,
    canvasIsPointInStroke,
    canvasMeasureText,
    getCanvasGradientBounds,
    setCanvasFill,
    setCanvasStroke,
} from './helpers';

import {
    CanvasPath,
} from './path';

import {
    isGradientString,
} from '@ripl/core';

import type {
    Box,
    Context,
    ContextPath,
    ContextText,
    Direction,
    FillRule,
    FontKerning,
    LineCap,
    LineJoin,
    TextAlignment,
    TextBaseline,
} from '@ripl/core';

/** Constructor type for (possibly abstract) classes, used to compose mixins over a `Context` base. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AbstractConstructor<TInstance = object> = abstract new (...args: any[]) => TInstance;

/**
 * The shared `CanvasRenderingContext2D` state-plumbing surface applied by {@link canvas2DStateMixin}:
 * paint, line, shadow, and text accessors mapped directly onto the native 2D context, plus the
 * drawing, transform, measurement, and hit-testing operations common to every canvas-backed context.
 */
export interface Canvas2DState {
    /** The current fill style — a colour or CSS gradient string. */
    fill: string;
    /** The current filter applied to drawing operations. */
    filter: string;
    /** The current text direction. */
    direction: Direction;
    /** The current font used for text rendering. */
    font: string;
    /** The current font kerning mode. */
    fontKerning: FontKerning;
    /** The current global opacity applied to drawing operations. */
    opacity: number;
    /** The current compositing operation used when drawing. */
    globalCompositeOperation: unknown;
    /** The current line cap style for stroke endpoints. */
    lineCap: LineCap;
    /** The current line dash pattern. */
    lineDash: number[];
    /** The current offset into the line dash pattern. */
    lineDashOffset: number;
    /** The current line join style for stroke corners. */
    lineJoin: LineJoin;
    /** The current stroke width, in pixels. */
    lineWidth: number;
    /** The current miter limit for stroke joins. */
    miterLimit: number;
    /** The current shadow blur radius. */
    shadowBlur: number;
    /** The current shadow colour. */
    shadowColor: string;
    /** The current horizontal shadow offset. */
    shadowOffsetX: number;
    /** The current vertical shadow offset. */
    shadowOffsetY: number;
    /** The current stroke style — a colour or CSS gradient string. */
    stroke: string;
    /** The current horizontal text alignment. */
    textAlign: TextAlignment;
    /** The current vertical text baseline. */
    textBaseline: TextBaseline;
    /** Saves the current drawing state onto the state stack. */
    save(): void;
    /** Restores the most recently saved drawing state from the stack; a no-op when the stack is empty. */
    restore(): void;
    /** Clears the entire canvas surface. */
    clear(): void;
    /** Resets the canvas context to its default state. */
    reset(): void;
    /** Applies a rotation transformation, in radians. */
    rotate(angle: number): void;
    /** Applies a scale transformation. */
    scale(x: number, y: number): void;
    /** Applies a translation transformation. */
    translate(x: number, y: number): void;
    /**
     * Replaces the current transformation matrix with `[a, b, c, d, e, f]`.
     * @param a Horizontal scaling.
     * @param b Vertical skewing.
     * @param c Horizontal skewing.
     * @param d Vertical scaling.
     * @param e Horizontal translation.
     * @param f Vertical translation.
     */
    // eslint-disable-next-line id-length
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    /**
     * Multiplies the current transformation matrix by `[a, b, c, d, e, f]`.
     * @param a Horizontal scaling.
     * @param b Vertical skewing.
     * @param c Horizontal skewing.
     * @param d Vertical scaling.
     * @param e Horizontal translation.
     * @param f Vertical translation.
     */
    // eslint-disable-next-line id-length
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    /** Measures text dimensions using the canvas context's current font or an optional override. */
    measureText(text: string, font?: string): TextMetrics;
    /** Creates a new {@link CanvasPath}, optionally reusing an id for diffing efficiency. */
    createPath(id?: string): CanvasPath;
    /** Clips subsequent drawing operations to the given path. */
    applyClip(path: CanvasPath, fillRule?: FillRule): void;
    /** Draws an image onto the canvas at the given position and optional size. */
    drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void;
    /** Fills the given path or text element using the current fill style. */
    applyFill(element: CanvasPath | ContextText, fillRule?: FillRule): void;
    /** Strokes the given path or text element using the current stroke style. */
    applyStroke(element: CanvasPath | ContextText): void;
    /** Tests whether a point lies inside the filled region of a path. */
    isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean;
    /** Tests whether a point lies on the stroked outline of a path. */
    isPointInStroke(path: ContextPath, x: number, y: number): boolean;
}

/**
 * Mixin applying the shared `CanvasRenderingContext2D` state plumbing (see {@link Canvas2DState})
 * to a `Context` base class. Concrete subclasses assign the `protected context` backing field
 * (declared here, so constructor assignment is not clobbered by class-field initialisation) and may
 * override the protected `gradientBounds()` hook to change which bounding box gradients resolve
 * against — the default is the current render element's local (untransformed) box.
 *
 * @param Base - The `Context` base class to extend (e.g. `DOMContext<HTMLCanvasElement>` or `Context3D`).
 * @returns An abstract class combining `Base` with the shared canvas 2D state surface.
 */
export function canvas2DStateMixin<TBase extends AbstractConstructor<Context>>(Base: TBase): AbstractConstructor<Canvas2DState> & TBase {
    abstract class Canvas2DStateContext extends Base {

        declare protected context: CanvasRenderingContext2D;
        private _fillCSS: string = '';
        private _strokeCSS: string = '';

        public get fill(): string {
            return this._fillCSS || this.context.fillStyle as string;
        }

        public set fill(value) {
            this._fillCSS = value;

            // Fast path: plain colours skip bounding-box resolution and gradient parsing entirely,
            // which otherwise ran for every element on every frame.
            if (isGradientString(value)) {
                const bounds = getCanvasGradientBounds(this.gradientBounds(), this.width, this.height);
                setCanvasFill(this.context, value, bounds);
            } else {
                this.context.fillStyle = value;
            }
        }

        public get filter(): string {
            return this.context.filter;
        }

        public set filter(value) {
            this.context.filter = value;
        }

        public get direction(): Direction {
            return this.context.direction;
        }

        public set direction(value) {
            this.context.direction = value;
        }

        public get font(): string {
            return this.context.font;
        }

        public set font(value) {
            this.context.font = value;
        }

        public get fontKerning(): FontKerning {
            return this.context.fontKerning;
        }

        public set fontKerning(value) {
            this.context.fontKerning = value;
        }

        public get opacity(): number {
            return this.context.globalAlpha;
        }

        public set opacity(value) {
            this.context.globalAlpha = value;
        }

        public get globalCompositeOperation(): unknown {
            return this.context.globalCompositeOperation;
        }

        public set globalCompositeOperation(value) {
            this.context.globalCompositeOperation = value as GlobalCompositeOperation;
        }

        public get lineCap(): LineCap {
            return this.context.lineCap;
        }

        public set lineCap(value) {
            this.context.lineCap = value;
        }

        public get lineDash(): number[] {
            return this.context.getLineDash();
        }

        public set lineDash(value) {
            this.context.setLineDash(value);
        }

        public get lineDashOffset(): number {
            return this.context.lineDashOffset;
        }

        public set lineDashOffset(value) {
            this.context.lineDashOffset = value;
        }

        public get lineJoin(): LineJoin {
            return this.context.lineJoin;
        }

        public set lineJoin(value) {
            this.context.lineJoin = value;
        }

        public get lineWidth(): number {
            return this.context.lineWidth;
        }

        public set lineWidth(value) {
            this.context.lineWidth = value;
        }

        public get miterLimit(): number {
            return this.context.miterLimit;
        }

        public set miterLimit(value) {
            this.context.miterLimit = value;
        }

        public get shadowBlur(): number {
            return this.context.shadowBlur;
        }

        public set shadowBlur(value) {
            this.context.shadowBlur = value;
        }

        public get shadowColor(): string {
            return this.context.shadowColor;
        }

        public set shadowColor(value) {
            this.context.shadowColor = value;
        }

        public get shadowOffsetX(): number {
            return this.context.shadowOffsetX;
        }

        public set shadowOffsetX(value) {
            this.context.shadowOffsetX = value;
        }

        public get shadowOffsetY(): number {
            return this.context.shadowOffsetY;
        }

        public set shadowOffsetY(value) {
            this.context.shadowOffsetY = value;
        }

        public get stroke(): string {
            return this._strokeCSS || this.context.strokeStyle as string;
        }

        public set stroke(value) {
            this._strokeCSS = value;

            // Fast path: plain colours skip bounding-box resolution and gradient parsing entirely.
            if (isGradientString(value)) {
                const bounds = getCanvasGradientBounds(this.gradientBounds(), this.width, this.height);
                setCanvasStroke(this.context, value, bounds);
            } else {
                this.context.strokeStyle = value;
            }
        }

        public get textAlign(): TextAlignment {
            return this.context.textAlign;
        }

        public set textAlign(value) {
            this.context.textAlign = value;
        }

        public get textBaseline(): TextBaseline {
            return this.context.textBaseline;
        }

        public set textBaseline(value) {
            this.context.textBaseline = value;
        }

        // Hook: the box gradients resolve against. 2D contexts use the element's local
        // (untransformed) box; the 3D canvas context overrides this to use the world box because
        // its projected faces live in screen space.
        protected gradientBounds(): Box | undefined {
            return this.currentRenderElement?.getBoundingBox?.(true);
        }

        public save(): void {
            this.saveDepth += 1;
            return this.context.save();
        }

        public restore(): void {
            if (this.saveDepth === 0) {
                return;
            }

            this.saveDepth -= 1;
            return this.context.restore();
        }

        public clear(): void {
            return this.context.clearRect(0, 0, this.width, this.height);
        }

        public reset(): void {
            return this.context.reset();
        }

        public rotate(angle: number): void {
            return this.context.rotate(angle);
        }

        public scale(x: number, y: number): void {
            return this.context.scale(x, y);
        }

        public translate(x: number, y: number): void {
            return this.context.translate(x, y);
        }

        // eslint-disable-next-line id-length
        public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
            return this.context.setTransform(a, b, c, d, e, f);
        }

        // eslint-disable-next-line id-length
        public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
            return this.context.transform(a, b, c, d, e, f);
        }

        public measureText(text: string, font?: string): TextMetrics {
            return canvasMeasureText(this.context, text, font);
        }

        public createPath(id?: string): CanvasPath {
            return new CanvasPath(id);
        }

        public applyClip(path: CanvasPath, fillRule?: FillRule): void {
            return this.context.clip(path.ref, fillRule);
        }

        public drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
            return canvasDrawImage(this.context, image, x, y, width, height);
        }

        public applyFill(element: CanvasPath | ContextText, fillRule?: FillRule): void {
            return applyCanvasFill(this.context, element, fillRule);
        }

        public applyStroke(element: CanvasPath | ContextText): void {
            return applyCanvasStroke(this.context, element);
        }

        public isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
            if (path instanceof CanvasPath) {
                return canvasIsPointInPath(this.context, path, x, y, fillRule);
            }

            return false;
        }

        public isPointInStroke(path: ContextPath, x: number, y: number): boolean {
            if (path instanceof CanvasPath) {
                return canvasIsPointInStroke(this.context, path, x, y);
            }

            return false;
        }

    }

    return Canvas2DStateContext;
}
