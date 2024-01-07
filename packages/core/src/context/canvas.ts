import {
    TAU,
} from '../math';

import {
    EventBus,
} from '../core/event-bus';

import {
    Scale,
    scaleContinuous,
} from '../scales';

import {
    onDOMElementResize,
    OneOrMore,
    stringUniqueId,
    typeIsString,
} from '@ripl/utilities';

import type {
    Context,
    ContextEventMap,
    Direction,
    FillRule,
    FontKerning,
    LineCap,
    LineJoin,
    Path,
    TextAlignment,
    TextBaseline,
} from './types';

export class CanvasPath implements Path<Path2D> {

    public readonly id: string;
    public readonly impl: Path2D;

    constructor(id: string) {
        this.id = id;
        this.impl = new Path2D();
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.impl.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        return this.impl.arcTo(x1, y1, x2, y2, radius);
    }

    circle(x: number, y: number, radius: number): void {
        this.arc(x, y, radius, 0, TAU);
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        return this.impl.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    closePath(): void {
        return this.impl.closePath();
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.impl.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }

    lineTo(x: number, y: number): void {
        return this.impl.lineTo(x, y);
    }

    moveTo(x: number, y: number): void {
        return this.impl.moveTo(x, y);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        return this.impl.quadraticCurveTo(cpx, cpy, x, y);
    }

    rect(x: number, y: number, width: number, height: number): void {
        return this.impl.rect(x, y, width, height);
    }

    roundRect(x: number, y: number, width: number, height: number, radii?: OneOrMore<number>): void {
        return this.impl.roundRect(x, y, width, height, radii);
    }

}

export class CanvasContext extends EventBus<ContextEventMap> implements Context {

    readonly element: HTMLCanvasElement;

    #context: CanvasRenderingContext2D;

    width!: number;
    height!: number;
    xScale!: Scale<number, number>;
    yScale!: Scale<number, number>;

    get fillStyle(): string {
        return this.#context.fillStyle;
    }

    set fillStyle(value) {
        this.#context.fillStyle = value;
    }

    get filter(): string {
        return this.#context.filter;
    }

    set filter(value) {
        this.#context.filter = value;
    }

    get direction(): Direction {
        return this.#context.direction;
    }

    set direction(value) {
        this.#context.direction = value;
    }

    get font(): string {
        return this.#context.font;
    }

    set font(value) {
        this.#context.font = value;
    }

    get fontKerning(): FontKerning {
        return this.#context.fontKerning;
    }

    set fontKerning(value) {
        this.#context.fontKerning = value;
    }

    get globalAlpha(): number {
        return this.#context.globalAlpha;
    }

    set globalAlpha(value) {
        this.#context.globalAlpha = value;
    }

    get globalCompositeOperation(): unknown {
        return this.#context.globalCompositeOperation;
    }

    set globalCompositeOperation(value) {
        this.#context.globalCompositeOperation = value;
    }

    get lineCap(): LineCap {
        return this.#context.lineCap;
    }

    set lineCap(value) {
        this.#context.lineCap = value;
    }

    get lineDash(): number[] {
        return this.#context.getLineDash();
    }

    set lineDash(value) {
        this.#context.setLineDash(value);
    }

    get lineDashOffset(): number {
        return this.#context.lineDashOffset;
    }

    set lineDashOffset(value) {
        this.#context.lineDashOffset = value;
    }

    get lineJoin(): LineJoin {
        return this.#context.lineJoin;
    }

    set lineJoin(value) {
        this.#context.lineJoin = value;
    }

    get lineWidth(): number {
        return this.#context.lineWidth;
    }

    set lineWidth(value) {
        this.#context.lineWidth = value;
    }

    get miterLimit(): number {
        return this.#context.miterLimit;
    }

    set miterLimit(value) {
        this.#context.miterLimit = value;
    }

    get shadowBlur(): number {
        return this.#context.shadowBlur;
    }

    set shadowBlur(value) {
        this.#context.shadowBlur = value;
    }

    get shadowColor(): string {
        return this.#context.shadowColor;
    }

    set shadowColor(value) {
        this.#context.shadowColor = value;
    }

    get shadowOffsetX(): number {
        return this.#context.shadowOffsetX;
    }

    set shadowOffsetX(value) {
        this.#context.shadowOffsetX = value;
    }

    get shadowOffsetY(): number {
        return this.#context.shadowOffsetY;
    }

    set shadowOffsetY(value) {
        this.#context.shadowOffsetY = value;
    }

    get strokeStyle(): string {
        return this.#context.strokeStyle;
    }

    set strokeStyle(value) {
        this.#context.strokeStyle = value;
    }

    get textAlign(): TextAlignment {
        return this.#context.textAlign;
    }

    set textAlign(value) {
        this.#context.textAlign = value;
    }

    get textBaseline(): TextBaseline {
        return this.#context.textBaseline;
    }

    set textBaseline(value) {
        this.#context.textBaseline = value;
    }

    constructor(target: string | HTMLElement) {
        super();

        const root = typeIsString(target)
            ? document.querySelector(target) as HTMLElement
            : target;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error();
        }

        this.element = canvas;
        this.#context = context;

        root.appendChild(canvas);

        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        const {
            width,
            height,
        } = canvas.getBoundingClientRect();

        this.rescale(width, height);

        onDOMElementResize(root, ({ width, height }) => this.rescale(width, height));
    }

    private rescale(width: number, height: number) {
        const dpr = window.devicePixelRatio;
        const scaledWidth = Math.floor(width * dpr);
        const scaledHeight = Math.floor(height * dpr);

        this.xScale = scaleContinuous([0, width], [0, scaledWidth]);
        this.yScale = scaleContinuous([0, height], [0, scaledHeight]);

        if (scaledWidth === this.element.width && scaledHeight === this.element.height) {
            return;
        }

        this.width = width;
        this.height = height;
        this.element.width = scaledWidth;
        this.element.height = scaledHeight;

        this.#context.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.emit('context:resize', null);
    }

    save(): void {
        return this.#context.save();
    }

    restore(): void {
        return this.#context.restore();
    }

    clear(): void {
        return this.#context.clearRect(0, 0, this.width, this.height);
    }

    reset(): void {
        return this.#context.reset();
    }

    markRenderStart(): void {
        // do nothing
    }

    markRenderEnd(): void {
        // do nothing
    }

    rotate(angle: number): void {
        return this.#context.rotate(angle);
    }

    scale(x: number, y: number): void {
        return this.#context.scale(x, y);
    }

    translate(x: number, y: number): void {
        return this.#context.translate(x, y);
    }

    // eslint-disable-next-line id-length
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.#context.setTransform(a, b, c, d, e, f);
    }

    // eslint-disable-next-line id-length
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.#context.transform(a, b, c, d, e, f);
    }

    measureText(text: string): TextMetrics {
        return this.#context.measureText(text);
    }

    fillText(text: string, x: number, y: number, maxWidth?: number): void {
        return this.#context.fillText(text, x, y, maxWidth);
    }

    strokeText(text: string, x: number, y: number, maxWidth?: number): void {
        return this.#context.strokeText(text, x, y, maxWidth);
    }

    createPath(id: string = `path-${stringUniqueId()}`): CanvasPath {
        return new CanvasPath(id);
    }

    clip(path: CanvasPath, fillRule?: FillRule): void {
        return this.#context.clip(path.impl, fillRule);
    }

    fill(path: CanvasPath, fillRule?: FillRule): void {
        return this.#context.fill(path.impl, fillRule);
    }

    stroke(path: CanvasPath): void {
        return this.#context.stroke(path.impl);
    }

    isPointInPath(path: CanvasPath, x: number, y: number, fillRule?: FillRule): boolean {
        return this.#context.isPointInPath(path.impl, x, y, fillRule);
    }

    isPointInStroke(path: CanvasPath, x: number, y: number): boolean {
        return this.#context.isPointInStroke(path.impl, x, y);
    }

}