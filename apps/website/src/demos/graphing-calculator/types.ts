import type {
    Point,
} from '@ripl/web';

/**
 * The form a user's input takes, which decides how it is sampled and drawn.
 *
 * - `explicit-y` plots `y = f(x)` by sampling across the visible x range.
 * - `explicit-x` plots `x = f(y)` by sampling across the visible y range.
 * - `polar` plots `r = f(theta)` by sweeping the angle.
 * - `parametric` plots `(f(t), g(t))` by sweeping the parameter.
 * - `implicit` plots `f(x, y) = g(x, y)` as a contour of the difference field.
 * - `surface` plots `z = f(x, y)` as a 3D mesh.
 * - `invalid` carries a parse or validation error instead of geometry.
 */
export type ExpressionKind =
    | 'explicit-y'
    | 'explicit-x'
    | 'polar'
    | 'parametric'
    | 'implicit'
    | 'surface'
    | 'invalid';

/** The variable an expression is swept over, used to pick a sampling strategy and a slider-free symbol set. */
export type PlotVariable = 'x' | 'y' | 'theta' | 't';

/** A raw input line after classification, before it is compiled. */
export interface ClassifiedExpression {
    /** The form the input takes. */
    kind: ExpressionKind;
    /** The expression bodies to compile, in evaluation order: one entry for most kinds, two for `parametric`. */
    bodies: string[];
    /** The variables the bodies are swept over; these never become parameter sliders. */
    variables: PlotVariable[];
    /** The reason the input could not be classified, when {@link ClassifiedExpression.kind} is `invalid`. */
    error?: string;
}

/** A compiled, evaluable expression together with the metadata the renderers need. */
export interface CompiledExpression {
    /** The form the expression takes. */
    kind: ExpressionKind;
    /** The variables the expression is swept over. */
    variables: PlotVariable[];
    /** Free symbols that are neither plot variables nor builtins, surfaced to the user as sliders. */
    params: string[];
    /**
     * Evaluates the expression's primary body against a scope.
     *
     * Always pass a reused `Map`: mathjs wraps a plain object in a fresh adapter on every call,
     * which measured 25 to 92 percent slower depending on expression depth.
     *
     * @param scope - The variable bindings, mutated in place between samples.
     * @returns The value, or `NaN` where the expression is undefined at that point.
     */
    evaluate(scope: Map<string, number>): number;
    /** Evaluates the second body of a `parametric` expression; absent for every other kind. */
    evaluateY?(scope: Map<string, number>): number;
    /** The reason compilation failed, when the expression cannot be evaluated. */
    error?: string;
}

/** One continuous run of a plotted curve. A curve is a list of these so discontinuities are representable. */
export interface SampledBranch {
    /** The points of this run, in screen space, ordered along the curve. */
    points: Point[];
}

/** The visible region of the 2D plot, in data units, together with the pixel size it maps onto. */
export interface Viewport2D {
    /** The left edge of the visible region, in data units. */
    xMin: number;
    /** The right edge of the visible region, in data units. */
    xMax: number;
    /** The bottom edge of the visible region, in data units. */
    yMin: number;
    /** The top edge of the visible region, in data units. */
    yMax: number;
    /** The width of the plot area, in CSS pixels. */
    width: number;
    /** The height of the plot area, in CSS pixels. */
    height: number;
}

/** The square region of the xy plane a 3D surface is evaluated over. */
export interface SurfaceDomain {
    /** The lower bound of the x range, in data units. */
    xMin: number;
    /** The upper bound of the x range, in data units. */
    xMax: number;
    /** The lower bound of the y range, in data units. */
    yMin: number;
    /** The upper bound of the y range, in data units. */
    yMax: number;
}

/** A height field sampled over a {@link SurfaceDomain}, ready to be turned into a mesh. */
export interface SurfaceField {
    /** The number of vertices along each side of the grid. */
    resolution: number;
    /** The region the field was evaluated over. */
    domain: SurfaceDomain;
    /** The heights, row-major, `resolution * resolution` entries; `NaN` where the surface is undefined. */
    values: Float64Array;
    /** The lowest finite height in the field, or `0` when the field is entirely undefined. */
    zMin: number;
    /** The highest finite height in the field, or `0` when the field is entirely undefined. */
    zMax: number;
}

/** One equation in the calculator's list, as the UI holds it. */
export interface GraphExpression {
    /** A stable identity for the row, preserved across edits so colors and sliders do not jump. */
    id: string;
    /** The raw text the user typed. */
    source: string;
    /** The form the input was classified as. */
    kind: ExpressionKind;
    /** The stroke color the curve or surface is drawn in. */
    color: string;
    /** Whether the expression is currently drawn. */
    visible: boolean;
    /** Free symbols this expression contributes to the shared parameter set. */
    params: string[];
    /** The parse or evaluation error to show inline, when the expression cannot be plotted. */
    error?: string;
}

/** A user-adjustable free symbol, surfaced as a slider. */
export interface ParameterState {
    /** The symbol name as it appears in the expressions that use it. */
    name: string;
    /** The current value substituted at evaluation time. */
    value: number;
    /** The lowest value the slider can reach. */
    min: number;
    /** The highest value the slider can reach. */
    max: number;
    /** The slider's increment. */
    step: number;
    /** Whether the value is being animated back and forth over its range. */
    animating: boolean;
}

/** A curated equation set the user can load in one click. */
export interface GraphPreset {
    /** The name shown in the gallery. */
    label: string;
    /** One line on what the equation draws, shown under the label. */
    description: string;
    /** Which mode the preset loads into. */
    mode: '2d' | '3d';
    /** The expression sources to populate the list with. */
    expressions: string[];
    /** Starting values for any free symbols the expressions introduce. */
    params?: Record<string, number>;
    /** The region to frame the preset in; the calculator's default view is used when omitted. */
    viewport?: SurfaceDomain;
}

/** Canvas colors resolved from the site's CSS custom properties, re-read whenever the theme flips. */
export interface GraphTheme {
    /** The plot background. */
    background: string;
    /** The x and y axis lines. */
    axis: string;
    /** Major gridlines, drawn at labelled ticks. */
    gridMajor: string;
    /** Minor gridlines, drawn between labelled ticks. */
    gridMinor: string;
    /** Tick labels and the coordinate readout. */
    label: string;
    /** The backing band drawn behind labels so they stay legible over a curve. */
    labelBacking: string;
    /** The series palette, indexed by the expression's position in the list. */
    series: string[];
}

/** Options for sampling a 2D expression into drawable branches. */
export interface PlotSampleOptions {
    /** The region being drawn, which sets both the sweep range and the screen mapping. */
    viewport: Viewport2D;
    /** Current values for the expression's free symbols. */
    params: Map<string, number>;
    /** The surface's device pixel ratio, used to keep pixel tolerances crisp on retina displays. */
    devicePixelRatio: number;
    /** The hard ceiling on evaluations for this curve; the sampler returns what it has when reached. */
    maxEvaluations?: number;
}

/** Options for evaluating a `surface` expression into a height field. */
export interface SurfaceFieldOptions {
    /** The region of the xy plane to evaluate over. */
    domain: SurfaceDomain;
    /** The number of vertices along each side of the grid. */
    resolution: number;
    /** Current values for the expression's free symbols. */
    params: Map<string, number>;
}

/**
 * Turns a raw input line into a {@link ClassifiedExpression}.
 *
 * Implemented by `math/classify.ts`.
 */
export type ClassifyExpression = (source: string) => ClassifiedExpression;

/**
 * Compiles a classified expression, resolving its free symbols.
 *
 * Implemented by `math/compile.ts`.
 */
export type CompileExpression = (classified: ClassifiedExpression) => CompiledExpression;

/**
 * Samples a 2D expression into the runs it should be stroked as, breaking at every discontinuity.
 *
 * Implemented by `math/sample.ts` for the curve kinds and `math/implicit.ts` for `implicit`.
 */
export type SamplePlot = (expression: CompiledExpression, options: PlotSampleOptions) => SampledBranch[];

/**
 * Evaluates a `surface` expression over a grid.
 *
 * Implemented by `math/surface.ts`.
 */
export type EvaluateSurface = (expression: CompiledExpression, options: SurfaceFieldOptions) => SurfaceField;
