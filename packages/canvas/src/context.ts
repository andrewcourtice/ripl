import {
    ContextPath,
    isGradientString,
    TAU,
} from '@ripl/core';

import type {
    BorderRadius,
    ContextExport,
    ContextOptions,
    ContextText,
    Direction,
    FillRule,
    FontKerning,
    LineCap,
    LineJoin,
    TextAlignment,
    TextBaseline,
} from '@ripl/core';

import {
    createCanvasExport,
    DOMContext,
} from '@ripl/dom';

import {
    applyCanvasFill,
    applyCanvasStroke,
    canvasDrawImage,
    canvasIsPointInPath,
    canvasIsPointInStroke,
    canvasMeasureText,
    getCanvasGradientBounds,
    rescaleCanvas,
    setCanvasFill,
    setCanvasStroke,
} from './helpers';

/** Canvas-specific path implementation backed by a native `Path2D` object. */
export class CanvasPath extends ContextPath {

    /** The underlying native `Path2D` object accumulating this path's drawing commands. */
    public readonly ref: Path2D;

    constructor(id?: string) {
        super(id);
        this.ref = new Path2D();
    }

    /** Adds an arc centred at `(x, y)` with the given radius to the path. */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.ref.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }

    /** Adds an arc connecting two tangents defined by the given points to the path. */
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        return this.ref.arcTo(x1, y1, x2, y2, radius);
    }

    /** Adds a full circle centred at `(x, y)` to the path. */
    public circle(x: number, y: number, radius: number): void {
        this.arc(x, y, radius, 0, TAU);
    }

    /** Adds a cubic Bézier curve to the path. */
    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        return this.ref.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    /** Closes the current sub-path with a straight line back to its start. */
    public closePath(): void {
        return this.ref.closePath();
    }

    /** Adds an elliptical arc centred at `(x, y)` to the path. */
    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.ref.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }

    /** Adds a straight line from the current point to `(x, y)`. */
    public lineTo(x: number, y: number): void {
        return this.ref.lineTo(x, y);
    }

    /** Moves the current point to `(x, y)` without adding a line. */
    public moveTo(x: number, y: number): void {
        return this.ref.moveTo(x, y);
    }

    /** Adds a quadratic Bézier curve to the path. */
    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        return this.ref.quadraticCurveTo(cpx, cpy, x, y);
    }

    /** Adds a rectangle to the path. */
    public rect(x: number, y: number, width: number, height: number): void {
        return this.ref.rect(x, y, width, height);
    }

    /** Adds a rounded rectangle to the path, using the given corner radii. */
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        return this.ref.roundRect(x, y, width, height, radii);
    }

    /** Appends another path's commands to this path. */
    public addPath(path: ContextPath): void {
        if (path instanceof CanvasPath) {
            this.ref.addPath(path.ref);
        }
    }

}

/** Canvas 2D rendering context implementation, mapping the unified API to `CanvasRenderingContext2D`. */
export class CanvasContext extends DOMContext<HTMLCanvasElement> {

    protected context: CanvasRenderingContext2D;
    private _fillCSS: string = '';
    private _strokeCSS: string = '';

    /** The current fill style — a colour or CSS gradient string. */
    public get fill(): string {
        return this._fillCSS || this.context.fillStyle as string;
    }

    public set fill(value) {
        this._fillCSS = value;

        // Fast path: plain colours skip bounding-box resolution and gradient parsing entirely,
        // which otherwise ran for every element on every frame.
        if (isGradientString(value)) {
            const bounds = getCanvasGradientBounds(this.currentRenderElement?.getLocalBoundingBox?.(), this.width, this.height);
            setCanvasFill(this.context, value, bounds);
        } else {
            this.context.fillStyle = value;
        }
    }

    /** The current filter applied to drawing operations. */
    public get filter(): string {
        return this.context.filter;
    }

    public set filter(value) {
        this.context.filter = value;
    }

    /** The current text direction. */
    public get direction(): Direction {
        return this.context.direction;
    }

    public set direction(value) {
        this.context.direction = value;
    }

    /** The current font used for text rendering. */
    public get font(): string {
        return this.context.font;
    }

    public set font(value) {
        this.context.font = value;
    }

    /** The current font kerning mode. */
    public get fontKerning(): FontKerning {
        return this.context.fontKerning;
    }

    public set fontKerning(value) {
        this.context.fontKerning = value;
    }

    /** The current global opacity applied to drawing operations. */
    public get opacity(): number {
        return this.context.globalAlpha;
    }

    public set opacity(value) {
        this.context.globalAlpha = value;
    }

    /** The current compositing operation used when drawing. */
    public get globalCompositeOperation(): unknown {
        return this.context.globalCompositeOperation;
    }

    public set globalCompositeOperation(value) {
        this.context.globalCompositeOperation = value as GlobalCompositeOperation;
    }

    /** The current line cap style for stroke endpoints. */
    public get lineCap(): LineCap {
        return this.context.lineCap;
    }

    public set lineCap(value) {
        this.context.lineCap = value;
    }

    /** The current line dash pattern. */
    public get lineDash(): number[] {
        return this.context.getLineDash();
    }

    public set lineDash(value) {
        this.context.setLineDash(value);
    }

    /** The current offset into the line dash pattern. */
    public get lineDashOffset(): number {
        return this.context.lineDashOffset;
    }

    public set lineDashOffset(value) {
        this.context.lineDashOffset = value;
    }

    /** The current line join style for stroke corners. */
    public get lineJoin(): LineJoin {
        return this.context.lineJoin;
    }

    public set lineJoin(value) {
        this.context.lineJoin = value;
    }

    /** The current stroke width, in pixels. */
    public get lineWidth(): number {
        return this.context.lineWidth;
    }

    public set lineWidth(value) {
        this.context.lineWidth = value;
    }

    /** The current miter limit for stroke joins. */
    public get miterLimit(): number {
        return this.context.miterLimit;
    }

    public set miterLimit(value) {
        this.context.miterLimit = value;
    }

    /** The current shadow blur radius. */
    public get shadowBlur(): number {
        return this.context.shadowBlur;
    }

    public set shadowBlur(value) {
        this.context.shadowBlur = value;
    }

    /** The current shadow colour. */
    public get shadowColor(): string {
        return this.context.shadowColor;
    }

    public set shadowColor(value) {
        this.context.shadowColor = value;
    }

    /** The current horizontal shadow offset. */
    public get shadowOffsetX(): number {
        return this.context.shadowOffsetX;
    }

    public set shadowOffsetX(value) {
        this.context.shadowOffsetX = value;
    }

    /** The current vertical shadow offset. */
    public get shadowOffsetY(): number {
        return this.context.shadowOffsetY;
    }

    public set shadowOffsetY(value) {
        this.context.shadowOffsetY = value;
    }

    /** The current stroke style — a colour or CSS gradient string. */
    public get stroke(): string {
        return this._strokeCSS || this.context.strokeStyle as string;
    }

    public set stroke(value) {
        this._strokeCSS = value;

        // Fast path: plain colours skip bounding-box resolution and gradient parsing entirely.
        if (isGradientString(value)) {
            const bounds = getCanvasGradientBounds(this.currentRenderElement?.getLocalBoundingBox?.(), this.width, this.height);
            setCanvasStroke(this.context, value, bounds);
        } else {
            this.context.strokeStyle = value;
        }
    }

    /** The current horizontal text alignment. */
    public get textAlign(): TextAlignment {
        return this.context.textAlign;
    }

    public set textAlign(value) {
        this.context.textAlign = value;
    }

    /** The current vertical text baseline. */
    public get textBaseline(): TextBaseline {
        return this.context.textBaseline;
    }

    public set textBaseline(value) {
        this.context.textBaseline = value;
    }

    constructor(target: string | HTMLElement, options?: ContextOptions) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error();
        }

        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        super('canvas', target, canvas, options);

        this.context = context;
        this.init();
    }

    protected rescale(width: number, height: number) {
        const result = rescaleCanvas(this.element, this.context, width, height);

        if (!result) {
            return;
        }

        super.rescale(width, height);

        this.scaleX = result.scaleX;
        this.scaleY = result.scaleY;
    }

    /** Saves the current drawing state onto the state stack. */
    public save(): void {
        this.saveDepth += 1;
        return this.context.save();
    }

    /** Restores the most recently saved drawing state from the stack. */
    public restore(): void {
        if (this.saveDepth === 0) {
            return;
        }

        this.saveDepth -= 1;
        return this.context.restore();
    }

    /** Clears the entire canvas surface. */
    public clear(): void {
        return this.context.clearRect(0, 0, this.width, this.height);
    }

    /** Resets the canvas context to its default state. */
    public reset(): void {
        return this.context.reset();
    }

    /** Applies a rotation transformation, in radians. */
    public rotate(angle: number): void {
        return this.context.rotate(angle);
    }

    /** Applies a scale transformation. */
    public scale(x: number, y: number): void {
        return this.context.scale(x, y);
    }

    /** Applies a translation transformation. */
    public translate(x: number, y: number): void {
        return this.context.translate(x, y);
    }

    /** Replaces the current transformation matrix with the given values. */
    // eslint-disable-next-line id-length
    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.context.setTransform(a, b, c, d, e, f);
    }

    /** Multiplies the current transformation matrix by the given values. */
    // eslint-disable-next-line id-length
    public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.context.transform(a, b, c, d, e, f);
    }

    /** Measures text dimensions using the canvas context's current font or an optional override. */
    public measureText(text: string, font?: string): TextMetrics {
        return canvasMeasureText(this.context, text, font);
    }

    /** Creates a new {@link CanvasPath}, optionally reusing an id for diffing efficiency. */
    public createPath(id?: string): CanvasPath {
        return new CanvasPath(id);
    }

    /** Clips subsequent drawing operations to the given path. */
    public applyClip(path: CanvasPath, fillRule?: FillRule): void {
        return this.context.clip(path.ref, fillRule);
    }

    /** Draws an image onto the canvas at the given position and optional size. */
    public drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        return canvasDrawImage(this.context, image, x, y, width, height);
    }

    /** Fills the given path or text element using the current fill style. */
    public applyFill(element: CanvasPath | ContextText, fillRule?: FillRule): void {
        return applyCanvasFill(this.context, element, fillRule);
    }

    /** Strokes the given path or text element using the current stroke style. */
    public applyStroke(element: CanvasPath | ContextText): void {
        return applyCanvasStroke(this.context, element);
    }

    /** Tests whether a point lies inside the filled region of a path. */
    public isPointInPath(path: CanvasPath, x: number, y: number, fillRule?: FillRule): boolean {
        return canvasIsPointInPath(this.context, path, x, y, fillRule);
    }

    /** Tests whether a point lies on the stroked outline of a path. */
    public isPointInStroke(path: CanvasPath, x: number, y: number): boolean {
        return canvasIsPointInStroke(this.context, path, x, y);
    }

    /** Captures a snapshot of the canvas and returns format-specific exporters (see {@link ContextExport}). */
    public export(): ContextExport {
        return createCanvasExport(this.element);
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
