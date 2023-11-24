import {
    Ease,
} from '../animation';

import {
    Interpolator,
} from '../interpolators';

import {
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


export type ElementProperties<TElement extends BaseElement> = {
    [TKey in keyof TElement]: ElementValue<TElement[TKey]>;
};

export type ElementValueFunctions<TElement extends BaseElement> = {
    [TKey in keyof TElement]: Interpolator<TElement[TKey]>;
};

export type ElementInterpolator<TValue> = (valueA: TValue, valueB: TValue) => Interpolator<TValue>
export type ElementInterpolators<TElement extends BaseElement> = {
    [TKey in keyof TElement]?: ElementInterpolator<TElement[TKey]>;
}

export type ElementDefinition<TElement extends BaseElement, TResult = unknown> = (properties: ElementProperties<TElement>, options: ElementOptions<TElement>, instance: ElementInstance<TElement>) => ElementRenderFunction<TElement, TResult>;
export type ElementConstructor<TElement extends BaseElement, TResult = unknown> = (properties: ElementProperties<TElement>, options?: ElementOptions<TElement>) => Element<TElement, TResult>;
export type ElementRenderFunction<TElement extends BaseElement, TReturn = unknown> = (frame: ElementRenderFrame<TElement>) => TReturn;
export type FrameCallback<TElement extends BaseElement> = (key: keyof TElement, value: TElement[keyof TElement]) => void;
export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';

export interface ElementDefinitionOptions<TElement extends BaseElement> {
    abstract?: boolean;
    interpolators?: ElementInterpolators<TElement>;
}

export interface ElementOptions<TElement extends BaseElement> {
    id?: string;
    class?: string;
    data?: unknown;
    pointerEvents?: ElementPointerEvents;
    interpolators?: ElementInterpolators<TElement>;
}

export interface ElementInstance<TElement extends BaseElement> {
    onUpdate(handler: EventHandler<ElementEventMap['elementupdated']>): void;
}

export interface ElementRenderFrame<TElement extends BaseElement> {
    context: CanvasRenderingContext2D;
    state: TElement;
    time: number;
}

export interface BaseElement {
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

export interface ElementEvent<TData = unknown> extends Event<TData> {
    element: Element;
}

export interface ElementEventMap<TElement extends BaseElement = BaseElement> {
    scenegraph: ElementEvent;
    elementattached: ElementEvent<Group>;
    elementdetached: ElementEvent<Group>;
    elementupdated: ElementEvent<Partial<ElementProperties<TElement>>>;
    elementmouseenter: ElementEvent<MouseEvent>;
    elementmouseleave: ElementEvent<MouseEvent>;
    elementmousemove: ElementEvent<MouseEvent>;
    elementclick: ElementEvent<MouseEvent>;
}

export interface Element<TElement extends BaseElement = BaseElement, TResult = unknown> {
    id: string;
    type: string;
    class?: string;
    data?: unknown;
    pointerEvents: ElementPointerEvents;
    on: EventBus<ElementEventMap>['on'];
    emit: EventBus<ElementEventMap>['emit'];
    once: EventBus<ElementEventMap>['once'];
    clone(): Element<TElement>;
    update(properties: Partial<ElementProperties<TElement>>): void;
    state(time?: number, callback?: FrameCallback<TElement>): TElement;
    to(newState: Partial<TElement>, time?: number): void;
    render(context: CanvasRenderingContext2D, time?: number): TResult;

    /**
     * @internal
     */
    destroy(): void;
    get parent(): Group | undefined;
    set parent(group: Group | undefined);
    get path(): string;
    get result(): TResult | undefined;
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

export type ShapeRenderFunction<TElement extends BaseElement> = (frame: ShapeRenderFrame<TElement>) => void;
export type ShapeDefinition<TElement extends BaseElement> = (...args: Parameters<ElementDefinition<TElement, Path2D>>) => ShapeRenderFunction<TElement>;

export interface ShapeRenderFrame<TElement extends BaseElement> extends ElementRenderFrame<TElement> {
    path: Path2D;
}

export interface ShapeDefinitionOptions<TElement extends BaseElement> extends Omit<ElementDefinitionOptions<TElement>, 'onRender'> {
    autoStroke?: boolean;
    autoFill?: boolean;
}

export type RendererFillMode = 'none' | 'forwards';

export interface RendererEventMap {
    start(startTime: number): void;
    stop(startTime: number, endTime: number): void;
    tick(currentTime: number, startTime: number): void;
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
}

export interface Renderer {
    start(): void;
    stop(): void;
    update(options: Partial<RendererOptions>): void;
    transition(element: OneOrMore<Element<any>>, options?: Partial<RendererTransitionOptions>): Promise<void>;
    on<TEvent extends keyof RendererEventMap>(event: TEvent, handler: RendererEventMap[TEvent]): void;
    off<TEvent extends keyof RendererEventMap>(event: TEvent, handler: RendererEventMap[TEvent]): void;
    get running(): boolean;
    get busy(): boolean;
}

export interface SceneEventMap extends ElementEventMap {
    resize: Event<{
        width: number;
        height: number;
    }>;
    scenemouseenter: Event<MouseEvent>;
    scenemouseleave: Event<MouseEvent>;
    scenemousemove: Event<{
        x: number;
        y: number;
        event: MouseEvent;
    }>;
}

export interface SceneOptions {
    properties?: ElementProperties<BaseElement>;
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