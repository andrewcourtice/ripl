import {
    ContextPath,
    ContextText,
    TAU,
} from '@ripl/core';

import type {
    BorderRadius,
    ContextOptions,
    Direction,
    FillRule,
    FontKerning,
    LineCap,
    LineJoin,
    TextAlignment,
    TextBaseline,
} from '@ripl/core';

import {
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

    public readonly ref: Path2D;

    constructor(id?: string) {
        super(id);
        this.ref = new Path2D();
    }

    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.ref.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }

    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        return this.ref.arcTo(x1, y1, x2, y2, radius);
    }

    public circle(x: number, y: number, radius: number): void {
        this.arc(x, y, radius, 0, TAU);
    }

    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        return this.ref.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    public closePath(): void {
        return this.ref.closePath();
    }

    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.ref.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }

    public lineTo(x: number, y: number): void {
        return this.ref.lineTo(x, y);
    }

    public moveTo(x: number, y: number): void {
        return this.ref.moveTo(x, y);
    }

    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        return this.ref.quadraticCurveTo(cpx, cpy, x, y);
    }

    public rect(x: number, y: number, width: number, height: number): void {
        return this.ref.rect(x, y, width, height);
    }

    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        return this.ref.roundRect(x, y, width, height, radii);
    }

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

    public get fill(): string {
        return this._fillCSS || this.context.fillStyle as string;
    }

    public set fill(value) {
        this._fillCSS = value;
        const bounds = getCanvasGradientBounds(this.currentRenderElement?.getBoundingBox?.(), this.width, this.height);
        setCanvasFill(this.context, value, bounds);
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
        const bounds = getCanvasGradientBounds(this.currentRenderElement?.getBoundingBox?.(), this.width, this.height);
        setCanvasStroke(this.context, value, bounds);
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

    public save(): void {
        return this.context.save();
    }

    public restore(): void {
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

    public isPointInPath(path: CanvasPath, x: number, y: number, fillRule?: FillRule): boolean {
        return canvasIsPointInPath(this.context, path, x, y, fillRule);
    }

    public isPointInStroke(path: CanvasPath, x: number, y: number): boolean {
        return canvasIsPointInStroke(this.context, path, x, y);
    }

}

/** Creates a Canvas 2D rendering context attached to the given DOM target. */
export function createContext(target: string | HTMLElement, options?: ContextOptions): CanvasContext {
    return new CanvasContext(target, options);
}
