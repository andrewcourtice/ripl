import {
    createEvaluationScope,
} from './compile';

import {
    sampleImplicit,
} from './implicit';

import type {
    CompiledExpression,
    ExpressionKind,
    PlotSampleOptions,
    SampledBranch,
    SamplePlot,
    Viewport2D,
} from '../types';

import type {
    Point,
} from '@ripl/web';

/** The clamp rails a sweep projects into, sitting well outside the plot so curves leave it cleanly. */
interface SweepBounds {
    /** The left rail, in CSS pixels. */
    left: number;
    /** The right rail, in CSS pixels. */
    right: number;
    /** The top rail, in CSS pixels. */
    top: number;
    /** The bottom rail, in CSS pixels. */
    bottom: number;
}

/** One sweep of a curve: a range of parameter values and the projection of each into screen space. */
interface SweepPlan {
    /** The first parameter value. */
    from: number;
    /** The last parameter value. */
    to: number;
    /** The number of evenly spaced seed intervals across the range. */
    seeds: number;
    /**
     * Projects one parameter value into screen space.
     *
     * @param value - The parameter value.
     * @param out - The two-element scratch the screen point is written into.
     * @returns Whether the curve is defined at that value.
     */
    project(value: number, out: Float64Array): boolean;
}

/** The tolerances and budget one sweep runs against. */
interface SweepLimits {
    /** The clamp rails. */
    bounds: SweepBounds;
    /** The chord deviation, in CSS pixels, below which an interval is considered resolved. */
    tolerance: number;
    /** The chord length, in CSS pixels, below which an interval is no longer worth subdividing. */
    minInterval: number;
    /** The hard ceiling on evaluations for this curve. */
    maxEvaluations: number;
}

/** The spacing, in CSS pixels, between the initial seed points of an explicit sweep. */
export const SEED_SPACING_PX = 2;

/** The evaluation ceiling used when {@link PlotSampleOptions.maxEvaluations} is not given. */
export const DEFAULT_MAX_EVALUATIONS = 4000;

/** The first value of the sweep for `polar` and `parametric` expressions. */
export const ANGLE_SWEEP_MIN = 0;

/** The last value of the sweep for `polar` and `parametric` expressions. */
export const ANGLE_SWEEP_MAX = 2 * Math.PI;

const CHORD_TOLERANCE_PX = 0.35;
const MIN_INTERVAL_PX = 0.4;
const JUMP_THRESHOLD_PX = 24;
const POLE_MARGIN_FACTOR = 4;
const MAX_SUBDIVISION_DEPTH = 12;
const DOMAIN_EDGE_BISECTIONS = 20;
const TIME_CHECK_INTERVAL = 256;
const TIME_BUDGET_MS = 50;
const ANGLE_SEED_COUNT = 240;
const MIN_EVALUATIONS = 64;

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function deviation(ax: number, ay: number, mx: number, my: number, bx: number, by: number): number {
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy);

    if (length < 1e-9) {
        return Math.hypot(mx - ax, my - ay);
    }

    return Math.abs(dy * (mx - ax) - dx * (my - ay)) / length;
}

function createBounds(viewport: Viewport2D): SweepBounds {
    const marginX = POLE_MARGIN_FACTOR * viewport.width;
    const marginY = POLE_MARGIN_FACTOR * viewport.height;

    return {
        left: -marginX,
        right: viewport.width + marginX,
        top: -marginY,
        bottom: viewport.height + marginY,
    };
}

function createLimits(options: PlotSampleOptions): SweepLimits {
    const dpr = Math.max(1, options.devicePixelRatio || 1);

    return {
        bounds: createBounds(options.viewport),
        tolerance: CHORD_TOLERANCE_PX / dpr,
        minInterval: MIN_INTERVAL_PX / dpr,
        maxEvaluations: Math.max(MIN_EVALUATIONS, options.maxEvaluations ?? DEFAULT_MAX_EVALUATIONS),
    };
}

function countSeeds(pixels: number, maxEvaluations: number): number {
    const seeds = Math.ceil(pixels / SEED_SPACING_PX);

    return Math.max(2, Math.min(seeds, Math.floor(maxEvaluations / 2)));
}

function countAngleSeeds(maxEvaluations: number): number {
    return Math.max(2, Math.min(ANGLE_SEED_COUNT, Math.floor(maxEvaluations / 2)));
}

function runSweep(plan: SweepPlan, limits: SweepLimits): SampledBranch[] {
    const branches: SampledBranch[] = [];
    const point = new Float64Array(2);
    const step = (plan.to - plan.from) / plan.seeds;
    const deadline = performance.now() + TIME_BUDGET_MS;

    let current: Point[] = [];
    let evaluations = 0;
    let exhausted = false;

    function measure(value: number): boolean {
        evaluations++;

        if (evaluations >= limits.maxEvaluations) {
            exhausted = true;
        }

        if (evaluations % TIME_CHECK_INTERVAL === 0 && performance.now() > deadline) {
            exhausted = true;
        }

        return plan.project(value, point);
    }

    function emit(px: number, py: number): void {
        current.push([px, py]);
    }

    function breakBranch(): void {
        if (current.length > 1) {
            branches.push({ points: current });
        }

        current = [];
    }

    function resolveLeaf(bx: number, by: number, chord: number): void {
        // A blowup is clamped to rails four plot heights out, so a pole arrives here as a long chord.
        if (chord >= JUMP_THRESHOLD_PX) {
            breakBranch();
        }

        emit(bx, by);
    }

    function refine(ua: number, ax: number, ay: number, ub: number, bx: number, by: number, depth: number): void {
        if (exhausted) {
            emit(bx, by);
            return;
        }

        const chord = Math.hypot(bx - ax, by - ay);

        if (depth >= MAX_SUBDIVISION_DEPTH || chord <= limits.minInterval) {
            resolveLeaf(bx, by, chord);
            return;
        }

        const um = (ua + ub) / 2;

        if (!measure(um)) {
            closeAtEdge(ua, ax, ay, um);
            openFromEdge(um, ub, bx, by);
            return;
        }

        const mx = point[0];
        const my = point[1];

        // The chord test is not redundant: deviation vanishes on a near-vertical chord, so a step or
        // a pole would otherwise read as resolved and be stroked straight through.
        if (chord < JUMP_THRESHOLD_PX && deviation(ax, ay, mx, my, bx, by) <= limits.tolerance) {
            emit(bx, by);
            return;
        }

        refine(ua, ax, ay, um, mx, my, depth + 1);
        refine(um, mx, my, ub, bx, by, depth + 1);
    }

    function closeAtEdge(ua: number, ax: number, ay: number, ub: number): void {
        let lo = ua;
        let hi = ub;
        let ex = ax;
        let ey = ay;

        for (let i = 0; i < DOMAIN_EDGE_BISECTIONS; i++) {
            const um = (lo + hi) / 2;

            if (!measure(um)) {
                hi = um;
                continue;
            }

            lo = um;
            ex = point[0];
            ey = point[1];
        }

        if (lo > ua) {
            refine(ua, ax, ay, lo, ex, ey, 0);
        }

        breakBranch();
    }

    function openFromEdge(ua: number, ub: number, bx: number, by: number): void {
        breakBranch();

        let lo = ua;
        let hi = ub;
        let ex = bx;
        let ey = by;

        for (let i = 0; i < DOMAIN_EDGE_BISECTIONS; i++) {
            const um = (lo + hi) / 2;

            if (!measure(um)) {
                lo = um;
                continue;
            }

            hi = um;
            ex = point[0];
            ey = point[1];
        }

        emit(ex, ey);

        if (hi < ub) {
            refine(hi, ex, ey, ub, bx, by, 0);
        }
    }

    function advance(ua: number, ub: number, finiteA: boolean, ax: number, ay: number, finiteB: boolean, bx: number, by: number): void {
        if (finiteA && finiteB) {
            refine(ua, ax, ay, ub, bx, by, 0);
            return;
        }

        if (finiteA) {
            closeAtEdge(ua, ax, ay, ub);
            return;
        }

        if (finiteB) {
            openFromEdge(ua, ub, bx, by);
            return;
        }

        breakBranch();
    }

    let prevValue = plan.from;
    let prevFinite = measure(prevValue);
    let prevX = point[0];
    let prevY = point[1];

    if (prevFinite) {
        emit(prevX, prevY);
    }

    for (let i = 1; i <= plan.seeds && !exhausted; i++) {
        const value = plan.from + i * step;
        const finite = measure(value);
        const px = point[0];
        const py = point[1];

        advance(prevValue, value, prevFinite, prevX, prevY, finite, px, py);

        prevValue = value;
        prevFinite = finite;
        prevX = px;
        prevY = py;
    }

    breakBranch();

    return branches;
}

function sampleExplicitY(expression: CompiledExpression, options: PlotSampleOptions): SampledBranch[] {
    const { viewport } = options;
    const limits = createLimits(options);
    const scope = createEvaluationScope(expression, options.params);
    const scaleX = viewport.width / (viewport.xMax - viewport.xMin);
    const scaleY = viewport.height / (viewport.yMax - viewport.yMin);

    return runSweep({
        from: viewport.xMin,
        to: viewport.xMax,
        seeds: countSeeds(viewport.width, limits.maxEvaluations),
        project(value, out) {
            scope.set('x', value);

            const y = expression.evaluate(scope);

            if (!Number.isFinite(y)) {
                return false;
            }

            out[0] = (value - viewport.xMin) * scaleX;
            out[1] = clamp((viewport.yMax - y) * scaleY, limits.bounds.top, limits.bounds.bottom);

            return true;
        },
    }, limits);
}

function sampleExplicitX(expression: CompiledExpression, options: PlotSampleOptions): SampledBranch[] {
    const { viewport } = options;
    const limits = createLimits(options);
    const scope = createEvaluationScope(expression, options.params);
    const scaleX = viewport.width / (viewport.xMax - viewport.xMin);
    const scaleY = viewport.height / (viewport.yMax - viewport.yMin);

    return runSweep({
        from: viewport.yMin,
        to: viewport.yMax,
        seeds: countSeeds(viewport.height, limits.maxEvaluations),
        project(value, out) {
            scope.set('y', value);

            const x = expression.evaluate(scope);

            if (!Number.isFinite(x)) {
                return false;
            }

            out[0] = clamp((x - viewport.xMin) * scaleX, limits.bounds.left, limits.bounds.right);
            out[1] = (viewport.yMax - value) * scaleY;

            return true;
        },
    }, limits);
}

function samplePolar(expression: CompiledExpression, options: PlotSampleOptions): SampledBranch[] {
    const { viewport } = options;
    const limits = createLimits(options);
    const scope = createEvaluationScope(expression, options.params);
    const scaleX = viewport.width / (viewport.xMax - viewport.xMin);
    const scaleY = viewport.height / (viewport.yMax - viewport.yMin);

    return runSweep({
        from: ANGLE_SWEEP_MIN,
        to: ANGLE_SWEEP_MAX,
        seeds: countAngleSeeds(limits.maxEvaluations),
        project(value, out) {
            scope.set('theta', value);

            const radius = expression.evaluate(scope);

            if (!Number.isFinite(radius)) {
                return false;
            }

            out[0] = clamp((radius * Math.cos(value) - viewport.xMin) * scaleX, limits.bounds.left, limits.bounds.right);
            out[1] = clamp((viewport.yMax - radius * Math.sin(value)) * scaleY, limits.bounds.top, limits.bounds.bottom);

            return true;
        },
    }, limits);
}

function sampleParametric(expression: CompiledExpression, options: PlotSampleOptions): SampledBranch[] {
    const { evaluateY } = expression;

    if (!evaluateY) {
        return [];
    }

    const { viewport } = options;
    const limits = createLimits(options);
    const scope = createEvaluationScope(expression, options.params);
    const scaleX = viewport.width / (viewport.xMax - viewport.xMin);
    const scaleY = viewport.height / (viewport.yMax - viewport.yMin);

    return runSweep({
        from: ANGLE_SWEEP_MIN,
        to: ANGLE_SWEEP_MAX,
        seeds: countAngleSeeds(limits.maxEvaluations),
        project(value, out) {
            scope.set('t', value);

            const x = expression.evaluate(scope);
            const y = evaluateY(scope);

            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return false;
            }

            out[0] = clamp((x - viewport.xMin) * scaleX, limits.bounds.left, limits.bounds.right);
            out[1] = clamp((viewport.yMax - y) * scaleY, limits.bounds.top, limits.bounds.bottom);

            return true;
        },
    }, limits);
}

const SAMPLERS: Record<ExpressionKind, SamplePlot | null> = {
    'explicit-y': sampleExplicitY,
    'explicit-x': sampleExplicitX,
    'polar': samplePolar,
    'parametric': sampleParametric,
    'implicit': sampleImplicit,
    'surface': null,
    'invalid': null,
};

/**
 * Samples a 2D expression into the runs it should be stroked as, breaking at every discontinuity.
 *
 * Sampling is adaptive and every threshold lives in screen space, which is what makes it
 * zoom-invariant; pixel tolerances are divided by the device pixel ratio because canvas coordinates
 * are CSS logical pixels. An interval that will not resolve is classified rather than drawn: a
 * domain edge is bisected and the curve ends there, a blowup past the clamp rails breaks the run,
 * and a jump of at least 24 pixels across a sub-pixel step breaks it too. Anything else is merely
 * steep and is emitted as-is.
 *
 * @param expression - The compiled expression.
 * @param options - The viewport, parameter values and evaluation budget.
 * @returns One {@link SampledBranch} per continuous run, in screen space, possibly empty.
 * @example
 * ```typescript
 * const branches = samplePlot(compiled, {
 *     viewport,
 *     params: new Map([['a', 2]]),
 *     devicePixelRatio: window.devicePixelRatio,
 * });
 * ```
 */
export function samplePlot(expression: CompiledExpression, options: PlotSampleOptions): SampledBranch[] {
    const { viewport } = options;

    if (expression.error || viewport.width <= 0 || viewport.height <= 0) {
        return [];
    }

    if (viewport.xMax <= viewport.xMin || viewport.yMax <= viewport.yMin) {
        return [];
    }

    const sampler = SAMPLERS[expression.kind];

    return sampler ? sampler(expression, options) : [];
}
