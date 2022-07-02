export type ShapeValueFunction<TValue = number> = (time: number) => TValue;
export type ShapeValueBounds<TValue = number> = [first: TValue, last: TValue];
export type ShapeValueKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
}

export type ShapeValue<TValue = number> = TValue
| ShapeValueBounds<TValue>
| ShapeValueKeyFrame<TValue>[]
| ShapeValueFunction<TValue>;

export interface BaseShape {
    strokeStyle?: string;
    fillStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
    lineDashOffset?: CanvasRenderingContext2D['lineDashOffset'];
    lineCap?: CanvasRenderingContext2D['lineCap'];
    lineJoin?: CanvasRenderingContext2D['lineJoin'];
}

export type ShapeOptions<TShape extends BaseShape> = {
    [P in keyof TShape]: ShapeValue<TShape[P]>;
};

export type ShapeValueFunctions<TShape extends BaseShape> = {
    [P in keyof TShape]: ShapeValueFunction<TShape[P]>;
};

export type ShapeCalculator<TValue> = (valueA: TValue, valueB: TValue) => ShapeValueFunction<TValue>
export type ShapeCalculators<TShape extends BaseShape> = {
    [P in keyof TShape]?: ShapeCalculator<TShape[P]>;
}

export type ShapeRenderFunction<TShape extends BaseShape> = (context: CanvasRenderingContext2D, state: TShape) => void;
export type FrameCallback<TShape extends BaseShape> = (key: keyof TShape, value: TShape[keyof TShape]) => void;
export type ContextRen = {
    [P in keyof BaseShape]?: (context: CanvasRenderingContext2D, value: BaseShape[P]) => void;
}

export type ShapeValidator<TShape extends BaseShape> = (options: ShapeOptions<TShape>) => boolean;
export interface ShapeDefinition<TShape extends BaseShape> {
    name: string;
    autoStroke?: boolean;
    autoFill?: boolean;
    calculators?: ShapeCalculators<TShape>;
    validate?: ShapeValidator<TShape>;
    onRender: ShapeRenderFunction<TShape>;
}

export type Shape<TShape extends BaseShape> = (options: ShapeOptions<TShape>, calculators?: ShapeCalculators<TShape>) => ShapeRenderer<TShape>;
export interface ShapeRenderer<TShape extends BaseShape> {
    id: symbol;
    name: string;
    clone: () => ShapeRenderer<TShape>;
    update: (options: ShapeOptions<TShape>) => void;
    frame: (time: number, callback?: FrameCallback<TShape>) => TShape;
    render: (context: CanvasRenderingContext2D, time?: number, base?: BaseShape) => void;
}