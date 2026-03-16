/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
    BaseState,
    ContextElement,
    ContextEventMap,
    ContextOptions,
    Direction,
    FillRule,
    FontKerning,
    LineCap,
    LineJoin,
    MeasureTextOptions,
    RenderElement,
    Rotation,
    TextAlignment,
    TextBaseline,
    TextOptions,
    TransformOrigin,
} from './types';

import {
    ContextPath,
} from './path';

import {
    ContextText,
} from './text';

import {
    degreesToRadians,
} from '../math';

import {
    EventBus,
} from '../core/event-bus';

import {
    factory,
} from '../core/factory';

import {
    scaleContinuous,
} from '../scales';

import type {
    Scale,
} from '../scales';

import {
    functionMemoize,
    typeIsNumber,
} from '@ripl/utilities';

/** Resolves a rotation value (number, degrees string, or radians string) to radians. */
export function resolveRotation(value: Rotation): number {
    if (typeIsNumber(value)) {
        return value;
    }

    const trimmed = value.trim();

    if (trimmed.endsWith('deg')) {
        return degreesToRadians(parseFloat(trimmed));
    }

    if (trimmed.endsWith('rad')) {
        return parseFloat(trimmed);
    }

    return parseFloat(trimmed) || 0;
}

/** Resolves a transform-origin value (number or percentage string) to a pixel offset relative to the given dimension. */
export function resolveTransformOrigin(value: TransformOrigin, dimension: number): number {
    if (typeIsNumber(value)) {
        return value;
    }

    const trimmed = value.trim();

    if (trimmed.endsWith('%')) {
        return (parseFloat(trimmed) / 100) * dimension;
    }

    return parseFloat(trimmed) || 0;
}

/** Measures the dimensions of a text string using an optional font and context override. */
export function measureText(value: string, options?: MeasureTextOptions): TextMetrics {
    return factory.measureText(value, options);
}

/** Abstract rendering context providing a unified API for Canvas and SVG, with state management and coordinate scaling. */
export abstract class Context<TElement extends Element = Element, TMeta extends Record<string, unknown> = Record<string, unknown>> extends EventBus<ContextEventMap> implements BaseState {

    public readonly type: string;
    public readonly element: TElement;
    public readonly meta: TMeta;

    public buffer = false;
    public width: number;
    public height: number;
    public scaleX: Scale<number, number>;
    public scaleY: Scale<number, number>;
    public scaleDPR: Scale<number, number>;
    public renderElement?: RenderElement;
    public renderedElements: RenderElement[];

    protected states: BaseState[];
    protected currentState: BaseState;
    protected renderDepth = 0;

    public get currentRenderElement() {
        return this.renderElement;
    }

    public set currentRenderElement(element: RenderElement | undefined) {
        this.renderElement = element;

        if (element && !element.abstract) {
            this.renderedElements.push(element);
        }
    }

    public get fill(): string {
        return this.currentState.fill;
    }

    public set fill(value) {
        this.currentState.fill = value;
    }

    public get filter(): string {
        return this.currentState.filter;
    }

    public set filter(value) {
        this.currentState.filter = value;
    }

    public get direction(): Direction {
        return this.currentState.direction;
    }

    public set direction(value) {
        this.currentState.direction = value;
    }

    public get font(): string {
        return this.currentState.font;
    }

    public set font(value) {
        this.currentState.font = value;
    }

    public get fontKerning(): FontKerning {
        return this.currentState.fontKerning;
    }

    public set fontKerning(value) {
        this.currentState.fontKerning = value;
    }

    public get opacity(): number {
        return this.currentState.opacity;
    }

    public set opacity(value) {
        this.currentState.opacity = value;
    }

    public get globalCompositeOperation(): unknown {
        return this.currentState.globalCompositeOperation;
    }

    public set globalCompositeOperation(value) {
        this.currentState.globalCompositeOperation = value;
    }

    public get lineCap(): LineCap {
        return this.currentState.lineCap;
    }

    public set lineCap(value) {
        this.currentState.lineCap = value;
    }

    public get lineDash(): number[] {
        return this.currentState.lineDash;
    }

    public set lineDash(value) {
        this.currentState.lineDash = value;
    }

    public get lineDashOffset(): number {
        return this.currentState.lineDashOffset;
    }

    public set lineDashOffset(value) {
        this.currentState.lineDashOffset = value;
    }

    public get lineJoin(): LineJoin {
        return this.currentState.lineJoin;
    }

    public set lineJoin(value) {
        this.currentState.lineJoin = value;
    }

    public get lineWidth(): number {
        return this.currentState.lineWidth;
    }

    public set lineWidth(value) {
        this.currentState.lineWidth = value;
    }

    public get miterLimit(): number {
        return this.currentState.miterLimit;
    }

    public set miterLimit(value) {
        this.currentState.miterLimit = value;
    }

    public get shadowBlur(): number {
        return this.currentState.shadowBlur;
    }

    public set shadowBlur(value) {
        this.currentState.shadowBlur = value;
    }

    public get shadowColor(): string {
        return this.currentState.shadowColor;
    }

    public set shadowColor(value) {
        this.currentState.shadowColor = value;
    }

    public get shadowOffsetX(): number {
        return this.currentState.shadowOffsetX;
    }

    public set shadowOffsetX(value) {
        this.currentState.shadowOffsetX = value;
    }

    public get shadowOffsetY(): number {
        return this.currentState.shadowOffsetY;
    }

    public set shadowOffsetY(value) {
        this.currentState.shadowOffsetY = value;
    }

    public get stroke(): string {
        return this.currentState.stroke;
    }

    public set stroke(value) {
        this.currentState.stroke = value;
    }

    public get textAlign(): TextAlignment {
        return this.currentState.textAlign;
    }

    public set textAlign(value) {
        this.currentState.textAlign = value;
    }

    public get textBaseline(): TextBaseline {
        return this.currentState.textBaseline;
    }

    public set textBaseline(value) {
        this.currentState.textBaseline = value;
    }

    public get zIndex(): number {
        return this.currentState.zIndex;
    }

    public set zIndex(value) {
        this.currentState.zIndex = value;
    }

    public get translateX(): number {
        return this.currentState.translateX;
    }

    public set translateX(value) {
        this.currentState.translateX = value;
    }

    public get translateY(): number {
        return this.currentState.translateY;
    }

    public set translateY(value) {
        this.currentState.translateY = value;
    }

    public get transformScaleX(): number {
        return this.currentState.transformScaleX;
    }

    public set transformScaleX(value) {
        this.currentState.transformScaleX = value;
    }

    public get transformScaleY(): number {
        return this.currentState.transformScaleY;
    }

    public set transformScaleY(value) {
        this.currentState.transformScaleY = value;
    }

    public get rotation(): Rotation {
        return this.currentState.rotation;
    }

    public set rotation(value) {
        this.currentState.rotation = value;
    }

    public get transformOriginX(): TransformOrigin {
        return this.currentState.transformOriginX;
    }

    public set transformOriginX(value) {
        this.currentState.transformOriginX = value;
    }

    public get transformOriginY(): TransformOrigin {
        return this.currentState.transformOriginY;
    }

    public set transformOriginY(value) {
        this.currentState.transformOriginY = value;
    }

    constructor(
        type: string,
        element: TElement,
        options?: ContextOptions<TMeta>
    ) {
        super();

        this.type = type;
        this.element = element;
        this.meta = { ...options?.meta } as TMeta;
        this.states = [];
        this.renderedElements = [];
        this.currentState = this.getDefaultState();
        this.width = 0;
        this.height = 0;
        this.scaleDPR = scaleContinuous([0, 1], [0, factory.devicePixelRatio ?? 1]);
        this.scaleX = scaleContinuous([0, this.width], [0, this.width]);
        this.scaleY = scaleContinuous([0, this.height], [0, this.height]);
    }

    protected rescale(width: number, height: number) {
        this.scaleX = scaleContinuous([0, width], [0, width]);
        this.scaleY = scaleContinuous([0, height], [0, height]);

        this.width = width;
        this.height = height;

        this.emit('resize', null);
    }

    protected getDefaultState(): BaseState {
        return { ...factory.getDefaultState() };
    }

    /** Pushes the current state onto the stack and resets to defaults. */
    public save(): void {
        this.states.push(this.currentState);
        this.currentState = this.getDefaultState();
    }

    /** Restores the most recently saved state from the stack. */
    public restore(): void {
        this.currentState = this.states.pop() || this.getDefaultState();
    }

    /** Executes a callback within a save/restore pair, returning the callback's result. */
    public layer<TResult = void>(body: () => TResult): TResult {
        this.save();

        try {
            return body();
        } finally {
            this.restore();
        }
    }

    /** Clears the entire rendering surface. */
    public clear(): void {
        // noop
    }

    /** Resets the context to its initial state. */
    public reset(): void {
        // noop
    }

    /** Clears the cached list of tracked elements for interaction, forcing a rebuild on the next hit test. */
    public invalidateTrackedElements(event: string): void {
        this.getTrackedElements.cache.clear();
    }

    /** Signals the start of a render pass; resets the rendered-elements list at depth 0. */
    public markRenderStart(): void {
        if (this.renderDepth === 0) {
            this.renderedElements = [];
        }

        this.renderDepth += 1;
    }

    /** Signals the end of a render pass. */
    public markRenderEnd(): void {
        this.renderDepth -= 1;
    }

    /** Clears the rendering surface and brackets the callback in markRenderStart/markRenderEnd, returning the callback's result. */
    public batch<TResult = void>(body: () => TResult): TResult {
        this.clear();
        this.save();
        this.markRenderStart();

        try {
            return body();
        } finally {
            this.markRenderEnd();
            this.restore();
        }
    }

    /** Applies a rotation transformation. */
    public rotate(angle: number): void {
        // noop
    }

    /** Applies a scale transformation. */
    public scale(x: number, y: number): void {
        // noop
    }

    /** Applies a translation transformation. */
    public translate(x: number, y: number): void {
        // noop
    }

    // eslint-disable-next-line id-length
    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        // noop
    }

    // eslint-disable-next-line id-length
    public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        // noop
    }

    /** Measures text dimensions using the context's current font or an optional override. */
    public measureText(text: string, font?: string): TextMetrics {
        return measureText(text, { font });
    }

    /** Creates a new path element, optionally reusing an id for SVG diffing efficiency. */
    public createPath(id?: string): ContextPath {
        return new ContextPath(id);
    }

    /** Creates a new text element from the given options. */
    public createText(options: TextOptions): ContextText {
        return new ContextText(options);
    }

    /** Draws an image onto the rendering surface at the given position and optional size. */
    public drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        // noop
    }

    /** Clips subsequent drawing operations to the given path. */
    public applyClip(path: ContextPath, fillRule?: FillRule): void {
        // noop
    }

    /** Fills the given path or text element using the current fill style. */
    public applyFill(path: ContextElement, fillRule?: FillRule): void {
        // noop
    }

    /** Strokes the given path or text element using the current stroke style. */
    public applyStroke(path: ContextElement): void {
        // noop
    }

    /** Tests whether a point is inside the filled region of a path. */
    public isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        return false;
    }

    /** Tests whether a point is on the stroked outline of a path. */
    public isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        return false;
    }

    private getTrackedElements = functionMemoize((event: string) => {
        return this.renderedElements.filter(element => element.has(event));
    });

    /** Sorts render elements by z-index (highest first) for hit testing priority. */
    protected sortByZIndex(elements: RenderElement[]): RenderElement[] {
        return elements.sort((ea, eb) => eb.zIndex - ea.zIndex);
    }

    /** Tests which rendered elements intersect the given point for the given event types. */
    protected hitTest(events: string[], x: number, y: number): RenderElement[] {
        const tracked = events.flatMap(event => this.getTrackedElements(event));

        return tracked.filter(element => element.intersectsWith(x, y, {
            isPointer: true,
        }));
    }

    /** Destroys the context and disposes all resources. */
    public destroy(): void {
        this.dispose();
        super.destroy();
    }

}

/** Type guard that checks whether a value is a `Context` instance. */
export function typeIsContext(value: unknown): value is Context {
    return value instanceof Context;
}