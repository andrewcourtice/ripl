/* eslint-disable @typescript-eslint/no-unused-vars */

import {
    BorderRadius,
    Box,
    degreesToRadians,
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
    arrayFilter,
    arrayForEach,
    arrayJoin,
    DOMElementEventMap,
    DOMEventHandler,
    functionCache,
    functionMemoize,
    hasWindow,
    onDOMElementResize,
    onDOMEvent,
    stringUniqueId,
    typeIsNil,
    typeIsNumber,
    typeIsString,
} from '@ripl/utilities';

import {
    createFrameBuffer,
} from '../../animation';

export type Direction = 'inherit' | 'ltr' | 'rtl';
export type FontKerning = 'auto' | 'none' | 'normal';
export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'bevel' | 'miter' | 'round';
export type TextAlignment = 'center' | 'end' | 'left' | 'right' | 'start';
export type TextBaseline = 'alphabetic' | 'bottom' | 'hanging' | 'ideographic' | 'middle' | 'top';
export type FillRule = 'evenodd' | 'nonzero';
export type TransformOrigin = number | string;
export type Rotation = number | string;

export type RenderElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';

export interface RenderElementIntersectionOptions {
    isPointer: boolean;
}

export interface RenderElement {
    readonly id: string;
    parent?: RenderElement;
    abstract: boolean;
    pointerEvents: RenderElementPointerEvents;
    renderDepth?: number;
    zIndex: number;
    getBoundingBox?(): Box;
    has(event: string): boolean;
    intersectsWith(x: number, y: number, options?: Partial<RenderElementIntersectionOptions>): boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(type: string, data: any): void;
}

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
}

export interface ContextOptions {
    interactive?: boolean;
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
    translateX: number;
    translateY: number;
    transformScaleX: number;
    transformScaleY: number;
    rotation: Rotation;
    transformOriginX: TransformOrigin;
    transformOriginY: TransformOrigin;
}

export type MeasureTextOptions = {
    context?: CanvasRenderingContext2D;
    font?: CanvasRenderingContext2D['font'];
};

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
        translateX: 0,
        translateY: 0,
        transformScaleX: 1,
        transformScaleY: 1,
        rotation: 0,
        transformOriginX: 0,
        transformOriginY: 0,
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

    addPath(path: ContextPath): void {
        // do nothing
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

    public buffer = false;
    public width: number;
    public height: number;
    public scaleX: Scale<number, number>;
    public scaleY: Scale<number, number>;
    public scaleDPR: Scale<number, number>;

    protected states: BaseState[];
    protected currentState: BaseState;
    protected renderDepth = 0;

    private interactive: boolean;
    private interactionEnabled = false;
    private activeElements = new Set<RenderElement>();

    public renderElement?: RenderElement;
    public renderedElements: RenderElement[];

    get currentRenderElement() {
        return this.renderElement;
    }

    set currentRenderElement(element: RenderElement | undefined) {
        this.renderElement = element;

        if (element && !element.abstract) {
            this.renderedElements.push(element);
        }
    }

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

    get translateX(): number {
        return this.currentState.translateX;
    }

    set translateX(value) {
        this.currentState.translateX = value;
    }

    get translateY(): number {
        return this.currentState.translateY;
    }

    set translateY(value) {
        this.currentState.translateY = value;
    }

    get transformScaleX(): number {
        return this.currentState.transformScaleX;
    }

    set transformScaleX(value) {
        this.currentState.transformScaleX = value;
    }

    get transformScaleY(): number {
        return this.currentState.transformScaleY;
    }

    set transformScaleY(value) {
        this.currentState.transformScaleY = value;
    }

    get rotation(): Rotation {
        return this.currentState.rotation;
    }

    set rotation(value) {
        this.currentState.rotation = value;
    }

    get transformOriginX(): TransformOrigin {
        return this.currentState.transformOriginX;
    }

    set transformOriginX(value) {
        this.currentState.transformOriginX = value;
    }

    get transformOriginY(): TransformOrigin {
        return this.currentState.transformOriginY;
    }

    set transformOriginY(value) {
        this.currentState.transformOriginY = value;
    }

    constructor(
        type: string,
        target: string | HTMLElement,
        element: TElement,
        options?: ContextOptions
    ) {
        super();

        const {
            interactive = true,
        } = options || {};

        const root = typeIsString(target)
            ? document.querySelector(target) as HTMLElement
            : target;

        if (root.childElementCount > 0) {
            root.innerHTML = '';
        }

        root.appendChild(element);

        this.interactive = interactive;
        this.type = type;
        this.root = root;
        this.element = element;
        this.states = [];
        this.renderedElements = [];
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

        this.retain(onDOMElementResize(this.root, ({ width, height }) => this.rescale(width, height)));

        if (this.interactive) {
            this.enableInteraction();
        }
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
        this.currentState = this.getDefaultState();
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

    invalidateTrackedElements(event: string): void {
        this.getTrackedElements.cache.clear();
    }

    markRenderStart(): void {
        if (this.renderDepth === 0) {
            this.renderedElements = [];
        }

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


    drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
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

    private getTrackedElements = functionMemoize((event: string) => {
        return arrayFilter(this.renderedElements, element => element.has(event));
    });

    private attachInteractionEvent<TEvent extends keyof DOMElementEventMap<HTMLElement>>(event: TEvent, handler: DOMEventHandler<HTMLElement, TEvent>) {
        this.retain(onDOMEvent(this.element as unknown as HTMLElement, event, handler), 'interaction');
    }

    public enableInteraction(): void {
        if (this.interactionEnabled) {
            return;
        }

        this.interactionEnabled = true;

        let left = 0;
        let top = 0;

        const scheduleHitTest = createFrameBuffer();

        this.attachInteractionEvent('mouseenter', () => {
            ({
                left,
                top,
            } = this.element.getBoundingClientRect());

            this.emit('mouseenter', null);
        });

        this.attachInteractionEvent('mouseleave', () => {
            this.emit('mouseleave', null);
        });

        this.attachInteractionEvent('mousemove', event => {
            const x = event.clientX - left;
            const y = event.clientY - top;

            this.emit('mousemove', {
                x,
                y,
            });

            scheduleHitTest(() => {
                const trueX = this.scaleX(x);
                const trueY = this.scaleY(y);

                const trackedElements = [
                    ...this.getTrackedElements('mousemove'),
                    ...this.getTrackedElements('mouseenter'),
                    ...this.getTrackedElements('mouseleave'),
                ];

                const hitElements = arrayFilter(trackedElements, element => element.intersectsWith(trueX, trueY, {
                    isPointer: true,
                }));

                const {
                    left: entries,
                    inner: updates,
                    right: exits,
                } = arrayJoin(hitElements, [...this.activeElements], (hitElement, activeElement) => hitElement === activeElement);

                arrayForEach(entries, element => {
                    this.activeElements.add(element);
                    element.emit('mouseenter', null);
                });

                arrayForEach(updates, ([element]) => element.emit('mousemove', {
                    x,
                    y,
                }));

                arrayForEach(exits, element => {
                    this.activeElements.delete(element);
                    element.emit('mouseleave', null);
                });
            });
        });

        this.attachInteractionEvent('click', event => {
            const x = this.scaleX(event.clientX - left);
            const y = this.scaleY(event.clientY - top);

            const clickElements = this.getTrackedElements('click');
            const hitElements = arrayFilter(clickElements, element => element.intersectsWith(x, y, {
                isPointer: true,
            }));

            if (hitElements.length > 0) {
                hitElements.sort((ea, eb) => {
                    const depthA = ea.renderDepth;
                    const depthB = eb.renderDepth;

                    if (!typeIsNil(depthA) && !typeIsNil(depthB)) {
                        return depthA - depthB;
                    }

                    return eb.zIndex - ea.zIndex;
                });

                hitElements[0].emit('click', {
                    x,
                    y,
                });
            }
        });
    }

    public disableInteraction(): void {
        if (!this.interactionEnabled) {
            return;
        }

        this.interactionEnabled = false;
        this.dispose('interaction');
        this.activeElements.clear();
    }

    public destroy(): void {
        this.disableInteraction();
        this.element.remove();
        this.dispose();
        super.destroy();
    }

}

export function typeIsContext(value: unknown): value is Context {
    return value instanceof Context;
}