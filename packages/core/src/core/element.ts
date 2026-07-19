import {
    CONTEXT_OPERATIONS,
    TRACKED_EVENTS,
    TRANSFORM_DEFAULTS,
} from './constants';

import {
    EventBus,
} from './event-bus';

import type {
    EventHandler,
    EventMap,
    EventSubscriptionOptions,
} from './event-bus';

import {
    Box,
    isPointInBox,
    matrixIsIdentity,
    transformBox,
} from '../math';

import type {
    Matrix,
} from '../math';

import type {
    Interpolator,
    InterpolatorFactory,
} from '../interpolators';

import type {
    Group,
} from './group';

import {
    closest,
    matches,
} from './query';

import type {
    Queryable,
} from './query';

import type {
    BaseState,
    Context,
} from '../context';

import {
    functionNoop,
    objectForEach,
    objectReduce,
    stringUniqueId,
    typeIsFunction,
    typeIsNil,
    typeIsString,
    valueOneOrMore,
} from '@ripl/utilities';

import type {
    AnyFunction,
    OneOrMore,
} from '@ripl/utilities';

import {
    getInterpolator,
    getKeyframeInterpolator,
    isElementValueKeyFrame,
} from './element-interpolation';

import {
    applyElementTransform,
    MatrixTransformTarget,
} from './element-transform';

export type { TransformTarget } from './element-transform';

export { applyElementTransform } from './element-transform';

/** Controls which pointer events an element responds to during hit testing. */
export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';

/** Severity level of an element validation result. */
export type ElementValidationType = 'info' | 'warning' | 'error';

/** Options for element intersection (hit) testing. */
export type ElementIntersectionOptions = {
    /** Whether the test originates from a pointer interaction rather than a programmatic query, enabling pointer-event region filtering. */
    isPointer: boolean;
};

/** Base state interface for all elements. All visual properties are optional at the element level. */
export type BaseElementState = Partial<BaseState>;

/** Event map for elements, extending the base event map with lifecycle and interaction events. */
export interface ElementEventMap extends EventMap {
    /** Emitted when the element tree changes, notifying the scene to rebuild its graph; carries no payload. */
    graph: null;
    /** Emitted when the element is attached to a parent {@link Group}, carrying that group. */
    attached: Group;
    /** Emitted when the element is detached from a parent {@link Group}, carrying the former parent group. */
    detached: Group;
    /** Emitted when a state value changes, carrying the affected key and its new value. */
    updated: {
        /** State property key that changed. */
        key: PropertyKey;
        /** New value assigned to the property. */
        value: unknown;
    };
    /** Emitted when the pointer enters the element; carries no payload. */
    mouseenter: null;
    /** Emitted when the pointer leaves the element; carries no payload. */
    mouseleave: null;
    /** Emitted as the pointer moves over the element, carrying its position. */
    mousemove: {
        /** X coordinate of the pointer, in element-local space. */
        x: number;
        /** Y coordinate of the pointer, in element-local space. */
        y: number;
    };
    /** Emitted when the element is clicked, carrying the pointer position. */
    click: {
        /** X coordinate of the pointer, in element-local space. */
        x: number;
        /** Y coordinate of the pointer, in element-local space. */
        y: number;
    };
    /** Emitted when a drag gesture begins on the element, carrying the start position. */
    dragstart: {
        /** X coordinate at which the drag started, in element-local space. */
        x: number;
        /** Y coordinate at which the drag started, in element-local space. */
        y: number;
    };
    /** Emitted continuously while dragging the element, carrying the current position, drag start, and delta from the start. */
    drag: {
        /** Current X coordinate of the pointer, in element-local space. */
        x: number;
        /** Current Y coordinate of the pointer, in element-local space. */
        y: number;
        /** X coordinate at which the drag started, in element-local space. */
        startX: number;
        /** Y coordinate at which the drag started, in element-local space. */
        startY: number;
        /** Horizontal distance moved since the drag started, in pixels. */
        deltaX: number;
        /** Vertical distance moved since the drag started, in pixels. */
        deltaY: number;
    };
    /** Emitted when a drag gesture on the element ends, carrying the final position, drag start, and total delta. */
    dragend: {
        /** Final X coordinate of the pointer, in element-local space. */
        x: number;
        /** Final Y coordinate of the pointer, in element-local space. */
        y: number;
        /** X coordinate at which the drag started, in element-local space. */
        startX: number;
        /** Y coordinate at which the drag started, in element-local space. */
        startY: number;
        /** Total horizontal distance moved over the drag, in pixels. */
        deltaX: number;
        /** Total vertical distance moved over the drag, in pixels. */
        deltaY: number;
    };
    /** Emitted when the element is destroyed; carries no payload. */
    destroyed: null;
}

/** Options for constructing an element, combining an optional id, CSS classes, data, pointer events, and initial state. */
export type ElementOptions<TState extends BaseElementState = BaseElementState> = {
    /** Optional stable id; a unique `type:uniqueId` id is generated when omitted. */
    id?: string;
    /** One or more CSS-like class names used for querying and selection. */
    class?: OneOrMore<string>;
    /** Arbitrary user data bound to the element, typically the datum backing a data-driven visual. */
    data?: unknown;
    /** Which parts of the element respond to pointer hit testing. Defaults to `all`. */
    pointerEvents?: ElementPointerEvents;
} & TState;

/** A single keyframe in a multi-step interpolation, with an optional offset (0–1) and a target value. */
export type ElementInterpolationKeyFrame<TValue = number> = {
    /** Position of the keyframe along the transition, from 0 to 1; distributed evenly when omitted. */
    offset?: number;
    /** Target value the state property holds at this keyframe. */
    value: TValue;
};

/** An interpolation target: a direct value, an array of keyframes, or a custom interpolator function. */
export type ElementInterpolationStateValue<TValue = number> = TValue
| ElementInterpolationKeyFrame<TValue>[]
| Interpolator<TValue>;

/** A map of interpolator factories keyed by state property, used to override default interpolation behaviour. */
export type ElementInterpolators<TState extends BaseElementState> = {
    [TKey in keyof TState]: InterpolatorFactory<TState[TKey]>;
};

/** Partial state where each property can be a target value, keyframe array, or interpolator function. */
export type ElementInterpolationState<TState extends BaseElementState> = {
    [TKey in keyof TState]?: ElementInterpolationStateValue<TState[TKey]>;
};

/** The result of validating an element, with a severity type and descriptive message. */
export interface ElementValidationResult {
    /** Severity of the result — `info`, `warning`, or `error`. */
    type: ElementValidationType;
    /** Human-readable description of the validation result. */
    message: string;
}

/**
 * Reconstructs an element's world transform — the composition of its own transform and
 * every ancestor group's transform, from the root down — for use in hit testing against
 * backends (such as canvas) that do not natively account for element transforms.
 *
 * @param element - The element whose world transform to compute.
 * @returns The composed {@link Matrix}, or `null` when the whole chain is the identity
 * transform (the common case), letting callers skip any point remapping.
 */
export function getWorldTransform(element: Element): Matrix | null {
    return element.$getWorldTransform();
}

/** The base renderable element with state management, event handling, interpolation, transform support, and context rendering. */
export class Element<
    TState extends BaseElementState = BaseElementState,
    TEventMap extends ElementEventMap = ElementEventMap
> extends EventBus<TEventMap> implements Queryable {

    protected state: TState;
    protected context?: Context;

    /** Unique identifier for this element, defaulting to `type:uniqueId` when not supplied. */
    public id: string;
    /** The element type name (e.g. `circle`, `rect`, `group`). */
    public readonly type: string;
    /** Set of CSS-like class names used for querying and selection. */
    public readonly classList: Set<string>;

    /** When `true`, the element skips transform and drawing-state application during {@link Element.render}; used by containers such as {@link Group}. */
    public abstract: boolean = false;
    /** Controls which parts of the element respond to pointer hit testing. See {@link ElementPointerEvents}. */
    public pointerEvents: ElementPointerEvents = 'all';
    /** The parent {@link Group} this element is attached to, or `undefined` when detached. */
    public declare parent?: Group<TEventMap>;
    /** Arbitrary user data bound to the element, typically the datum backing a data-driven visual. */
    public data: unknown;

    private _dirty = false;
    private _touched = false;
    private _paintKeys?: (keyof BaseElementState)[];
    private _stateVersion = 0;

    private _worldTransformCache?: {
        matrix: Matrix | null;
        chain: Element[];
        versions: number[];
    };

    private _localBoxCache?: {
        box: Box;
        version: number;
    };

    private _worldBoxCache?: {
        box: Box;
        version: number;
        matrix: Matrix | null;
    };

    /**
     * The element's own state keys that map to a context paint operation, cached so render-time
     * paint loops visit only the values this element actually sets (state keys are fixed after
     * construction in practice; the cache drops when a new key appears). No-op transform
     * operations are excluded — transforms are applied separately.
     */
    public get $paintKeys(): readonly (keyof BaseElementState)[] {
        return this._paintKeys ??= Object.keys(this.state).filter(key => {
            const operation = CONTEXT_OPERATIONS[key as keyof typeof CONTEXT_OPERATIONS];

            return !!operation && operation !== functionNoop;
        }) as (keyof BaseElementState)[];
    }

    /** Whether an own state value has changed since the last render cycle. Drives per-element path-cache invalidation and is reset after each render cycle. */
    public get $dirty(): boolean {
        return this._dirty;
    }

    /** Whether a state value was set since the last render cycle (the element was addressed), whether or not the value changed — so a real change also sets this. Reset after each render cycle. */
    public get $touched(): boolean {
        return this._touched;
    }

    /** Whether this element or any ancestor {@link Group} is dirty. Provided for subtree-level render skipping; the path cache uses {@link Element.$dirty} (own) because paths are authored in local space. */
    public get $anyDirty(): boolean {
        return this._dirty || (this.parent?.$anyDirty ?? false);
    }

    // Props

    /** Text directionality used when rendering text, mirroring the canvas `direction` drawing-state property (`inherit`, `ltr`, or `rtl`). */
    public get direction() {
        return this.getStateValue('direction');
    }

    public set direction(value) {
        this.setStateValue('direction', value);
    }

    /** Fill style (colour or gradient) painted inside the element, mirroring the canvas `fillStyle` drawing-state property. */
    public get fill() {
        return this.getStateValue('fill');
    }

    public set fill(value) {
        this.setStateValue('fill', value);
    }

    /** Filter effects applied to the element, mirroring the canvas `filter` drawing-state property. */
    public get filter() {
        return this.getStateValue('filter');
    }

    public set filter(value) {
        this.setStateValue('filter', value);
    }

    /** Font used for text rendering, mirroring the canvas `font` drawing-state property. */
    public get font() {
        return this.getStateValue('font');
    }

    public set font(value) {
        this.setStateValue('font', value);
    }

    /** Opacity of the element from 0 (transparent) to 1 (opaque), mapping to the canvas `globalAlpha` drawing-state property. */
    public get opacity() {
        return this.getStateValue('opacity');
    }

    public set opacity(value) {
        this.setStateValue('opacity', value);
    }

    /** Compositing/blend mode used to draw the element, mirroring the canvas `globalCompositeOperation` drawing-state property. */
    public get globalCompositeOperation() {
        return this.getStateValue('globalCompositeOperation');
    }

    public set globalCompositeOperation(value) {
        this.setStateValue('globalCompositeOperation', value);
    }

    /** Cap style drawn at the ends of stroked lines, mirroring the canvas `lineCap` drawing-state property (`butt`, `round`, or `square`). */
    public get lineCap() {
        return this.getStateValue('lineCap');
    }

    public set lineCap(value) {
        this.setStateValue('lineCap', value);
    }

    /** Dash pattern for stroked lines, mirroring the canvas line-dash array set via `setLineDash`. */
    public get lineDash() {
        return this.getStateValue('lineDash');
    }

    public set lineDash(value) {
        this.setStateValue('lineDash', value);
    }

    /** Offset into the line-dash pattern, mirroring the canvas `lineDashOffset` drawing-state property. */
    public get lineDashOffset() {
        return this.getStateValue('lineDashOffset');
    }

    public set lineDashOffset(value) {
        this.setStateValue('lineDashOffset', value);
    }

    /** Join style drawn where stroked segments meet, mirroring the canvas `lineJoin` drawing-state property (`bevel`, `miter`, or `round`). */
    public get lineJoin() {
        return this.getStateValue('lineJoin');
    }

    public set lineJoin(value) {
        this.setStateValue('lineJoin', value);
    }

    /** Width of stroked lines in pixels, mirroring the canvas `lineWidth` drawing-state property. */
    public get lineWidth() {
        return this.getStateValue('lineWidth');
    }

    public set lineWidth(value) {
        this.setStateValue('lineWidth', value);
    }

    /** Miter length limit for `miter` line joins, mirroring the canvas `miterLimit` drawing-state property. */
    public get miterLimit() {
        return this.getStateValue('miterLimit');
    }

    public set miterLimit(value) {
        this.setStateValue('miterLimit', value);
    }

    /** Blur radius applied to the element's shadow, mirroring the canvas `shadowBlur` drawing-state property. */
    public get shadowBlur() {
        return this.getStateValue('shadowBlur');
    }

    public set shadowBlur(value) {
        this.setStateValue('shadowBlur', value);
    }

    /** Colour of the element's shadow, mirroring the canvas `shadowColor` drawing-state property. */
    public get shadowColor() {
        return this.getStateValue('shadowColor');
    }

    public set shadowColor(value) {
        this.setStateValue('shadowColor', value);
    }

    /** Horizontal offset of the element's shadow, mirroring the canvas `shadowOffsetX` drawing-state property. */
    public get shadowOffsetX() {
        return this.getStateValue('shadowOffsetX');
    }

    public set shadowOffsetX(value) {
        this.setStateValue('shadowOffsetX', value);
    }

    /** Vertical offset of the element's shadow, mirroring the canvas `shadowOffsetY` drawing-state property. */
    public get shadowOffsetY() {
        return this.getStateValue('shadowOffsetY');
    }

    public set shadowOffsetY(value) {
        this.setStateValue('shadowOffsetY', value);
    }

    /** Stroke style (colour or gradient) painted along the element's outline, mirroring the canvas `strokeStyle` drawing-state property. */
    public get stroke() {
        return this.getStateValue('stroke');
    }

    public set stroke(value) {
        this.setStateValue('stroke', value);
    }

    /** Horizontal alignment of rendered text, mirroring the canvas `textAlign` drawing-state property. */
    public get textAlign() {
        return this.getStateValue('textAlign');
    }

    public set textAlign(value) {
        this.setStateValue('textAlign', value);
    }

    /** Vertical baseline of rendered text, mirroring the canvas `textBaseline` drawing-state property. */
    public get textBaseline() {
        return this.getStateValue('textBaseline');
    }

    public set textBaseline(value) {
        this.setStateValue('textBaseline', value);
    }

    /** Effective stacking order of the element, combining its own z-index with its parent {@link Group}'s. Higher values render on top. */
    public get zIndex(): number {
        return (this.parent?.zIndex ?? 0) + (this.state.zIndex ?? 0);
    }

    public set zIndex(value) {
        this.setStateValue('zIndex', value);
    }

    /** Horizontal translation applied to the element during rendering, in pixels. */
    public get translateX() {
        return this.getStateValue('translateX');
    }

    public set translateX(value) {
        this.setStateValue('translateX', value);
    }

    /** Vertical translation applied to the element during rendering, in pixels. */
    public get translateY() {
        return this.getStateValue('translateY');
    }

    public set translateY(value) {
        this.setStateValue('translateY', value);
    }

    /** Horizontal scale factor applied to the element during rendering (`1` is unscaled). */
    public get transformScaleX() {
        return this.getStateValue('transformScaleX');
    }

    public set transformScaleX(value) {
        this.setStateValue('transformScaleX', value);
    }

    /** Vertical scale factor applied to the element during rendering (`1` is unscaled). */
    public get transformScaleY() {
        return this.getStateValue('transformScaleY');
    }

    public set transformScaleY(value) {
        this.setStateValue('transformScaleY', value);
    }

    /** Rotation applied to the element during rendering, in radians or as a CSS-like angle string. */
    public get rotation() {
        return this.getStateValue('rotation');
    }

    public set rotation(value) {
        this.setStateValue('rotation', value);
    }

    /** Horizontal origin about which transforms are applied, as a pixel value or percentage string. */
    public get transformOriginX() {
        return this.getStateValue('transformOriginX');
    }

    public set transformOriginX(value) {
        this.setStateValue('transformOriginX', value);
    }

    /** Vertical origin about which transforms are applied, as a pixel value or percentage string. */
    public get transformOriginY() {
        return this.getStateValue('transformOriginY');
    }

    public set transformOriginY(value) {
        this.setStateValue('transformOriginY', value);
    }

    constructor(type: string, {
        id = `${type}:${stringUniqueId()}`,
        class: classes = [],
        data,
        pointerEvents = 'all',
        ...state
    }: ElementOptions<TState>) {
        super();

        this.type = type;
        this.id = id;
        this.data = data;
        this.pointerEvents = pointerEvents;
        this.classList = new Set(valueOneOrMore(classes));

        this.state = {
            ...TRANSFORM_DEFAULTS,
            ...state,
        } as unknown as TState;
    }

    /**
     * Reads this element's own state value (no inheritance). Inherited paint now cascades through
     * the render tree — a group applies its paint at its boundary ({@link Context.pushGroup}) and
     * descendants pick it up from the context's copied state — so property getters return own
     * values only, mirroring how the browser resolves computed style at paint time. Use
     * {@link Element.getComputedStateValue} when the effective (inheritance-resolved) value is
     * required outside a render pass (e.g. animation start values).
     */
    protected getStateValue<TKey extends keyof TState>(key: TKey) {
        return this.state[key];
    }

    /**
     * Resolves a state value against the parent chain (own value, else the nearest ancestor's) —
     * the effective value an element renders with. Used where the resolved value is needed without
     * a live context, such as computing a transition's start value.
     */
    protected getComputedStateValue<TKey extends keyof TState>(key: TKey): TState[TKey] {
        const own = this.state[key];

        if (own !== undefined && own !== null) {
            return own;
        }

        return (this.parent as unknown as Element<TState> | undefined)?.getComputedStateValue(key) as TState[TKey];
    }

    /**
     * Sets a state value, marking the element {@link Element.$touched}. When the value differs
     * from the current one it is written, the element is marked {@link Element.$dirty}, and an
     * `updated` event is emitted; setting a value equal to the current one is a no-op beyond
     * `$touched` (no write, no `$dirty`, no event).
     */
    protected setStateValue<TKey extends keyof TState>(key: TKey, value: TState[TKey]) {
        this._touched = true;

        if (this.state[key] === value) {
            return;
        }

        if (!(key in this.state)) {
            this._paintKeys = undefined;
        }

        this.state[key] = value;
        this._stateVersion++;
        this._dirty = true;
        this.emit('updated', {
            key,
            value,
        });
    }

    /**
     * Subscribes a handler to an element event, returning a disposable subscription.
     *
     * Overrides {@link EventBus.on} to additionally invalidate the {@link Context}'s tracked-element
     * cache for interaction events, keeping hit testing accurate as listeners are added and removed.
     *
     * @param event - The event name to listen for.
     * @param handler - Callback invoked when the event is emitted.
     * @param options - Optional subscription options (e.g. self-only filtering).
     * @returns A disposable used to remove the subscription.
     */
    public on<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>, options?: EventSubscriptionOptions) {
        const listener = super.on(event, handler, options);

        if (!TRACKED_EVENTS.includes(event as keyof ElementEventMap)) {
            return listener;
        }

        this.context?.invalidateTrackedElements(event as string);

        return {
            dispose: () => {
                this.context?.invalidateTrackedElements(event as string);
                listener.dispose();
            },
        };
    }

    /** Creates a shallow clone of this element with the same id, classes, and state. */
    public clone() {
        return new Element(this.type, {
            id: this.id,
            class: Array.from(this.classList),
            ...this.state,
        });
    }

    /** Tests whether this element matches the CSS-like selector. */
    public matches(selector: string): boolean {
        return matches(this, selector);
    }

    /** Returns the closest ancestor (including this element) matching the CSS-like selector, or `undefined`. */
    public closest<TElement extends Element = Element>(selector: string) {
        return closest<TElement>(this, selector);
    }

    /**
     * @internal Raw local-space geometry hook. Override per element to return the untransformed,
     * authored bounding box in the element's own coordinate space. Consumers should call
     * {@link Element.getBoundingBox} instead.
     */
    public _getLocalBoundingBox(): Box {
        return new Box(0, 0, 0, 0);
    }

    /**
     * Whether this element's bounding boxes may be cached against its own state version. Groups
     * opt out — their box composes from children whose changes are not visible in the group's own
     * state.
     */
    protected get _boundsCacheable(): boolean {
        return true;
    }

    /**
     * The element's world transform (own and every ancestor's transform composed root-first), or
     * `null` when the composition is the identity. Cached against the parent chain's state
     * versions, so static scenes skip the matrix rebuild; any state change (or reparent) along the
     * chain recomputes. A chain node whose transform origin resolves against an uncacheable box
     * (a group with a string origin) bypasses the cache entirely.
     */
    public $getWorldTransform(): Matrix | null {
        const cache = this._worldTransformCache;
        const node = this as unknown as Element;

        let cacheable = true;
        let valid = !!cache;
        let index = 0;

        let current: Element | undefined = node;

        while (current) {
            if (!current._boundsCacheable && (typeIsString(current.transformOriginX) || typeIsString(current.transformOriginY))) {
                cacheable = false;
            }

            if (valid && cache && (cache.chain[index] !== current || cache.versions[index] !== current._stateVersion)) {
                valid = false;
            }

            index++;
            current = current.parent as Element | undefined;
        }

        if (cacheable && valid && cache && cache.chain.length === index) {
            return cache.matrix;
        }

        const chain: Element[] = [];
        const versions: number[] = [];

        current = node;

        while (current) {
            chain.push(current);
            versions.push(current._stateVersion);
            current = current.parent as Element | undefined;
        }

        const target = new MatrixTransformTarget();

        for (let position = chain.length - 1; position >= 0; position--) {
            applyElementTransform(target, chain[position]);
        }

        const matrix = matrixIsIdentity(target.matrix)
            ? null
            : target.matrix;

        if (cacheable) {
            this._worldTransformCache = {
                matrix,
                chain,
                versions,
            };
        }

        return matrix;
    }

    /**
     * Returns this element's bounding box: the on-screen (world) box by default, or the raw local
     * box when `local` is `true`. The world box applies this element's own and every ancestor
     * group's transform (mirroring the DOM's `getBoundingClientRect`); a rotated element yields a
     * conservative axis-aligned box.
     * @param local - when `true`, returns the untransformed authored geometry instead of the world box.
     */
    public getBoundingBox(local = false): Box {
        const cacheable = this._boundsCacheable;
        const localCache = this._localBoxCache;

        let box: Box;

        if (cacheable && localCache && localCache.version === this._stateVersion) {
            box = localCache.box;
        } else {
            box = this._getLocalBoundingBox();

            if (cacheable) {
                this._localBoxCache = {
                    box,
                    version: this._stateVersion,
                };
            }
        }

        if (local) {
            return new Box(box.top, box.left, box.bottom, box.right);
        }

        const matrix = this.$getWorldTransform();
        const worldCache = this._worldBoxCache;

        if (cacheable && worldCache && worldCache.version === this._stateVersion && worldCache.matrix === matrix) {
            const cached = worldCache.box;

            return new Box(cached.top, cached.left, cached.bottom, cached.right);
        }

        const world = transformBox(box, matrix);

        if (cacheable) {
            this._worldBoxCache = {
                box: world,
                version: this._stateVersion,
                matrix,
            };
        }

        return new Box(world.top, world.left, world.bottom, world.right);
    }

    /** Tests whether a point intersects this element’s bounding box. Override for custom hit testing. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        return isPointInBox([x, y], this.getBoundingBox());
    }

    /** Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides. */
    public interpolate(newState: Partial<ElementInterpolationState<TState>>, interpolators: Partial<ElementInterpolators<TState>> = {}): Interpolator<void> {
        const mappedIntpls = objectReduce(newState, (output, key, value) => {
            // Start from the element's *effective* value (own, else inherited) so a transition on
            // an inherited property animates from what's actually on screen.
            const currentValue = this.getComputedStateValue(key);

            if (typeIsNil(currentValue)) {
                return output;
            }

            if (typeIsFunction(value)) {
                return (output[key] = value, output);
            }

            const interpolator = interpolators[key] || getInterpolator(currentValue, key as string);

            if (isElementValueKeyFrame(value)) {
                return (output[key] = getKeyframeInterpolator(currentValue, value, interpolator), output);
            }

            return (output[key] = interpolator(currentValue, value as TState[keyof TState]), output);
        }, {} as Record<keyof TState, Interpolator<TState[keyof TState] | undefined>>);

        // The tick writes state directly, so a transition targeting a not-yet-set paint key must
        // drop the cached paint-key list up front for the new key to be painted.
        this._paintKeys = undefined;

        return time => {
            // The tick writes state directly (bypassing setStateValue), so mark dirty here or
            // an animating shape would keep serving a stale cached path.
            this._dirty = true;
            this._stateVersion++;

            objectForEach(mappedIntpls, (key, value) => {
                this.state[key] = value(time) as TState[keyof TState];
            });
        };
    }

    /** Renders this element by applying transforms and context state, then invoking the optional callback. */
    public render(context: Context, callback?: AnyFunction, skipRestore?: boolean) {
        this.context = context;
        context.currentRenderElement = this;

        context.markRenderStart();
        context.save();

        try {
            if (!this.abstract) {
                applyElementTransform(context, this as unknown as Element);

                for (const key of this.$paintKeys) {
                    const value = (this as unknown as Record<keyof BaseElementState, unknown>)[key];

                    if (!typeIsNil(value)) {
                        (CONTEXT_OPERATIONS[key as keyof typeof CONTEXT_OPERATIONS] as (ctx: Context, val: unknown) => void)(context, value);
                    }
                }
            }

            callback?.();
        } finally {
            if (!skipRestore) {
                context.restore();
            }

            context.markRenderEnd();

            // Every leaf (and any directly-rendered element) clears its own per-cycle flags here.
            // Groups override `render`, so the scene/renderer reset them at their `pop` instead.
            this.$reset();
        }
    }

    /**
     * Resets this element's per-render-cycle change flags ({@link Element.$dirty} and
     * {@link Element.$touched}). Called automatically at the end of each render cycle — by an
     * element's own {@link Element.render} for leaves, and by the scene/renderer at each group
     * `pop` and for the root. Consumers do not normally call this directly.
     */
    public $reset(): void {
        this._dirty = false;
        this._touched = false;
    }

    /** Detaches the element from its parent {@link Group} and tears down its event subscriptions. */
    public destroy() {
        this.parent?.remove(this as unknown as Element);
        super.destroy();
    }
}

/** Factory function that creates a new `Element` instance. */
export function createElement(...options: ConstructorParameters<typeof Element>) {
    return new Element(...options);
}

/** Type guard that checks whether a value is an `Element` instance. */
export function typeIsElement(value: unknown): value is Element {
    return value instanceof Element;
}
