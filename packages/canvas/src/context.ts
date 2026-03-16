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

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.ref.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        return this.ref.arcTo(x1, y1, x2, y2, radius);
    }

    circle(x: number, y: number, radius: number): void {
        this.arc(x, y, radius, 0, TAU);
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        return this.ref.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    closePath(): void {
        return this.ref.closePath();
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.ref.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }

    lineTo(x: number, y: number): void {
        return this.ref.lineTo(x, y);
    }

    moveTo(x: number, y: number): void {
        return this.ref.moveTo(x, y);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        return this.ref.quadraticCurveTo(cpx, cpy, x, y);
    }

    rect(x: number, y: number, width: number, height: number): void {
        return this.ref.rect(x, y, width, height);
    }

    roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        return this.ref.roundRect(x, y, width, height, radii);
    }

    addPath(path: ContextPath): void {
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

    get fill(): string {
        return this._fillCSS || this.context.fillStyle as string;
    }

    set fill(value) {
        this._fillCSS = value;
        const bounds = getCanvasGradientBounds(this.currentRenderElement?.getBoundingBox?.(), this.width, this.height);
        setCanvasFill(this.context, value, bounds);
    }

    get filter(): string {
        return this.context.filter;
    }

    set filter(value) {
        this.context.filter = value;
    }

    get direction(): Direction {
        return this.context.direction;
    }

    set direction(value) {
        this.context.direction = value;
    }

    get font(): string {
        return this.context.font;
    }

    set font(value) {
        this.context.font = value;
    }

    get fontKerning(): FontKerning {
        return this.context.fontKerning;
    }

    set fontKerning(value) {
        this.context.fontKerning = value;
    }

    get opacity(): number {
        return this.context.globalAlpha;
    }

    set opacity(value) {
        this.context.globalAlpha = value;
    }

    get globalCompositeOperation(): unknown {
        return this.context.globalCompositeOperation;
    }

    set globalCompositeOperation(value) {
        this.context.globalCompositeOperation = value as GlobalCompositeOperation;
    }

    get lineCap(): LineCap {
        return this.context.lineCap;
    }

    set lineCap(value) {
        this.context.lineCap = value;
    }

    get lineDash(): number[] {
        return this.context.getLineDash();
    }

    set lineDash(value) {
        this.context.setLineDash(value);
    }

    get lineDashOffset(): number {
        return this.context.lineDashOffset;
    }

    set lineDashOffset(value) {
        this.context.lineDashOffset = value;
    }

    get lineJoin(): LineJoin {
        return this.context.lineJoin;
    }

    set lineJoin(value) {
        this.context.lineJoin = value;
    }

    get lineWidth(): number {
        return this.context.lineWidth;
    }

    set lineWidth(value) {
        this.context.lineWidth = value;
    }

    get miterLimit(): number {
        return this.context.miterLimit;
    }

    set miterLimit(value) {
        this.context.miterLimit = value;
    }

    get shadowBlur(): number {
        return this.context.shadowBlur;
    }

    set shadowBlur(value) {
        this.context.shadowBlur = value;
    }

    get shadowColor(): string {
        return this.context.shadowColor;
    }

    set shadowColor(value) {
        this.context.shadowColor = value;
    }

    get shadowOffsetX(): number {
        return this.context.shadowOffsetX;
    }

    set shadowOffsetX(value) {
        this.context.shadowOffsetX = value;
    }

    get shadowOffsetY(): number {
        return this.context.shadowOffsetY;
    }

    set shadowOffsetY(value) {
        this.context.shadowOffsetY = value;
    }

    get stroke(): string {
        return this._strokeCSS || this.context.strokeStyle as string;
    }

    set stroke(value) {
        this._strokeCSS = value;
        const bounds = getCanvasGradientBounds(this.currentRenderElement?.getBoundingBox?.(), this.width, this.height);
        setCanvasStroke(this.context, value, bounds);
    }

    get textAlign(): TextAlignment {
        return this.context.textAlign;
    }

    set textAlign(value) {
        this.context.textAlign = value;
    }

    get textBaseline(): TextBaseline {
        return this.context.textBaseline;
    }

    set textBaseline(value) {
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

    save(): void {
        return this.context.save();
    }

    restore(): void {
        return this.context.restore();
    }

    clear(): void {
        return this.context.clearRect(0, 0, this.width, this.height);
    }

    reset(): void {
        return this.context.reset();
    }

    rotate(angle: number): void {
        return this.context.rotate(angle);
    }

    scale(x: number, y: number): void {
        return this.context.scale(x, y);
    }

    translate(x: number, y: number): void {
        return this.context.translate(x, y);
    }

    // eslint-disable-next-line id-length
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.context.setTransform(a, b, c, d, e, f);
    }

    // eslint-disable-next-line id-length
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.context.transform(a, b, c, d, e, f);
    }

    measureText(text: string, font?: string): TextMetrics {
        return canvasMeasureText(this.context, text, font);
    }

    createPath(id?: string): CanvasPath {
        return new CanvasPath(id);
    }

    applyClip(path: CanvasPath, fillRule?: FillRule): void {
        return this.context.clip(path.ref, fillRule);
    }

    drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        return canvasDrawImage(this.context, image, x, y, width, height);
    }

    applyFill(element: CanvasPath | ContextText, fillRule?: FillRule): void {
        return applyCanvasFill(this.context, element, fillRule);
    }

    applyStroke(element: CanvasPath | ContextText): void {
        return applyCanvasStroke(this.context, element);
    }

    isPointInPath(path: CanvasPath, x: number, y: number, fillRule?: FillRule): boolean {
        return canvasIsPointInPath(this.context, path, x, y, fillRule);
    }

    isPointInStroke(path: CanvasPath, x: number, y: number): boolean {
        return canvasIsPointInStroke(this.context, path, x, y);
    }

}

/** Creates a Canvas 2D rendering context attached to the given DOM target. */
export function createContext(target: string | HTMLElement, options?: ContextOptions): CanvasContext {
    return new CanvasContext(target, options);
}
