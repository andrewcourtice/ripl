import type {
    Ease,
} from '../animation';

import type {
    Interpolator,
    InterpolatorFactory,
} from '../interpolators';

import type {
    Box, Point,
} from '../math';

import type {
    Disposable,
    OneOrMore,
} from '@ripl/utilities';

export type EventHandler<TPayload> = (payload: TPayload) => void;

export interface EventMap {
    [key: string]: unknown;
}

export interface EventBus<TEventMap = EventMap> {
    has<TEvent extends keyof TEventMap>(event: OneOrMore<TEvent>): boolean;
    on<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): Disposable;
    off<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): void;
    once<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): Disposable;
    emit<TEvent extends keyof TEventMap>(event: TEvent, payload: TEventMap[TEvent]): void;
    destroy(): void;
}

export interface Event<TData = unknown> {
    data?: TData;
    bubble: boolean;
    stopPropagation(): void;
}

export type ElementInterpolators<TState extends BaseElementState> = {
    [TKey in keyof TState]?: InterpolatorFactory<TState[TKey]>;
}

export type ElementDefinition<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> = (instance: ElementInstance<TState, TAttrs>) => ElementRenderFunction<TState>;
export type ElementConstructor<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> = (options?: ElementOptions<TState, TAttrs>) => Element<TState, TAttrs>;
export type ElementRenderFunction<TState extends BaseElementState, TReturn = unknown> = (frame: ElementRenderFrame<TState>) => TReturn;
export type FrameCallback<TState extends BaseElementState> = (key: keyof TState, value: TState[keyof TState]) => void;
export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';
export type ElementValidationType = 'info' | 'warning' | 'error';
export type ElementValidationHandler<TState extends BaseElementState> = (state: TState) => void | true | OneOrMore<ElementValidationResult>;
export type ElementBoundingBoxHandler<TState extends BaseElementState> = (data: ElementBoundingBoxData<TState>) => Box;
export type ElementIntersectionHandler<TState extends BaseElementState> = (point: Point, data: ElementIntersectionData<TState>) => boolean;

export interface ElementIntersectionOptions {
    isPointer: boolean;
}

export interface ElementIntersectionData<TState extends BaseElementState> extends ElementIntersectionOptions {
    context: CanvasRenderingContext2D;
    state: TState;
}

export interface ElementBoundingBoxData<TState extends BaseElementState> {
    context: CanvasRenderingContext2D;
    state: TState;
}

export interface ElementValidationResult {
    type: ElementValidationType;
    message: string;
}

export interface ElementDefinitionOptions<TState extends BaseElementState> {
    abstract?: boolean;
    interpolators?: ElementInterpolators<TState>;
}

export interface ElementOptions<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> {
    id?: string;
    class?: string;
    data?: unknown;
    attrs?: TAttrs;
    state?: TState;
    interpolators?: ElementInterpolators<TState>;
}

export interface ElementInstance<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> {
    on: EventBus<ElementEventMap>['on'];
    emit: EventBus<ElementEventMap>['emit'];
    once: EventBus<ElementEventMap>['once'];
    get id(): string;
    get state(): Readonly<TState>;
    get attrs(): Readonly<TAttrs>;
    get interpolators(): Readonly<ElementInterpolators<TState>>;
    setValidationHandler(handler: ElementValidationHandler<TState>): void;
    setBoundingBoxHandler(handler: ElementBoundingBoxHandler<TState>): void;
    setIntersectionHandler(handler: ElementIntersectionHandler<TState>): void;
}

export interface ElementRenderFrame<TState extends BaseElementState> {
    context: CanvasRenderingContext2D;
    state: TState;
}

export interface BaseElementState {
    strokeStyle?: CanvasRenderingContext2D['strokeStyle'];
    fillStyle?: CanvasRenderingContext2D['fillStyle'];
    lineWidth?: CanvasRenderingContext2D['lineWidth'];
    lineDash?: number[];
    lineDashOffset?: CanvasRenderingContext2D['lineDashOffset'];
    lineCap?: CanvasRenderingContext2D['lineCap'];
    lineJoin?: CanvasRenderingContext2D['lineJoin'];
    miterLimit?: CanvasRenderingContext2D['miterLimit'];

    font?: CanvasRenderingContext2D['font'];
    direction?: CanvasRenderingContext2D['direction'];
    textAlign?: CanvasRenderingContext2D['textAlign'];
    textBaseline?: CanvasRenderingContext2D['textBaseline'];

    filter?: CanvasRenderingContext2D['filter'];
    globalAlpha?: CanvasRenderingContext2D['globalAlpha'];
    globalCompositeOperation?: CanvasRenderingContext2D['globalCompositeOperation'];

    shadowBlur?: CanvasRenderingContext2D['shadowBlur'];
    shadowColor?: CanvasRenderingContext2D['shadowColor'];
    shadowOffsetX?: CanvasRenderingContext2D['shadowOffsetX'];
    shadowOffsetY?: CanvasRenderingContext2D['shadowOffsetY'];
}

export interface BaseElementAttrs {
    [key: string]: unknown;
    pointerEvents?: ElementPointerEvents;
}

export interface ElementEvent<TData = unknown> extends Event<TData> {
    element: Element;
}

export interface ElementEventMap<TState extends BaseElementState = BaseElementState> {
    'scene:graph': ElementEvent;
    'scene:track': ElementEvent<keyof ElementEventMap>;
    'scene:untrack': ElementEvent<keyof ElementEventMap>;
    'element:attached': ElementEvent<Group>;
    'element:detached': ElementEvent<Group>;
    'element:updated': ElementEvent<ElementOptions<TState>>;
    'element:mouseenter': ElementEvent<MouseEvent>;
    'element:mouseleave': ElementEvent<MouseEvent>;
    'element:mousemove': ElementEvent<MouseEvent>;
    'element:click': ElementEvent<MouseEvent>;
}

export interface Element<TState extends BaseElementState = BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> {
    class?: string;
    has: EventBus<ElementEventMap>['has'];
    on: EventBus<ElementEventMap>['on'];
    emit: EventBus<ElementEventMap>['emit'];
    once: EventBus<ElementEventMap>['once'];
    clone(): Element<TState, TAttrs>;
    getBoundingBox(): Box;
    intersectsWith(x: number, y: number, options?: ElementIntersectionOptions): boolean;
    interpolate(newState: ElementInterpolationState<TState>): Interpolator<TState>;
    update(options: ElementOptions<TState, TAttrs>): this;
    render(context: CanvasRenderingContext2D): void;
    destroy(): void;

    get id(): string;
    get type(): string;
    get state(): Readonly<TState>;
    get attrs(): Readonly<TAttrs>;
    get interpolators(): Readonly<ElementInterpolators<TState>>;
    get data(): unknown;
    get parent(): Group | undefined;
    set parent(group: Group | undefined);
    get path(): string;
}

export interface GroupOptions extends ElementOptions<BaseElementState> {
    children?: OneOrMore<Element>;
}

export interface Group extends Element {
    set(elements: Element<any>[]): void;
    add(element: OneOrMore<Element<any>>): void;
    remove(element: OneOrMore<Element<any>>): void;
    graph(includeGroups?: boolean): Element[];
    find(query: string): Element | undefined;
    findAll(query: string): Element[];
    clear(): void;
    get elements(): Element[];
}

export type ShapeRenderFunction<TState extends BaseElementState> = (frame: ShapeRenderFrame<TState>) => void;
export type ShapeDefinition<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> = (instance: ShapeInstance<TState, TAttrs>) => ShapeRenderFunction<TState>;
export type ShapeBoundingBoxHandler<TState extends BaseElementState> = (data: ShapeBoundingBoxData<TState>) => Box;
export type ShapeIntersectionHandler<TState extends BaseElementState> = (point: Point, data: ShapeIntersectionData<TState>) => boolean;

export interface ShapeIntersectionData<TState extends BaseElementState> extends ElementIntersectionData<TState> {
    path?: Path2D;
}

export interface ShapeBoundingBoxData<TState extends BaseElementState> extends ElementBoundingBoxData<TState> {
    path?: Path2D;
}

export interface ShapeInstance<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> extends ElementInstance<TState, TAttrs> {
    setBoundingBoxHandler(handler: ShapeBoundingBoxHandler<TState>): void;
    setIntersectionHandler(handler: ShapeIntersectionHandler<TState>): void;
}

export interface ShapeRenderFrame<TState extends BaseElementState> extends ElementRenderFrame<TState> {
    get path(): Path2D;
}

export interface ShapeDefinitionOptions<TState extends BaseElementState> extends Omit<ElementDefinitionOptions<TState>, 'onRender'> {
    autoStroke?: boolean;
    autoFill?: boolean;
}

export type RendererFillMode = 'none' | 'forwards';

export interface RendererEventMap {
    'renderer:start': {
        startTime: number;
    };
    'renderer:stop': {
        startTime: number;
        endTime: number;
    };
}

export interface RendererTransition<TState extends BaseElementState = BaseElementState> {
    startTime: number;
    duration: number;
    ease: Ease;
    loop: boolean;
    interpolator: Interpolator<TState>;
    callback(): void;
}

export type RendererTransitionKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
}

export type RendererTransitionStateValue<TValue = number> = TValue
| RendererTransitionKeyFrame<TValue>[]
| Interpolator<TValue>;

export type ElementInterpolationState<TState extends BaseElementState> = {
    [TKey in keyof TState]?: RendererTransitionStateValue<NonNullable<TState>[TKey]>;
};

export interface RendererTransitionOptions<TElement extends Element> {
    duration?: number;
    ease?: Ease;
    loop?: boolean;
    delay?: number;
    fillMode?: RendererFillMode;
    state: ElementInterpolationState<TElement extends Element<infer TState> ? TState : BaseElementState>;
    callback?(element: Element): void;
}

export interface RendererOptions {
    autoStart?: boolean;
    autoStop?: boolean;
    immediate?: boolean;
    debug?: {
        boundingBoxes: boolean;
    };
}

export type RendererTransitionOptionsArg<TElement extends Element> = RendererTransitionOptions<TElement> | ((
    element: TElement extends Group ? Element : TElement,
    index: number,
    length: number
) => RendererTransitionOptions<TElement>);

export interface Renderer {
    start(): void;
    stop(): void;
    update(options: Partial<RendererOptions>): void;
    transition<TElement extends Element>(element: OneOrMore<TElement>, options?: RendererTransitionOptionsArg<TElement>): Promise<void>;
    on: EventBus<RendererEventMap>['on'];
    off: EventBus<RendererEventMap>['off'];
    get running(): boolean;
    get busy(): boolean;
}

export interface SceneEventMap extends ElementEventMap {
    'scene:resize': Event<{
        width: number;
        height: number;
    }>;
    'scene:mouseenter': Event<MouseEvent>;
    'scene:mouseleave': Event<MouseEvent>;
    'scene:mousemove': Event<{
        x: number;
        y: number;
        event: MouseEvent;
    }>;
}

export interface SceneOptions {
    state?: BaseElementState;
    renderOnResize: boolean;
}

export interface Scene {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    add: Group['add'];
    remove: Group['remove'];
    clear: Group['clear'];
    find: Group['find'];
    findAll: Group['findAll'];
    graph: Group['graph'];
    on<TEvent extends keyof SceneEventMap>(event: TEvent, handler: EventHandler<SceneEventMap[TEvent]>): Disposable | undefined;
    emit<TEvent extends keyof SceneEventMap>(event: TEvent, payload: SceneEventMap[TEvent]): void;
    render(time?: number): void;
    dispose(): void;
    get width(): number;
    get height(): number;
    get elements(): Element[];
}