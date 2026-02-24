import {
    Context,
    ContextOptions,
    ContextPath,
    ContextText,
    Direction,
    FillRule,
    FontKerning,
    LineCap,
    LineJoin,
    measureText,
    TextAlignment,
    TextBaseline,
} from './_base';

import {
    isGradientString,
    parseGradient,
} from '../gradient';

import {
    parseColor,
    serialiseRGBA,
} from '../color';

import {
    BorderRadius,
    getPathLength,
    samplePathPoint,
    TAU,
} from '../math';

import {
    scaleContinuous,
} from '../scales';

import {
    arrayForEach,
} from '@ripl/utilities';

import type {
    Gradient,
} from '../gradient';

type GradientBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};
type CanvasGradientFactory = (context: CanvasRenderingContext2D, gradient: Gradient, bounds: GradientBounds) => CanvasGradient;

const CANVAS_GRADIENT_FACTORIES: Record<string, CanvasGradientFactory> = {
    linear: (context, gradient, { x, y, width, height }) => {
        const angleRad = ((gradient as { angle: number }).angle - 90) * (Math.PI / 180);
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const halfW = width / 2;
        const halfH = height / 2;
        const length = Math.abs(halfW * cos) + Math.abs(halfH * sin);

        return context.createLinearGradient(
            x + halfW - cos * length,
            y + halfH - sin * length,
            x + halfW + cos * length,
            y + halfH + sin * length
        );
    },
    radial: (context, gradient, { x, y, width, height }) => {
        const cx = x + ((gradient as { position: [number, number] }).position[0] / 100) * width;
        const cy = y + ((gradient as { position: [number, number] }).position[1] / 100) * height;
        const radius = Math.max(width, height) / 2;

        return context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    },
    conic: (context, gradient, { x, y, width, height }) => {
        const cx = x + ((gradient as { position: [number, number] }).position[0] / 100) * width;
        const cy = y + ((gradient as { position: [number, number] }).position[1] / 100) * height;
        const startAngle = (gradient as { angle: number }).angle * (Math.PI / 180);

        return context.createConicGradient(startAngle, cx, cy);
    },
};

function toCanvasGradient(context: CanvasRenderingContext2D, gradient: Gradient, bounds: GradientBounds): CanvasGradient {
    const factory = CANVAS_GRADIENT_FACTORIES[gradient.type];
    const canvasGradient = factory(context, gradient, bounds);

    arrayForEach(gradient.stops, (stop) => {
        const offset = Math.min(Math.max(stop.offset ?? 0, 0), 1);
        const rgba = parseColor(stop.color);
        const color = rgba ? serialiseRGBA(...rgba) : stop.color;

        canvasGradient.addColorStop(offset, color);
    });

    return canvasGradient;
}

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

}

export class CanvasContext extends Context<HTMLCanvasElement> {

    private context: CanvasRenderingContext2D;
    private _fillStyleCSS: string = '';
    private _strokeStyleCSS: string = '';

    get fillStyle(): string {
        return this._fillStyleCSS || this.context.fillStyle as string;
    }

    set fillStyle(value) {
        this._fillStyleCSS = value;

        if (isGradientString(value)) {
            const gradient = parseGradient(value);

            if (gradient) {
                const bounds = this.getGradientBounds();
                this.context.fillStyle = toCanvasGradient(this.context, gradient, bounds);
                return;
            }
        }

        this.context.fillStyle = value;
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

    get globalAlpha(): number {
        return this.context.globalAlpha;
    }

    set globalAlpha(value) {
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

    get strokeStyle(): string {
        return this._strokeStyleCSS || this.context.strokeStyle as string;
    }

    set strokeStyle(value) {
        this._strokeStyleCSS = value;

        if (isGradientString(value)) {
            const gradient = parseGradient(value);

            if (gradient) {
                const bounds = this.getGradientBounds();
                this.context.strokeStyle = toCanvasGradient(this.context, gradient, bounds);
                return;
            }
        }

        this.context.strokeStyle = value;
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

    private getGradientBounds(): GradientBounds {
        const box = this.currentRenderElement?.getBoundingBox?.();

        if (box && box.width > 0 && box.height > 0) {
            return {
                x: box.left,
                y: box.top,
                width: box.width,
                height: box.height,
            };
        }

        return {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height,
        };
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
        const dpr = window.devicePixelRatio;
        const scaledWidth = Math.floor(width * dpr);
        const scaledHeight = Math.floor(height * dpr);

        if (scaledWidth === this.element.width && scaledHeight === this.element.height) {
            return;
        }

        this.element.width = scaledWidth;
        this.element.height = scaledHeight;

        this.context.setTransform(dpr, 0, 0, dpr, 0, 0);

        super.rescale(width, height);

        this.scaleX = scaleContinuous([0, width], [0, scaledWidth]);
        this.scaleY = scaleContinuous([0, height], [0, scaledHeight]);
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
        return measureText(text, {
            context: this.context,
            font: font ?? this.context.font,
        });
    }

    createPath(id?: string): CanvasPath {
        return new CanvasPath(id);
    }

    clip(path: CanvasPath, fillRule?: FillRule): void {
        return this.context.clip(path.ref, fillRule);
    }

    private renderTextAlongPath(element: ContextText, method: 'fill' | 'stroke'): void {
        const pathData = element.pathData!;
        const totalLength = getPathLength(pathData);
        let distance = (element.startOffset ?? 0) * totalLength;

        for (const char of element.content) {
            const charWidth = this.context.measureText(char).width;
            const midDistance = distance + charWidth / 2;

            if (midDistance > totalLength) {
                break;
            }

            const { x, y, angle } = samplePathPoint(pathData, midDistance);

            this.context.save();
            this.context.translate(x, y);
            this.context.rotate(angle);

            if (method === 'fill') {
                this.context.fillText(char, 0, 0);
            } else {
                this.context.strokeText(char, 0, 0);
            }

            this.context.restore();
            distance += charWidth;
        }
    }

    drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        if (width && height) {
            return this.context.drawImage(image, x, y, width, height);
        }

        return this.context.drawImage(image, x, y);
    }

    fill(element: CanvasPath | ContextText, fillRule?: FillRule): void {
        if (element instanceof ContextText) {
            if (element.pathData) {
                return this.renderTextAlongPath(element, 'fill');
            }

            return this.context.fillText(element.content, element.x, element.y, element.maxWidth);
        }

        return this.context.fill(element.ref, fillRule);
    }

    stroke(element: CanvasPath | ContextText): void {
        if (element instanceof ContextText) {
            if (element.pathData) {
                return this.renderTextAlongPath(element, 'stroke');
            }

            return this.context.strokeText(element.content, element.x, element.y, element.maxWidth);
        }

        return this.context.stroke(element.ref);
    }

    isPointInPath(path: CanvasPath, x: number, y: number, fillRule?: FillRule): boolean {
        return this.context.isPointInPath(path.ref, x, y, fillRule);
    }

    isPointInStroke(path: CanvasPath, x: number, y: number): boolean {
        return this.context.isPointInStroke(path.ref, x, y);
    }

}

export function createContext(target: string | HTMLElement, options?: ContextOptions): Context {
    return new CanvasContext(target, options);
}