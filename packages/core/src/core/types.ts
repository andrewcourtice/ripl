import type {
    Ease,
} from '../animation';

import type {
    Interpolator,
} from '../interpolators';

import type {
    Box, Point,
} from '../math';

import type {
    OneOrMore,
} from '@ripl/utilities';

export type EventHandler<TPayload> = (payload: TPayload) => void;

export interface EventMap {
    [key: string]: unknown;
}

export interface EventBus<TEventMap = EventMap> {
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

export type ElementValueBounds<TValue = number> = [first: TValue, last: TValue];
export type ElementValueKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
}

export type ElementValue<TValue = number> = TValue
| ElementValueBounds<TValue>
| ElementValueKeyFrame<TValue>[]
| Interpolator<TValue>;


export type ElementProperties<TState extends BaseElementState> = {
    [TKey in keyof TState]: ElementValue<TState[TKey]>;
};

export type ElementProducers<TState extends BaseElementState> = {
    [TKey in keyof TState]: Interpolator<TState[TKey]>;
};

export type ElementInterpolator<TValue> = (valueA: TValue, valueB: TValue) => Interpolator<TValue>
export type ElementInterpolators<TState extends BaseElementState> = {
    [TKey in keyof TState]?: ElementInterpolator<TState[TKey]>;
}

export type ElementDefinition<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> = (instance: ElementInstance<TState, TAttrs>) => ElementRenderFunction<TState>;
export type ElementConstructor<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> = (options?: ElementOptions<TState, TAttrs>) => Element<TState, TAttrs>;
export type ElementRenderFunction<TState extends BaseElementState, TReturn = unknown> = (frame: ElementRenderFrame<TState>) => TReturn;
export type FrameCallback<TState extends BaseElementState> = (key: keyof TState, value: TState[keyof TState]) => void;
export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';
export type ElementValidationType = 'info' | 'warning' | 'error';
export type ElementValidationHandler<TState extends BaseElementState> = (props: ElementProperties<TState>) => void | true | OneOrMore<ElementValidationResult>;
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
    props?: ElementProperties<TState>;
    interpolators?: ElementInterpolators<TState>;
}
export interface ElementInstance<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> {
    on: EventBus<ElementEventMap>['on'];
    emit: EventBus<ElementEventMap>['emit'];
    once: EventBus<ElementEventMap>['once'];
    getAttrs(): TAttrs;
    getAttr<TKey extends keyof TAttrs>(key: TKey): TAttrs[TKey];
    setValidationHandler(handler: ElementValidationHandler<TState>): void;
    setBoundingBoxHandler(handler: ElementBoundingBoxHandler<TState>): void;
    setIntersectionHandler(handler: ElementIntersectionHandler<TState>): void;
}

export interface ElementRenderFrame<TState extends BaseElementState> {
    context: CanvasRenderingContext2D;
    state: TState;
    time: number;
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
    pointerEvents?: ElementPointerEvents;
}

export interface ElementEvent<TData = unknown> extends Event<TData> {
    element: Element;
}

export interface ElementEventMap<TState extends BaseElementState = BaseElementState> {
    'scene:graph': ElementEvent;
    'element:attached': ElementEvent<Group>;
    'element:detached': ElementEvent<Group>;
    'element:updated': ElementEvent<Partial<ElementProperties<TState>>>;
    'element:mouseenter': ElementEvent<MouseEvent>;
    'element:mouseleave': ElementEvent<MouseEvent>;
    'element:mousemove': ElementEvent<MouseEvent>;
    'element:click': ElementEvent<MouseEvent>;
}

export interface Element<TState extends BaseElementState = BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs> {
    id: string;
    type: string;
    class?: string;
    data?: unknown;
    on: EventBus<ElementEventMap>['on'];
    emit: EventBus<ElementEventMap>['emit'];
    once: EventBus<ElementEventMap>['once'];
    clone(): Element<TState, TAttrs>;
    getBoundingBox(): Box;
    intersectsWith(x: number, y: number, options?: ElementIntersectionOptions): boolean;
    setProps(props: Partial<ElementProperties<TState>>): void;
    setAttrs(attrs: Partial<TAttrs>): void;
    getState(time?: number, callback?: FrameCallback<TState>): TState;
    setEndState(newState: Partial<TState>, time?: number): void;
    render(context: CanvasRenderingContext2D, time?: number): void;

    get attrs(): TAttrs;

    /**
     * @internal
     */
    destroy(): void;
    get parent(): Group | undefined;
    set parent(group: Group | undefined);
    get path(): string;
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

export interface RendererTransition {
    startTime: number;
    duration: number;
    ease: Ease;
    loop: boolean;
    callback(): void;
}

export interface RendererTransitionOptions {
    duration: number;
    ease: Ease;
    loop: boolean;
    delay: number | ((index: number, length: number) => number);
    fillMode: RendererFillMode;
    callback(element: Element): void;
}

export interface RendererOptions {
    autoStart?: boolean;
    autoStop?: boolean;
    immediate?: boolean;
    debug?: {
        boundingBoxes: boolean;
    };
}

export interface Renderer {
    start(): void;
    stop(): void;
    update(options: Partial<RendererOptions>): void;
    transition(element: OneOrMore<Element<any>>, options?: Partial<RendererTransitionOptions>): Promise<void>;
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
    props?: ElementProperties<BaseElementState>;
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