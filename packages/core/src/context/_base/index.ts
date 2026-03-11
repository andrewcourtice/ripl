/* eslint-disable @typescript-eslint/no-unused-vars */

import {
    Box,
    degreesToRadians,
    getEuclideanDistance,
} from '../../math';

import type {
    BorderRadius,
    Point,
} from '../../math';

import {
    EventBus,
} from '../../core/event-bus';

import type {
    EventMap,
} from '../../core/event-bus';

import {
    scaleContinuous,
} from '../../scales';

import type {
    Scale,
} from '../../scales';

import {
    arrayJoin,
    functionCache,
    functionMemoize,
    hasWindow,
    onDOMElementResize,
    onDOMEvent,
    stringUniqueId,
    typeIsNumber,
    typeIsString,
} from '@ripl/utilities';

import type {
    DOMElementEventMap,
    DOMEventHandler,
} from '@ripl/utilities';

import {
    createFrameBuffer,
} from '../../animation';

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

/** Returns a shared offscreen `CanvasRenderingContext2D` used for text measurement and default state retrieval. */
export const getRefContext = functionCache(() => {
    return document.createElement('canvas').getContext('2d')!;
});

const cachedDefaultState = functionCache((): BaseState => {
    const refContext = getRefContext();

    return {
        fill: refContext.fillStyle,
        filter: refContext.filter,
        direction: refContext.direction,
        font: refContext.font,
        fontKerning: refContext.fontKerning,
        opacity: refContext.globalAlpha,
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
        stroke: refContext.strokeStyle,
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

/** A scale that maps logical pixels to physical device pixels using `devicePixelRatio`. */
export const scaleDPR = scaleContinuous([0, 1], [0, hasWindow ? window.devicePixelRatio : 1]);

/** Measures the dimensions of a text string using an optional font and context override. */
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

/** A virtual path element used to record drawing commands; subclassed by Canvas and SVG implementations. */
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
        points.forEach(([x, y], index) => !index
            ? this.moveTo(x,y)
            : this.lineTo(x, y)
        );
    }

    addPath(path: ContextPath): void {
        // do nothing
    }

}

/** A virtual text element capturing position, content, and optional path-based text layout. */
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

const INTERACTION_KEY = Symbol('interaction');

interface InteractionState {
    left: number;
    top: number;
    dragElement: RenderElement | undefined;
    dragStartX: number;
    dragStartY: number;
    dragPrevX: number;
    dragPrevY: number;
    dragStarted: boolean;
    scheduleHitTest: ReturnType<typeof createFrameBuffer>;
}

/** Abstract rendering context providing a unified API for Canvas and SVG, with state management, coordinate scaling, and interaction handling. */
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
    private dragThreshold: number;
    private interactionState?: InteractionState;

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

    get fill(): string {
        return this.currentState.fill;
    }

    set fill(value) {
        this.currentState.fill = value;
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

    get opacity(): number {
        return this.currentState.opacity;
    }

    set opacity(value) {
        this.currentState.opacity = value;
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

    get stroke(): string {
        return this.currentState.stroke;
    }

    set stroke(value) {
        this.currentState.stroke = value;
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
            dragThreshold = 3,
        } = options || {};

        const root = typeIsString(target)
            ? document.querySelector(target) as HTMLElement
            : target;

        if (root.childElementCount > 0) {
            root.innerHTML = '';
        }

        root.appendChild(element);

        this.interactive = interactive;
        this.dragThreshold = dragThreshold;
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

    /** Pushes the current state onto the stack and resets to defaults. */
    save(): void {
        this.states.push(this.currentState);
        this.currentState = this.getDefaultState();
    }

    /** Restores the most recently saved state from the stack. */
    restore(): void {
        this.currentState = this.states.pop() || this.getDefaultState();
    }

    /** Executes a callback within a save/restore pair, returning the callback's result. */
    layer<TResult = void>(body: () => TResult): TResult {
        this.save();

        try {
            return body();
        } finally {
            this.restore();
        }
    }

    /** Clears the entire rendering surface. */
    clear(): void {
    }

    /** Resets the context to its initial state. */
    reset(): void {
    }

    /** Clears the cached list of tracked elements for interaction, forcing a rebuild on the next hit test. */
    invalidateTrackedElements(event: string): void {
        this.getTrackedElements.cache.clear();
    }

    /** Signals the start of a render pass; resets the rendered-elements list at depth 0. */
    markRenderStart(): void {
        if (this.renderDepth === 0) {
            this.renderedElements = [];
        }

        this.renderDepth += 1;
    }

    /** Signals the end of a render pass. */
    markRenderEnd(): void {
        this.renderDepth -= 1;
    }

    /** Clears the rendering surface and brackets the callback in markRenderStart/markRenderEnd, returning the callback's result. */
    batch<TResult = void>(body: () => TResult): TResult {
        this.clear();
        this.markRenderStart();

        try {
            return body();
        } finally {
            this.markRenderEnd();
        }
    }

    /** Applies a rotation transformation. */
    rotate(angle: number): void {
    }

    /** Applies a scale transformation. */
    scale(x: number, y: number): void {
    }

    /** Applies a translation transformation. */
    translate(x: number, y: number): void {
    }

    // eslint-disable-next-line id-length
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    }

    // eslint-disable-next-line id-length
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    }

    /** Measures text dimensions using the context's current font or an optional override. */
    measureText(text: string, font?: string): TextMetrics {
        return new TextMetrics();
    }

    /** Creates a new path element, optionally reusing an id for SVG diffing efficiency. */
    createPath(id?: string): ContextPath {
        return new ContextPath(id);
    }

    /** Creates a new text element from the given options. */
    createText(options: TextOptions): ContextText {
        return new ContextText(options);
    }

    /** Draws an image onto the rendering surface at the given position and optional size. */
    drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
    }

    /** Clips subsequent drawing operations to the given path. */
    applyClip(path: ContextPath, fillRule?: FillRule): void {
    }

    /** Fills the given path or text element using the current fill style. */
    applyFill(path: ContextElement, fillRule?: FillRule): void {
    }

    /** Strokes the given path or text element using the current stroke style. */
    applyStroke(path: ContextElement): void {
    }

    /** Tests whether a point is inside the filled region of a path. */
    isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        return false;
    }

    /** Tests whether a point is on the stroked outline of a path. */
    isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        return false;
    }

    private getTrackedElements = functionMemoize((event: string) => {
        return this.renderedElements.filter(element => element.has(event));
    });

    private attachInteractionEvent<TEvent extends keyof DOMElementEventMap<HTMLElement>>(event: TEvent, handler: DOMEventHandler<HTMLElement, TEvent>) {
        this.retain(onDOMEvent(this.element as unknown as HTMLElement, event, handler), INTERACTION_KEY);
    }

    private sortByZIndex(elements: RenderElement[]): RenderElement[] {
        return elements.sort((ea, eb) => eb.zIndex - ea.zIndex);
    }

    private hitTest(events: string[], x: number, y: number): RenderElement[] {
        const tracked = events.flatMap(event => this.getTrackedElements(event));

        return tracked.filter(element => element.intersectsWith(x, y, {
            isPointer: true,
        }));
    }

    private handleMouseEnter(): void {
        const state = this.interactionState!;

        ({
            left: state.left,
            top: state.top,
        } = this.element.getBoundingClientRect());

        this.emit('mouseenter', null);
    }

    private handleMouseLeave(): void {
        this.emit('mouseleave', null);
    }

    private handleMouseDown(event: MouseEvent): void {
        const state = this.interactionState!;
        const rx = event.clientX - state.left;
        const ry = event.clientY - state.top;
        const x = this.scaleX(rx);
        const y = this.scaleY(ry);

        const hitElements = this.hitTest(['dragstart', 'drag', 'dragend'], x, y);

        if (hitElements.length > 0) {
            this.sortByZIndex(hitElements);

            state.dragElement = hitElements[0];
            state.dragStartX = rx;
            state.dragStartY = ry;
            state.dragStarted = false;
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        const state = this.interactionState!;
        const x = event.clientX - state.left;
        const y = event.clientY - state.top;

        this.emit('mousemove', {
            x,
            y,
        });

        if (state.dragElement) {
            this.handleDrag(x, y);
        }

        state.scheduleHitTest(() => this.handleHoverHitTest(x, y));
    }

    private handleDrag(rx: number, ry: number): void {
        const state = this.interactionState!;
        const dx = rx - state.dragStartX;
        const dy = ry - state.dragStartY;

        if (!state.dragStarted) {
            if (getEuclideanDistance(dx, dy) >= this.dragThreshold) {
                state.dragStarted = true;
                state.dragPrevX = state.dragStartX;
                state.dragPrevY = state.dragStartY;

                const payload = {
                    x: this.scaleX(state.dragStartX),
                    y: this.scaleY(state.dragStartY),
                };

                this.emit('dragstart', payload);
                state.dragElement!.emit('dragstart', payload);
            }

            return;
        }

        const deltaX = rx - state.dragPrevX;
        const deltaY = ry - state.dragPrevY;

        state.dragPrevX = rx;
        state.dragPrevY = ry;

        const payload = {
            x: this.scaleX(rx),
            y: this.scaleY(ry),
            startX: this.scaleX(state.dragStartX),
            startY: this.scaleY(state.dragStartY),
            deltaX,
            deltaY,
        };

        this.emit('drag', payload);
        state.dragElement!.emit('drag', payload);
    }

    private handleHoverHitTest(rx: number, ry: number): void {
        const x = this.scaleX(rx);
        const y = this.scaleY(ry);

        const hitElements = this.hitTest(['mousemove', 'mouseenter', 'mouseleave'], x, y);

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(hitElements, [...this.activeElements], (hitElement, activeElement) => hitElement === activeElement);

        entries.forEach(element => {
            this.activeElements.add(element);
            element.emit('mouseenter', null);
        });

        updates.forEach(([element]) => element.emit('mousemove', {
            x: rx,
            y: ry,
        }));

        exits.forEach(element => {
            this.activeElements.delete(element);
            element.emit('mouseleave', null);
        });
    }

    private handleMouseUp(event: MouseEvent): void {
        const state = this.interactionState!;

        if (state.dragElement && state.dragStarted) {
            const rx = event.clientX - state.left;
            const ry = event.clientY - state.top;
            const deltaX = rx - state.dragPrevX;
            const deltaY = ry - state.dragPrevY;

            const payload = {
                x: this.scaleX(rx),
                y: this.scaleY(ry),
                startX: this.scaleX(state.dragStartX),
                startY: this.scaleY(state.dragStartY),
                deltaX,
                deltaY,
            };

            this.emit('dragend', payload);
            state.dragElement.emit('dragend', payload);
        }

        state.dragElement = undefined;
        state.dragStarted = false;
    }

    private handleClick(event: MouseEvent): void {
        const state = this.interactionState!;
        const x = this.scaleX(event.clientX - state.left);
        const y = this.scaleY(event.clientY - state.top);

        const hitElements = this.hitTest(['click'], x, y);

        if (hitElements.length > 0) {
            this.sortByZIndex(hitElements);

            hitElements[0].emit('click', {
                x,
                y,
            });
        }
    }

    /** Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing. */
    public enableInteraction(): void {
        if (this.interactionEnabled) {
            return;
        }

        this.interactionEnabled = true;

        this.interactionState = {
            left: 0,
            top: 0,
            dragElement: undefined,
            dragStartX: 0,
            dragStartY: 0,
            dragPrevX: 0,
            dragPrevY: 0,
            dragStarted: false,
            scheduleHitTest: createFrameBuffer(),
        };

        this.attachInteractionEvent('mouseenter', () => this.handleMouseEnter());
        this.attachInteractionEvent('mouseleave', () => this.handleMouseLeave());
        this.attachInteractionEvent('mousedown', event => this.handleMouseDown(event));
        this.attachInteractionEvent('mousemove', event => this.handleMouseMove(event));
        this.attachInteractionEvent('mouseup', event => this.handleMouseUp(event));
        this.attachInteractionEvent('click', event => this.handleClick(event));
    }

    /** Disables DOM interaction events and clears the active element set. */
    public disableInteraction(): void {
        if (!this.interactionEnabled) {
            return;
        }

        this.interactionEnabled = false;
        this.interactionState = undefined;
        this.dispose(INTERACTION_KEY);
        this.activeElements.clear();
    }

    /** Destroys the context, removing the DOM element and disposing all resources. */
    public destroy(): void {
        this.disableInteraction();
        this.element.remove();
        this.dispose();
        super.destroy();
    }

}

/** Type guard that checks whether a value is a `Context` instance. */
export function typeIsContext(value: unknown): value is Context {
    return value instanceof Context;
}