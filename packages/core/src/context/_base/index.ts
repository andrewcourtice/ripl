/* eslint-disable @typescript-eslint/no-unused-vars */

import {
    BorderRadius,
    Point,
} from '../../math';

import {
    EventBus,
    EventMap,
} from '../../core/event-bus';

import {
    Scale,
    scaleContinuous,
} from '../../scales';

import {
    arrayForEach,
    Disposable,
    functionCache,
    hasWindow,
    onDOMElementResize,
    stringUniqueId,
    typeIsString,
} from '@ripl/utilities';

export type Direction = 'inherit' | 'ltr' | 'rtl';
export type FontKerning = 'auto' | 'none' | 'normal';
export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'bevel' | 'miter' | 'round';
export type TextAlignment = 'center' | 'end' | 'left' | 'right' | 'start';
export type TextBaseline = 'alphabetic' | 'bottom' | 'hanging' | 'ideographic' | 'middle' | 'top';
export type FillRule = 'evenodd' | 'nonzero';

export interface RenderElement {
    readonly id: string;
    parent?: RenderElement;
}

export interface ContextEventMap extends EventMap {
    resize: null;
}

export interface ContextOptions {
    buffer?: boolean;
}

export type TextOptions = {
    id?: string;
    x: number;
    y: number;
    content: string;
    maxWidth?: number;
    pathData?: string;
    startOffset?: number;
};

export interface ContextElement {
    readonly id: string;
}

export interface BaseState {
    fillStyle: string;
    filter: string;
    direction: Direction;
    font: string;
    fontKerning: FontKerning;
    globalAlpha: number;
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
    strokeStyle: string;
    textAlign: TextAlignment;
    textBaseline: TextBaseline;
    zIndex: number;
}

export type MeasureTextOptions = {
    context?: CanvasRenderingContext2D;
    font?: CanvasRenderingContext2D['font'];
};

export const getRefContext = functionCache(() => {
    return document.createElement('canvas').getContext('2d')!;
});

const cachedDefaultState = functionCache((): BaseState => {
    const refContext = getRefContext();

    return {
        fillStyle: refContext.fillStyle,
        filter: refContext.filter,
        direction: refContext.direction,
        font: refContext.font,
        fontKerning: refContext.fontKerning,
        globalAlpha: refContext.globalAlpha,
        globalCompositeOperation: refContext.globalCompositeOperation,
        lineCap: refContext.lineCap,
        lineDash: refContext.getLineDash(),
        lineDashOffset: refContext.lineDashOffset,
        lineJoin: refContext.lineJoin,
        lineWidth: refContext.lineWidth,
        miterLimit: refContext.miterLimit,
        shadowBlur: refContext.shadowBlur,
        shadowColor: refContext.shadowColor,
        shadowOffsetX: refContext.shadowOffsetX,
        shadowOffsetY: refContext.shadowOffsetY,
        strokeStyle: refContext.strokeStyle,
        textAlign: refContext.textAlign,
        textBaseline: refContext.textBaseline,
        zIndex: 0,
    } as BaseState;
});

export const scaleDPR = scaleContinuous([0, 1], [0, hasWindow ? window.devicePixelRatio : 1]);

export function measureText(value: string, options?: MeasureTextOptions): TextMetrics {
    const {
        context = getRefContext(),
        font,
    } = options ?? {};

    context.save();
    context.font = font ?? context.font;

    const result = context.measureText(value);

    context.restore();

    return result;
}

export class ContextPath implements ContextElement {

    public readonly id: string;

    constructor(id: string = `path-${stringUniqueId()}`) {
        this.id = id;
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        // do nothing
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        // do nothing
    }

    circle(x: number, y: number, radius: number): void {
        // do nothing
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        // do nothing
    }

    closePath(): void {
        // do nothing
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        // do nothing
    }

    lineTo(x: number, y: number): void {
        // do nothing
    }

    moveTo(x: number, y: number): void {
        // do nothing
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        // do nothing
    }

    rect(x: number, y: number, width: number, height: number): void {
        // do nothing
    }

    roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        // do nothing
    }

    polyline(points: Point[]): void {
        arrayForEach(points, ([x, y], index) => !index
            ? this.moveTo(x,y)
            : this.lineTo(x, y)
        );
    }

}

export class ContextText implements ContextElement {

    public readonly id: string;

    public x: number;
    public y: number;
    public content: string;
    public maxWidth?: number;
    public pathData?: string;
    public startOffset?: number;

    constructor({
        x,
        y,
        content,
        maxWidth,
        pathData,
        startOffset,
        id = `text-${stringUniqueId()}`,
    }: TextOptions) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.content = content;
        this.maxWidth = maxWidth;
        this.pathData = pathData;
        this.startOffset = startOffset;
    }

}

export abstract class Context<TElement extends Element = Element> extends EventBus<ContextEventMap> implements BaseState {

    public readonly type: string;
    public readonly root: HTMLElement;
    public readonly element: TElement;

    public buffer: boolean;
    public width: number;
    public height: number;
    public scaleX: Scale<number, number>;
    public scaleY: Scale<number, number>;
    public scaleDPR: Scale<number, number>;

    protected states: BaseState[];
    protected currentState: BaseState;
    protected renderDepth = 0;

    private resizeDisposable?: Disposable;

    public currentRenderElement?: RenderElement;

    get fillStyle(): string {
        return this.currentState.fillStyle;
    }

    set fillStyle(value) {
        this.currentState.fillStyle = value;
    }

    get filter(): string {
        return this.currentState.filter;
    }

    set filter(value) {
        this.currentState.filter = value;
    }

    get direction(): Direction {
        return this.currentState.direction;
    }

    set direction(value) {
        this.currentState.direction = value;
    }

    get font(): string {
        return this.currentState.font;
    }

    set font(value) {
        this.currentState.font = value;
    }

    get fontKerning(): FontKerning {
        return this.currentState.fontKerning;
    }

    set fontKerning(value) {
        this.currentState.fontKerning = value;
    }

    get globalAlpha(): number {
        return this.currentState.globalAlpha;
    }

    set globalAlpha(value) {
        this.currentState.globalAlpha = value;
    }

    get globalCompositeOperation(): unknown {
        return this.currentState.globalCompositeOperation;
    }

    set globalCompositeOperation(value) {
        this.currentState.globalCompositeOperation = value;
    }

    get lineCap(): LineCap {
        return this.currentState.lineCap;
    }

    set lineCap(value) {
        this.currentState.lineCap = value;
    }

    get lineDash(): number[] {
        return this.currentState.lineDash;
    }

    set lineDash(value) {
        this.currentState.lineDash = value;
    }

    get lineDashOffset(): number {
        return this.currentState.lineDashOffset;
    }

    set lineDashOffset(value) {
        this.currentState.lineDashOffset = value;
    }

    get lineJoin(): LineJoin {
        return this.currentState.lineJoin;
    }

    set lineJoin(value) {
        this.currentState.lineJoin = value;
    }

    get lineWidth(): number {
        return this.currentState.lineWidth;
    }

    set lineWidth(value) {
        this.currentState.lineWidth = value;
    }

    get miterLimit(): number {
        return this.currentState.miterLimit;
    }

    set miterLimit(value) {
        this.currentState.miterLimit = value;
    }

    get shadowBlur(): number {
        return this.currentState.shadowBlur;
    }

    set shadowBlur(value) {
        this.currentState.shadowBlur = value;
    }

    get shadowColor(): string {
        return this.currentState.shadowColor;
    }

    set shadowColor(value) {
        this.currentState.shadowColor = value;
    }

    get shadowOffsetX(): number {
        return this.currentState.shadowOffsetX;
    }

    set shadowOffsetX(value) {
        this.currentState.shadowOffsetX = value;
    }

    get shadowOffsetY(): number {
        return this.currentState.shadowOffsetY;
    }

    set shadowOffsetY(value) {
        this.currentState.shadowOffsetY = value;
    }

    get strokeStyle(): string {
        return this.currentState.strokeStyle;
    }

    set strokeStyle(value) {
        this.currentState.strokeStyle = value;
    }

    get textAlign(): TextAlignment {
        return this.currentState.textAlign;
    }

    set textAlign(value) {
        this.currentState.textAlign = value;
    }

    get textBaseline(): TextBaseline {
        return this.currentState.textBaseline;
    }

    set textBaseline(value) {
        this.currentState.textBaseline = value;
    }

    get zIndex(): number {
        return this.currentState.zIndex;
    }

    set zIndex(value) {
        this.currentState.zIndex = value;
    }

    constructor(
        type: string,
        target: string | HTMLElement,
        element: TElement,
        options?: ContextOptions
    ) {
        super();

        const {
            buffer = false,
        } = options || {};

        const root = typeIsString(target)
            ? document.querySelector(target) as HTMLElement
            : target;

        if (root.childElementCount > 0) {
            root.innerHTML = '';
        }

        root.appendChild(element);

        this.type = type;
        this.root = root;
        this.element = element;
        this.buffer = buffer;
        this.states = [];
        this.currentState = this.getDefaultState();
        this.width = 0;
        this.height = 0;
        this.scaleDPR = scaleDPR;
        this.scaleX = scaleContinuous([0, this.width], [0, this.width]);
        this.scaleY = scaleContinuous([0, this.height], [0, this.height]);
    }

    protected init() {
        const {
            width,
            height,
        } = this.element.getBoundingClientRect();

        this.rescale(width, height);

        this.resizeDisposable = onDOMElementResize(this.root, ({ width, height }) => this.rescale(width, height));
    }

    protected rescale(width: number, height: number) {
        this.scaleX = scaleContinuous([0, width], [0, width]);
        this.scaleY = scaleContinuous([0, height], [0, height]);

        this.width = width;
        this.height = height;

        this.emit('resize', null);
    }

    protected getDefaultState() {
        return { ...cachedDefaultState() };
    }

    save(): void {
        this.states.push(this.currentState);
        this.currentState = { ...this.currentState };
    }

    restore(): void {
        this.currentState = this.states.pop() || this.getDefaultState();
    }

    batch<TResult = void>(body: () => TResult): TResult {
        this.save();

        try {
            return body();
        } finally {
            this.restore();
        }
    }

    clear(): void {
    }

    reset(): void {
    }

    markRenderStart(): void {
        this.renderDepth += 1;
    }

    markRenderEnd(): void {
        this.renderDepth -= 1;
    }

    rotate(angle: number): void {
    }

    scale(x: number, y: number): void {
    }

    translate(x: number, y: number): void {
    }

    // eslint-disable-next-line id-length
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    }

    // eslint-disable-next-line id-length
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    }

    measureText(text: string, font?: string): TextMetrics {
        return new TextMetrics();
    }

    createPath(id?: string): ContextPath {
        return new ContextPath(id);
    }

    createText(options: TextOptions): ContextText {
        return new ContextText(options);
    }

    clip(path: ContextPath, fillRule?: FillRule): void {
    }

    fill(path: ContextElement, fillRule?: FillRule): void {
    }

    stroke(path: ContextElement): void {
    }

    isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        return false;
    }

    isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        return false;
    }

    public destroy(): void {
        this.resizeDisposable?.dispose();
        this.element.remove();
        super.destroy();
    }

}

export function typeIsContext(value: unknown): value is Context {
    return value instanceof Context;
}