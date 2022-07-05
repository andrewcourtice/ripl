export type ElementValueFunction<TValue = number> = (time: number) => TValue;
export type ElementValueBounds<TValue = number> = [first: TValue, last: TValue];
export type ElementValueKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
}

export type ElementValue<TValue = number> = TValue
| ElementValueBounds<TValue>
| ElementValueKeyFrame<TValue>[]
| ElementValueFunction<TValue>;

export interface BaseElement {
    strokeStyle?: string;
    fillStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
    lineDashOffset?: CanvasRenderingContext2D['lineDashOffset'];
    lineCap?: CanvasRenderingContext2D['lineCap'];
    lineJoin?: CanvasRenderingContext2D['lineJoin'];
    font?: CanvasRenderingContext2D['font'];
    filter?: CanvasRenderingContext2D['filter'];
}

export type ElementProperties<TElement extends BaseElement> = {
    [P in keyof TElement]: ElementValue<TElement[P]>;
};

export type ElementValueFunctions<TElement extends BaseElement> = {
    [P in keyof TElement]: ElementValueFunction<TElement[P]>;
};

export type ElementCalculator<TValue> = (valueA: TValue, valueB: TValue) => ElementValueFunction<TValue>
export type ElementCalculators<TElement extends BaseElement> = {
    [P in keyof TElement]?: ElementCalculator<TElement[P]>;
}

export type ElementRenderFunction<TElement extends BaseElement, TData extends ElementRenderData> = (context: CanvasRenderingContext2D, frame: ElementRenderFrame<TElement, TData>) => void;
export type ShapeRenderFunction<TElement extends BaseElement, TData extends ElementRenderData> = (context: CanvasRenderingContext2D, path: Path2D, frame: ElementRenderFrame<TElement, TData>) => void;
export type FrameCallback<TElement extends BaseElement> = (key: keyof TElement, value: TElement[keyof TElement]) => void;

export type BaseCalculators = {
    [P in keyof BaseElement]?: (context: CanvasRenderingContext2D, value: BaseElement[P]) => void;
}

export type ElementValidator<TElement extends BaseElement> = (properties: ElementProperties<TElement>) => boolean;

export interface ElementDefinition<TElement extends BaseElement, TData extends ElementRenderData> {
    name: string;
    calculators?: ElementCalculators<TElement>;
    validate?: ElementValidator<TElement>;
    onRender: ElementRenderFunction<TElement, TData>;
}

export interface ShapeDefinition<TElement extends BaseElement, TData extends ElementRenderData> extends Omit<ElementDefinition<TElement, TData>, 'onRender'> {
    autoStroke?: boolean;
    autoFill?: boolean;
    onRender: ShapeRenderFunction<TElement, TData>;
}

export interface ElementOptions<TElement extends BaseElement> {
    calculators?: ElementCalculators<TElement>;
}

export type ElementConstructor<TElement extends BaseElement, TData extends ElementRenderData> = (properties: ElementProperties<TElement>, options?: ElementOptions<TElement>) => Element<TElement, TData>;
export type ShapeConstructor<TElement extends BaseElement, TData extends ElementRenderData> = (properties: ElementProperties<TElement>, options?: ElementOptions<TElement>) => Shape<TElement, TData>;

export interface ElementRenderFrame<TElement extends BaseElement, TData extends ElementRenderData> {
    state: TElement;
    time: number;
    data?: TData;
}

export interface ElementRenderData {
    [key: PropertyKey]: unknown;
    base?: BaseElement;
}

export interface Element<TElement extends BaseElement, TData extends ElementRenderData> {
    id: symbol;
    name: string;
    clone: () => Element<TElement, TData>;
    update: (properties: Partial<ElementProperties<TElement>>) => void;
    frame: (time: number, callback?: FrameCallback<TElement>) => TElement;
    to: (newState: Partial<TElement>) => void;
    render: (context: CanvasRenderingContext2D, time?: number, data?: TData) => void;
    //blend: (refElement: Element<TElement>, srcFrames?: number[], destFrames?: number[]) => Element<TElement, TData>;
}

export interface Shape<TElement extends BaseElement, TData extends ElementRenderData> extends Element<TElement, TData> {
    clone: () => Shape<TElement, TData>;
}

export interface Group extends Element<any, any> {
    add: (element: Element<any, any>) => void;
    delete: (element: Element<any, any>) => void;
}

export interface Scene {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    elements: Element<any, any>[];
    render: (time?: number) => void;
    add: (element: Element<any, any> | Element<any, any>[]) => void;
    //remove: (element: Element<any, any> | Element<any, any>[]) => void;
}