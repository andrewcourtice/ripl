/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
    BaseState,
    ContextElement,
    ContextEventMap,
    ContextExport,
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
    EventBus,
} from '../core/event-bus';

import {
    factory,
} from '../core/factory';

import {
    applyElementTransform,
} from '../core/transform';

import type {
    Element as RiplElement,
} from '../core/element';

import {
    CONTEXT_OPERATIONS,
} from '../core/constants';

import {
    scaleContinuous,
} from '../scales';

import type {
    Scale,
} from '../scales';

import {
    arrayDedupe,
    functionMemoize,
    objectForEach,
    typeIsNil,
} from '@ripl/utilities';

export {
    resolveRotation,
    resolveTransformOrigin,
} from './transform';

/** Measures the dimensions of a text string using an optional font and context override. */
export function measureText(value: string, options?: MeasureTextOptions): TextMetrics {
    return factory.measureText(value, options);
}

/** Abstract rendering context providing a unified API for Canvas and SVG, with state management and coordinate scaling. */
export abstract class Context<TElement extends Element = Element, TMeta extends Record<string, unknown> = Record<string, unknown>> extends EventBus<ContextEventMap> implements BaseState {

    /** The context type identifier (e.g. `canvas`, `svg`). */
    public readonly type: string;
    /** The underlying DOM element the context renders into. */
    public readonly element: TElement;
    /** Arbitrary metadata attached to the context. */
    public readonly meta: TMeta;

    /** Whether drawing is buffered rather than committed to the surface immediately. */
    public buffer = false;
    /**
     * Whether this context's hit testing natively accounts for element and ancestor group
     * transforms (as SVG does, via the DOM). When `false` (e.g. canvas), callers map the hit
     * point into the element's local space before testing. See {@link Element.getWorldTransform}.
     */
    public hitTestHonorsTransform = false;
    /** Current width, in pixels, of the rendering surface. */
    public width: number;
    /** Current height, in pixels, of the rendering surface. */
    public height: number;
    /** {@link Scale} mapping domain x coordinates to surface x coordinates. */
    public scaleX: Scale<number, number>;
    /** {@link Scale} mapping domain y coordinates to surface y coordinates. */
    public scaleY: Scale<number, number>;
    /** {@link Scale} mapping logical pixels to device pixels using the device pixel ratio. */
    public scaleDPR: Scale<number, number>;
    /** The element currently being rendered, if any. */
    public renderElement?: RenderElement;
    /** Elements rendered during the current pass, used for hit testing. */
    public renderedElements: RenderElement[];

    protected states: BaseState[];
    protected currentState: BaseState;
    protected renderDepth = 0;
    protected saveDepth = 0;
    private _groupDepthStack: number[] = [];

    /** The event types a context can emit. See {@link EventBus.$events}. */
    public get $events(): (keyof ContextEventMap)[] {
        return [
            'click',
            'destroyed',
            'drag',
            'dragend',
            'dragstart',
            'mouseenter',
            'mouseleave',
            'mousemove',
            'render',
            'resize',
        ];
    }

    /** The element currently being rendered; setting a non-abstract element also records it in {@link Context.renderedElements}. */
    public get currentRenderElement() {
        return this.renderElement;
    }

    public set currentRenderElement(element: RenderElement | undefined) {
        this.renderElement = element;

        if (element && !element.abstract) {
            this.renderedElements.push(element);
        }
    }

    /** Fill style (CSS color, gradient, or pattern) used to paint filled regions. */
    public get fill(): string {
        return this.currentState.fill;
    }

    public set fill(value) {
        this.currentState.fill = value;
    }

    /** CSS filter string applied to subsequent drawing operations (e.g. `blur(4px)`). */
    public get filter(): string {
        return this.currentState.filter;
    }

    public set filter(value) {
        this.currentState.filter = value;
    }

    /** Directionality used when rendering text. */
    public get direction(): Direction {
        return this.currentState.direction;
    }

    public set direction(value) {
        this.currentState.direction = value;
    }

    /** CSS font shorthand used when rendering text. */
    public get font(): string {
        return this.currentState.font;
    }

    public set font(value) {
        this.currentState.font = value;
    }

    /** Whether font kerning is applied when rendering text. */
    public get fontKerning(): FontKerning {
        return this.currentState.fontKerning;
    }

    public set fontKerning(value) {
        this.currentState.fontKerning = value;
    }

    /** Global alpha applied to everything drawn, from 0 to 1. */
    public get opacity(): number {
        return this.currentState.opacity;
    }

    public set opacity(value) {
        this.currentState.opacity = value;
    }

    /** Compositing operation controlling how new drawing is blended with existing content. */
    public get globalCompositeOperation(): unknown {
        return this.currentState.globalCompositeOperation;
    }

    public set globalCompositeOperation(value) {
        this.currentState.globalCompositeOperation = value;
    }

    /** Cap style drawn at the endpoints of stroked lines. */
    public get lineCap(): LineCap {
        return this.currentState.lineCap;
    }

    public set lineCap(value) {
        this.currentState.lineCap = value;
    }

    /** Dash pattern as alternating stroke and gap lengths; empty for a solid line. */
    public get lineDash(): number[] {
        return this.currentState.lineDash;
    }

    public set lineDash(value) {
        this.currentState.lineDash = value;
    }

    /** Distance into the line dash pattern at which dashing begins. */
    public get lineDashOffset(): number {
        return this.currentState.lineDashOffset;
    }

    public set lineDashOffset(value) {
        this.currentState.lineDashOffset = value;
    }

    /** Join style drawn where two stroked segments meet. */
    public get lineJoin(): LineJoin {
        return this.currentState.lineJoin;
    }

    public set lineJoin(value) {
        this.currentState.lineJoin = value;
    }

    /** Width, in pixels, of stroked lines. */
    public get lineWidth(): number {
        return this.currentState.lineWidth;
    }

    public set lineWidth(value) {
        this.currentState.lineWidth = value;
    }

    /** Miter length limit ratio applied to `miter` line joins. */
    public get miterLimit(): number {
        return this.currentState.miterLimit;
    }

    public set miterLimit(value) {
        this.currentState.miterLimit = value;
    }

    /** Gaussian blur radius applied to drawn shadows. */
    public get shadowBlur(): number {
        return this.currentState.shadowBlur;
    }

    public set shadowBlur(value) {
        this.currentState.shadowBlur = value;
    }

    /** Color of drawn shadows. */
    public get shadowColor(): string {
        return this.currentState.shadowColor;
    }

    public set shadowColor(value) {
        this.currentState.shadowColor = value;
    }

    /** Horizontal offset, in pixels, of drawn shadows. */
    public get shadowOffsetX(): number {
        return this.currentState.shadowOffsetX;
    }

    public set shadowOffsetX(value) {
        this.currentState.shadowOffsetX = value;
    }

    /** Vertical offset, in pixels, of drawn shadows. */
    public get shadowOffsetY(): number {
        return this.currentState.shadowOffsetY;
    }

    public set shadowOffsetY(value) {
        this.currentState.shadowOffsetY = value;
    }

    /** Stroke style (CSS color, gradient, or pattern) used to paint outlines. */
    public get stroke(): string {
        return this.currentState.stroke;
    }

    public set stroke(value) {
        this.currentState.stroke = value;
    }

    /** Horizontal alignment of text relative to the drawing position. */
    public get textAlign(): TextAlignment {
        return this.currentState.textAlign;
    }

    public set textAlign(value) {
        this.currentState.textAlign = value;
    }

    /** Vertical baseline used when positioning text. */
    public get textBaseline(): TextBaseline {
        return this.currentState.textBaseline;
    }

    public set textBaseline(value) {
        this.currentState.textBaseline = value;
    }

    /** Stacking order used to sort elements during rendering; higher values draw on top. */
    public get zIndex(): number {
        return this.currentState.zIndex;
    }

    public set zIndex(value) {
        this.currentState.zIndex = value;
    }

    /** Horizontal translation, in pixels, applied to the element's transform. */
    public get translateX(): number {
        return this.currentState.translateX;
    }

    public set translateX(value) {
        this.currentState.translateX = value;
    }

    /** Vertical translation, in pixels, applied to the element's transform. */
    public get translateY(): number {
        return this.currentState.translateY;
    }

    public set translateY(value) {
        this.currentState.translateY = value;
    }

    /** Horizontal scale factor applied to the element's transform. */
    public get transformScaleX(): number {
        return this.currentState.transformScaleX;
    }

    public set transformScaleX(value) {
        this.currentState.transformScaleX = value;
    }

    /** Vertical scale factor applied to the element's transform. */
    public get transformScaleY(): number {
        return this.currentState.transformScaleY;
    }

    public set transformScaleY(value) {
        this.currentState.transformScaleY = value;
    }

    /** Rotation applied to the element's transform, as radians or a `deg`/`rad` string. */
    public get rotation(): Rotation {
        return this.currentState.rotation;
    }

    public set rotation(value) {
        this.currentState.rotation = value;
    }

    /** Horizontal origin about which rotation and scaling are applied. */
    public get transformOriginX(): TransformOrigin {
        return this.currentState.transformOriginX;
    }

    public set transformOriginX(value) {
        this.currentState.transformOriginX = value;
    }

    /** Vertical origin about which rotation and scaling are applied. */
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

    /**
     * Pushes the current state onto the stack and continues with a copy of it, so nested scopes
     * inherit the enclosing drawing state (matching native canvas). This is what lets a group's
     * paint, applied once at its boundary via {@link Context.pushGroup}, cascade to descendants.
     */
    public save(): void {
        this.states.push(this.currentState);
        this.currentState = { ...this.currentState };
        this.saveDepth += 1;
    }

    /** Restores the most recently saved state from the stack. */
    public restore(): void {
        if (this.saveDepth === 0) {
            return;
        }

        this.currentState = this.states.pop() || this.getDefaultState();
        this.saveDepth -= 1;
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
    public invalidateTrackedElements(event?: string): void {
        if (event) {
            this._getTrackedElements.cache.delete(event);
        } else {
            this._getTrackedElements.cache.clear();
        }
    }

    /** Requests that the bound scene repaint on the next frame — for context-level changes (e.g. a 3D camera move) that mutate no element and so would otherwise be skipped by the renderer's dirty check. */
    public requestRender(): void {
        this.emit('render', null);
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

    /**
     * Opens a group boundary: saves the current drawing state and applies the group's own
     * transform, inherited paint, and opacity, so that descendant elements render within the
     * group's coordinate system, inherit its paint through the copied state (the render-tree
     * cascade), and composite under its opacity. Any group-scoped clip is confined to the group.
     * Every {@link Context.pushGroup} must be balanced by a matching {@link Context.popGroup}.
     * Backends that render hierarchy structurally (such as SVG) override this to nest descendants
     * under a group node.
     *
     * @param group - The group element whose boundary is being entered.
     */
    public pushGroup(group: RiplElement): void {
        this._groupDepthStack.push(this.saveDepth);
        this.save();
        applyElementTransform(this, group);
        this.applyGroupPaint(group);

        // Opacity composites the group as a unit (multiplicative), rather than inheriting as a
        // per-element value. Nested groups compound because each `save()` re-copies the state.
        const opacity = group.opacity;

        if (!typeIsNil(opacity) && opacity !== 1) {
            this.opacity *= opacity;
        }
    }

    /**
     * Applies a group's own inherited paint (fill, stroke, font, line, shadow, text) to the
     * context so descendants pick it up from the copied state. Transforms are applied separately
     * and opacity is composited at the boundary, so both are skipped here.
     */
    protected applyGroupPaint(group: RiplElement): void {
        objectForEach(CONTEXT_OPERATIONS, (key, operation) => {
            if (key === 'opacity') {
                return;
            }

            const value = (group as unknown as Record<string, unknown>)[key];

            if (!typeIsNil(value)) {
                (operation as (context: Context, val: unknown) => void)(this, value);
            }
        });
    }

    /**
     * Closes the most recently opened group boundary, unwinding the state stack back to the
     * depth captured at {@link Context.pushGroup}. This absorbs any dangling `save()` left by
     * a group-scoped clip (which deliberately skips its own `restore` so the clip persists to
     * later siblings), confining the clip to the group rather than leaking it to the scene.
     */
    public popGroup(): void {
        const depth = this._groupDepthStack.pop() ?? Math.max(0, this.saveDepth - 1);

        while (this.saveDepth > depth) {
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
    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        // noop
    }

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
    public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        // noop
    }

    /** Measures text dimensions using the context's current font or an optional override. */
    public measureText(text: string, font?: string): TextMetrics {
        return measureText(text, { font });
    }

    /**
     * Whether cached {@link ContextPath}s may be safely reused across render cycles. `false` by
     * default; backends whose {@link Context.createPath} is free of per-frame side effects (e.g.
     * canvas) override this to `true`. SVG, for example, returns `false` because `createPath`
     * registers the path into a per-frame virtual DOM tree.
     */
    public get supportsPathCaching(): boolean {
        return false;
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

    private _getTrackedElements = functionMemoize((event: string) => {
        return this.renderedElements.filter(element => element.has(event));
    });

    /** Tests which rendered elements intersect the given point for the given event types, returning them sorted by zIndex (highest first). */
    protected hitTest(events: string[], x: number, y: number): RenderElement[] {
        const hits = arrayDedupe(events.flatMap(event => this._getTrackedElements(event)))
            .filter(element => element.intersectsWith(x, y, {
                isPointer: true,
            }));

        if (hits.length < 2) {
            return hits;
        }

        // Paint-order tiebreak via a one-pass index map — an `indexOf` inside the comparator
        // would rescan the rendered-element list for every comparison.
        const paintOrder = new Map(this.renderedElements.map((element, index) => [element, index]));

        return hits.sort((ea, eb) => {
            const zDiff = eb.zIndex - ea.zIndex;

            return zDiff !== 0
                ? zDiff
                : (paintOrder.get(eb) ?? -1) - (paintOrder.get(ea) ?? -1);
        });
    }

    /**
     * Captures a snapshot of the current context surface and returns format-specific exporters
     * (see {@link ContextExport}). The base implementation is unsupported; each context overrides
     * this with the formats relevant to it (image, url, string).
     */
    public export(): ContextExport {
        throw new Error(`export() is not supported by the "${this.type}" context`);
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