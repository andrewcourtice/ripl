import {
    formatCoordinate,
    generatePiTicks,
    generateTicks,
} from './ticks';

import type {
    TickSet,
} from './ticks';

import type {
    CompiledExpression,
    GraphTheme,
    SampledBranch,
    SamplePlot,
    Viewport2D,
} from '../types';

import {
    createCircle,
    createGroup,
    createLine,
    createNavigator,
    createPath,
    createRect,
    createRenderer,
    createScene,
    createText,
    factory,
    rescaleDomain,
    scaleContinuous,
    typeIsContext,
} from '@ripl/web';

import type {
    Context,
    ContextPath,
    DOMNavigator,
    NavigatorTransform,
    Path,
    Renderer,
    Scene,
    Text,
    TextBaseline,
} from '@ripl/web';

import {
    numberClamp,
    numberNextPowerOfN,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

/** One expression the graph draws, paired with the stroke it is drawn in. */
export interface Graph2DSeries {
    /** A stable identity for the curve, preserved across updates so its sample buffers are reused. */
    id: string;
    /** The compiled expression sampled into the curve. */
    expression: CompiledExpression;
    /** The stroke color the curve is drawn in. */
    color: string;
    /** Whether the curve is currently drawn. */
    visible: boolean;
}

/** Options for {@link createGraph2D}. */
export interface Graph2DOptions {
    /**
     * Samples an expression into the runs it should be stroked as.
     *
     * Injected rather than imported so the renderer carries no dependency on the expression engine
     * and can be driven from a test with a hand-written sampler.
     */
    sample: SamplePlot;
    /** The canvas colors to draw with; re-resolve and pass to {@link Graph2D.setTheme} when the site theme flips. */
    theme: GraphTheme;
    /** Half the height of the initial view, in data units. Defaults to `10`. */
    extent?: number;
    /** The ceiling on evaluations per curve per re-sample, passed through to the sampler. */
    maxEvaluations?: number;
    /** The approximate number of labelled gridlines across the x axis. Defaults to `10`. */
    tickCount?: number;
    /** Whether x ticks fall on multiples of pi, which suits a trig-heavy view. Defaults to `false`. */
    piTicks?: boolean;
    /** The width, in pixels, curves are stroked at. Defaults to `2`. */
    lineWidth?: number;
}

/** Preallocated screen-space samples for one curve, walked by its path renderer every frame. */
interface CurveBuffer {
    xs: Float32Array;
    ys: Float32Array;
    breaks: Uint8Array;
    count: number;
}

interface CurveState {
    series: Graph2DSeries;
    buffer: CurveBuffer;
    element: Path;
}

const ASPECT_TOLERANCE = 1e-6;
const AXIS_LINE_WIDTH = 1.25;
const BAND_INSET = 4;
const COORDINATE_LIMIT = 1e6;
const DEFAULT_EXTENT = 10;
const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_TICK_COUNT = 10;
const GRID_LINE_WIDTH = 1;
const GLYPH_WIDTH = 6.6;
const INITIAL_SAMPLES = 1024;
const LABEL_BAND_SIZE = 18;
const LABEL_FONT = '12px ui-sans-serif, system-ui, sans-serif';
const LABEL_GAP = 6;
const LABEL_POOL_SIZE = 32;
const MARKER_RADIUS = 4;
const SCALE_EXTENT: [number, number] = [1e-7, 1e7];
const TRACE_PADDING = 5;
const TRACE_THRESHOLD = 24;
const ZOOM_FLOOR = 1e-12;

/** Walks a curve's sample buffer, breaking the stroke at every discontinuity the sampler marked. */
function renderCurveBuffer(path: ContextPath, buffer: CurveBuffer): void {
    const {
        xs,
        ys,
        breaks,
        count,
    } = buffer;

    for (let i = 0; i < count; i++) {
        if (breaks[i]) {
            path.moveTo(xs[i], ys[i]);
            continue;
        }

        path.lineTo(xs[i], ys[i]);
    }
}

function growCurveBuffer(buffer: CurveBuffer, size: number): void {
    if (buffer.xs.length >= size) {
        return;
    }

    const capacity = numberNextPowerOfN(size);

    buffer.xs = new Float32Array(capacity);
    buffer.ys = new Float32Array(capacity);
    buffer.breaks = new Uint8Array(capacity);
}

function fillCurveBuffer(buffer: CurveBuffer, branches: SampledBranch[]): void {
    let total = 0;

    for (let i = 0; i < branches.length; i++) {
        total += branches[i].points.length;
    }

    growCurveBuffer(buffer, total);

    const {
        xs,
        ys,
        breaks,
    } = buffer;

    let index = 0;

    for (let i = 0; i < branches.length; i++) {
        const points = branches[i].points;

        let starting = true;

        for (let j = 0; j < points.length; j++) {
            const x = points[j][0];
            const y = points[j][1];

            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                starting = true;
                continue;
            }

            xs[index] = numberClamp(x, -COORDINATE_LIMIT, COORDINATE_LIMIT);
            ys[index] = numberClamp(y, -COORDINATE_LIMIT, COORDINATE_LIMIT);
            breaks[index] = starting ? 1 : 0;
            starting = false;
            index++;
        }
    }

    buffer.count = index;
}

function createLabelPool(): Text[] {
    const labels: Text[] = [];

    for (let i = 0; i < LABEL_POOL_SIZE; i++) {
        labels.push(createText({
            x: 0,
            y: 0,
            content: '',
            opacity: 0,
        }));
    }

    return labels;
}

/** Estimated, not measured: these back a label band, and a metrics call per label per frame is not worth the pixel. */
function estimateTextWidth(value: string): number {
    return value.length * GLYPH_WIDTH;
}

function widestLabel(labels: string[], limit: number): number {
    let widest = 0;

    for (let i = 0; i < labels.length && i < limit; i++) {
        widest = Math.max(widest, estimateTextWidth(labels[i]));
    }

    return widest;
}

/**
 * A pannable, zoomable cartesian plot that owns its own scene, renderer and navigator.
 *
 * Knows nothing about the expression engine or the UI framework around it: expressions arrive
 * pre-compiled through {@link Graph2D.setExpressions}, sampling is the injected
 * {@link Graph2DOptions.sample}, and colors arrive resolved through {@link Graph2D.setTheme}.
 */
export class Graph2D {

    private readonly _scene: Scene;
    private readonly _renderer: Renderer;
    private readonly _navigator: DOMNavigator;
    private readonly _sample: SamplePlot;
    private readonly _extent: number;
    private readonly _lineWidth: number;
    private readonly _maxEvaluations?: number;
    private readonly _tickCount: number;
    private readonly _ownsContext: boolean;
    private readonly _disposables: Disposable[] = [];
    private readonly _curves = new Map<string, CurveState>();

    private _theme: GraphTheme;
    private _piTicks: boolean;

    private _width = 0;
    private _height = 0;
    private _unitsPerPixel = 1;

    private _xBase = scaleContinuous([0, 1], [0, 1]);
    private _yBase = scaleContinuous([0, 1], [1, 0]);
    private _xScale = scaleContinuous([0, 1], [0, 1]);
    private _yScale = scaleContinuous([0, 1], [1, 0]);

    private _xMin = 0;
    private _xMax = 0;
    private _yMin = 0;
    private _yMax = 0;

    private _xTicks: TickSet = generateTicks(0, 0);
    private _yTicks: TickSet = generateTicks(0, 0);

    private _viewDirty = true;
    private _lastTransform: NavigatorTransform = {
        k: 1,
        x: 0,
        y: 0,
    };

    private _params = new Map<string, number>();
    private _scope = new Map<string, number>();

    private _pointerX = -1;
    private _pointerY = -1;
    private _candidateX = 0;
    private _candidateY = 0;

    private readonly _background = createRect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zIndex: 0,
    });

    private readonly _minorGrid = createPath({
        cachePath: false,
        lineWidth: GRID_LINE_WIDTH,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zIndex: 0,
        pathRenderer: path => this._renderGrid(path, this._xTicks.minorValues, this._yTicks.minorValues),
    });

    private readonly _majorGrid = createPath({
        cachePath: false,
        lineWidth: GRID_LINE_WIDTH,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zIndex: 1,
        pathRenderer: path => this._renderGrid(path, this._xTicks.values, this._yTicks.values),
    });

    private readonly _xAxis = createLine({
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        lineWidth: AXIS_LINE_WIDTH,
        zIndex: 2,
    });

    private readonly _yAxis = createLine({
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        lineWidth: AXIS_LINE_WIDTH,
        zIndex: 2,
    });

    private readonly _xBand = createRect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        opacity: 0,
    });

    private readonly _yBand = createRect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        opacity: 0,
    });

    private readonly _xLabels = createLabelPool();
    private readonly _yLabels = createLabelPool();

    private readonly _clipRect = createRect({
        clip: true,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zIndex: -1,
    });

    // The clip shape renders with `skipRestore`, so it needs its own group for `popGroup` to unwind it.
    private readonly _curveGroup = createGroup({
        zIndex: 20,
        children: this._clipRect,
    });

    private readonly _traceMarker = createCircle({
        cx: 0,
        cy: 0,
        radius: MARKER_RADIUS,
    });

    private readonly _traceBacking = createRect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    private readonly _traceLabel = createText({
        x: 0,
        y: 0,
        content: '',
        textAlign: 'left',
        textBaseline: 'middle',
    });

    private readonly _traceGroup = createGroup({
        zIndex: 30,
        opacity: 0,
        font: LABEL_FONT,
        children: [
            this._traceBacking,
            this._traceMarker,
            this._traceLabel,
        ],
    });

    /** The rendering context the graph draws to. */
    public get context(): Context {
        return this._scene.context;
    }

    /** The scene holding the axes, gridlines, labels and curves. */
    public get scene(): Scene {
        return this._scene;
    }

    /** The renderer driving the graph's frame loop. */
    public get renderer(): Renderer {
        return this._renderer;
    }

    /** The pan/zoom controller bound to the graph's surface. */
    public get navigator(): DOMNavigator {
        return this._navigator;
    }

    constructor(target: Context | string | HTMLElement, options: Graph2DOptions) {
        this._sample = options.sample;
        this._theme = options.theme;
        this._extent = options.extent ?? DEFAULT_EXTENT;
        this._lineWidth = options.lineWidth ?? DEFAULT_LINE_WIDTH;
        this._maxEvaluations = options.maxEvaluations;
        this._tickCount = options.tickCount ?? DEFAULT_TICK_COUNT;
        this._piTicks = options.piTicks ?? false;
        this._ownsContext = !typeIsContext(target);

        this._scene = createScene(target);
        this._width = this._scene.context.width;
        this._height = this._scene.context.height;

        this._scene.add([
            this._background,
            createGroup({
                zIndex: 10,
                children: [
                    this._minorGrid,
                    this._majorGrid,
                    this._xAxis,
                    this._yAxis,
                ],
            }),
            createGroup({
                zIndex: 15,
                font: LABEL_FONT,
                children: [
                    this._xBand,
                    this._yBand,
                    ...this._xLabels,
                    ...this._yLabels,
                ],
            }),
            this._curveGroup,
            this._traceGroup,
        ]);

        this._navigator = createNavigator(this._scene.context, {
            interactions: {
                pan: true,
                zoom: true,
            },
            // The default extent spans only six decades, which a calculator runs out of immediately.
            scaleExtent: SCALE_EXTENT,
        });

        this._renderer = createRenderer(this._scene, {
            autoStart: true,
            autoStop: false,
        });

        this._rebuildBase(0, 0, this._defaultUnitsPerPixel());
        this._syncSurface();
        this.setTheme(this._theme);
        this._attachListeners();
        this._updateView();
    }

    private _attachListeners(): void {
        const context = this._scene.context;

        // Sampling here would run at wheel rate; the tick coalesces a gesture into one pass per frame.
        this._disposables.push(this._navigator.on('change', () => this._viewDirty = true));
        this._disposables.push(this._renderer.on('tick', () => this._onTick()));
        this._disposables.push(context.on('resize', () => this._onResize()));
        this._disposables.push(context.on('mouseleave', () => {
            this._pointerX = -1;
            this._updateTrace();
        }));

        this._disposables.push(context.on('mousemove', event => {
            this._pointerX = event.data.x;
            this._pointerY = event.data.y;
            this._updateTrace();
        }));
    }

    private _onTick(): void {
        if (!this._viewDirty) {
            return;
        }

        this._viewDirty = false;
        this._updateView();
        this._resampleCurves();
        this._updateTrace();
    }

    private _onResize(): void {
        const context = this._scene.context;
        // Read the live scale before the base moves, or the view jumps to the mount-time zoom.
        const unitsPerPixel = this._width > 0 && this._xMax > this._xMin
            ? (this._xMax - this._xMin) / this._width
            : 0;

        const centerX = (this._xMin + this._xMax) / 2;
        const centerY = (this._yMin + this._yMax) / 2;

        this._width = context.width;
        this._height = context.height;
        this._syncSurface();
        this._reframe(centerX, centerY, unitsPerPixel || this._defaultUnitsPerPixel());
    }

    private _defaultUnitsPerPixel(): number {
        return 2 * this._extent / Math.max(1, this._height);
    }

    /** Rebuilds the base scales and returns the transform to the identity against them. */
    private _reframe(centerX: number, centerY: number, unitsPerPixel: number): void {
        this._rebuildBase(centerX, centerY, unitsPerPixel);
        this._navigator.reset();
        this._lastTransform = this._navigator.transform;
        this._viewDirty = true;
    }

    /**
     * Rebuilds the immutable base scales the navigator transform is applied against. Only mount,
     * resize and reset may call this: rebuilding it from the derived domain composes the transform
     * twice and the view accelerates away exponentially.
     */
    private _rebuildBase(centerX: number, centerY: number, unitsPerPixel: number): void {
        const halfWidth = unitsPerPixel * this._width / 2;
        const halfHeight = unitsPerPixel * this._height / 2;

        this._unitsPerPixel = unitsPerPixel;
        this._xBase = scaleContinuous([centerX - halfWidth, centerX + halfWidth], [0, this._width]);
        this._yBase = scaleContinuous([centerY - halfHeight, centerY + halfHeight], [this._height, 0]);
    }

    private _syncSurface(): void {
        const width = this._width;
        const height = this._height;

        this._background.width = width;
        this._background.height = height;
        this._clipRect.width = width;
        this._clipRect.height = height;
        this._minorGrid.width = width;
        this._minorGrid.height = height;
        this._majorGrid.width = width;
        this._majorGrid.height = height;

        this._curves.forEach(state => {
            state.element.width = width;
            state.element.height = height;
        });
    }

    private _isRenderableWindow(min: number, max: number): boolean {
        const extent = max - min;
        const center = Math.abs(min + max) / 2;

        // Below the float64 floor the ticks jitter and labels flicker between adjacent doubles.
        return Number.isFinite(extent) && extent > Math.max(center, 1) * ZOOM_FLOOR;
    }

    private _assertSquareAspect(): void {
        if (!this._width || !this._height) {
            return;
        }

        const xPerPixel = (this._xMax - this._xMin) / this._width;
        const yPerPixel = (this._yMax - this._yMin) / this._height;

        if (Math.abs(xPerPixel - yPerPixel) > Math.abs(xPerPixel) * ASPECT_TOLERANCE) {
            console.warn('Graph2D: the x and y scales have diverged; the plot is no longer square.');
        }
    }

    private _updateView(): void {
        if (this._width <= 0 || this._height <= 0) {
            return;
        }

        const transform = this._navigator.transform;
        const xRange = this._xBase.range as [number, number];
        const yRange = this._yBase.range as [number, number];

        const [
            xMin,
            xMax,
        ] = rescaleDomain(this._xBase, transform, xRange);

        // The y range descends, so the first entry is the bottom edge of the window, not the top.
        const [
            yMin,
            yMax,
        ] = rescaleDomain(this._yBase, {
            k: transform.k,
            x: transform.y,
            y: 0,
        }, yRange);

        if (!this._isRenderableWindow(xMin, xMax) || !this._isRenderableWindow(yMin, yMax)) {
            if (transform.k !== this._lastTransform.k) {
                this._navigator.setTransform(this._lastTransform);
            }

            return;
        }

        this._lastTransform = transform;
        this._xMin = xMin;
        this._xMax = xMax;
        this._yMin = yMin;
        this._yMax = yMax;
        this._xScale = scaleContinuous([xMin, xMax], [0, this._width]);
        this._yScale = scaleContinuous([yMin, yMax], [this._height, 0]);

        this._assertSquareAspect();
        this._updateTicks();
        this._updateAxes();
    }

    private _updateTicks(): void {
        const xCount = this._tickCount;
        // Matching the y count to the aspect keeps one step shared by both axes, so the grid stays square.
        const yCount = Math.max(2, Math.round(xCount * this._height / Math.max(1, this._width)));

        this._xTicks = this._piTicks
            ? generatePiTicks(this._xMin, this._xMax, xCount)
            : generateTicks(this._xMin, this._xMax, xCount);

        this._yTicks = generateTicks(this._yMin, this._yMax, yCount);
    }

    private _renderGrid(path: ContextPath, xValues: number[], yValues: number[]): void {
        const width = this._width;
        const height = this._height;

        for (let i = 0; i < xValues.length; i++) {
            // The half-pixel offset keeps a one-pixel stroke from smearing across two device rows.
            const px = Math.round(this._xScale(xValues[i])) + 0.5;

            path.moveTo(px, 0);
            path.lineTo(px, height);
        }

        for (let i = 0; i < yValues.length; i++) {
            const py = Math.round(this._yScale(yValues[i])) + 0.5;

            path.moveTo(0, py);
            path.lineTo(width, py);
        }
    }

    private _updateAxes(): void {
        const rawY = this._yScale(0);
        const rawX = this._xScale(0);
        const axisY = numberClamp(rawY, AXIS_LINE_WIDTH, this._height - AXIS_LINE_WIDTH);
        const axisX = numberClamp(rawX, AXIS_LINE_WIDTH, this._width - AXIS_LINE_WIDTH);

        this._xAxis.x1 = 0;
        this._xAxis.y1 = axisY;
        this._xAxis.x2 = this._width;
        this._xAxis.y2 = axisY;

        this._yAxis.x1 = axisX;
        this._yAxis.y1 = 0;
        this._yAxis.x2 = axisX;
        this._yAxis.y2 = this._height;

        this._updateXLabels(axisY, rawY !== axisY, rawX === axisX);
        this._updateYLabels(axisX, rawX !== axisX);
    }

    private _updateXLabels(axisY: number, clamped: boolean, skipOrigin: boolean): void {
        const flipped = axisY > this._height - LABEL_BAND_SIZE - LABEL_GAP;
        const anchor = flipped ? axisY - LABEL_GAP : axisY + LABEL_GAP;
        const baseline: TextBaseline = flipped ? 'bottom' : 'top';
        const {
            values,
            labels,
        } = this._xTicks;

        let slot = 0;

        for (let i = 0; i < values.length && slot < LABEL_POOL_SIZE; i++) {
            // The y axis already carries the origin's label, so drawing it twice just overlaps it.
            if (values[i] === 0 && skipOrigin) {
                continue;
            }

            const label = this._xLabels[slot++];

            label.content = labels[i];
            label.x = this._xScale(values[i]);
            label.y = anchor;
            label.textAlign = 'center';
            label.textBaseline = baseline;
            label.opacity = 1;
        }

        for (let i = slot; i < LABEL_POOL_SIZE; i++) {
            this._xLabels[i].opacity = 0;
        }

        this._xBand.x = 0;
        this._xBand.width = this._width;
        this._xBand.height = LABEL_BAND_SIZE;
        this._xBand.y = flipped ? anchor - LABEL_BAND_SIZE + BAND_INSET : anchor - BAND_INSET;
        this._xBand.opacity = clamped ? 1 : 0;
    }

    private _updateYLabels(axisX: number, clamped: boolean): void {
        const {
            values,
            labels,
        } = this._yTicks;

        const bandWidth = widestLabel(labels, LABEL_POOL_SIZE) + LABEL_GAP * 2;
        const flipped = axisX < bandWidth + LABEL_GAP;
        const anchor = flipped ? axisX + LABEL_GAP : axisX - LABEL_GAP;

        let slot = 0;

        for (let i = 0; i < values.length && slot < LABEL_POOL_SIZE; i++) {
            const label = this._yLabels[slot++];

            label.content = labels[i];
            label.x = anchor;
            label.y = this._yScale(values[i]);
            label.textAlign = flipped ? 'left' : 'right';
            label.textBaseline = 'middle';
            label.opacity = 1;
        }

        for (let i = slot; i < LABEL_POOL_SIZE; i++) {
            this._yLabels[i].opacity = 0;
        }

        this._yBand.y = 0;
        this._yBand.height = this._height;
        this._yBand.width = bandWidth;
        this._yBand.x = flipped ? anchor - LABEL_GAP : anchor + LABEL_GAP - bandWidth;
        this._yBand.opacity = clamped ? 1 : 0;
    }

    private _createCurve(series: Graph2DSeries): CurveState {
        const buffer: CurveBuffer = {
            xs: new Float32Array(INITIAL_SAMPLES),
            ys: new Float32Array(INITIAL_SAMPLES),
            breaks: new Uint8Array(INITIAL_SAMPLES),
            count: 0,
        };

        // No pointer listener: one would opt the curve into `isPointInStroke` over every segment.
        const element = createPath({
            cachePath: false,
            x: 0,
            y: 0,
            width: this._width,
            height: this._height,
            stroke: series.color,
            lineWidth: this._lineWidth,
            lineCap: 'round',
            lineJoin: 'round',
            pathRenderer: path => renderCurveBuffer(path, buffer),
        });

        this._curveGroup.add(element);

        return {
            series,
            buffer,
            element,
        };
    }

    private _resampleCurves(): void {
        const viewport = this.getViewport();

        this._curves.forEach(state => this._resampleCurve(state, viewport));

        // A `cachePath: false` path never goes dirty, so nothing else would ask for a repaint.
        this._scene.invalidate();
    }

    private _resampleCurve(state: CurveState, viewport: Viewport2D): void {
        const {
            series,
            buffer,
        } = state;

        if (!series.visible || series.expression.error) {
            buffer.count = 0;
            state.element.opacity = 0;
            return;
        }

        state.element.opacity = 1;

        fillCurveBuffer(buffer, this._sample(series.expression, {
            viewport,
            params: this._params,
            devicePixelRatio: factory.devicePixelRatio,
            maxEvaluations: this._maxEvaluations,
        }));
    }

    /**
     * Squared pixel distance from the pointer to a curve, leaving the touched point in the candidate
     * fields. Squared because this runs per curve per pointer frame and only the ordering matters.
     */
    private _traceDistance(state: CurveState, dataX: number): number {
        if (state.series.expression.kind !== 'explicit-y') {
            return this._traceSampledDistance(state);
        }

        this._scope.set('x', dataX);

        const value = state.series.expression.evaluate(this._scope);

        if (!Number.isFinite(value)) {
            return Infinity;
        }

        this._candidateX = this._pointerX;
        this._candidateY = this._yScale(value);

        const dy = this._candidateY - this._pointerY;

        return dy * dy;
    }

    private _traceSampledDistance(state: CurveState): number {
        const {
            xs,
            ys,
            count,
        } = state.buffer;

        let nearest = Infinity;

        for (let i = 0; i < count; i++) {
            const dx = xs[i] - this._pointerX;
            const dy = ys[i] - this._pointerY;
            const distance = dx * dx + dy * dy;

            if (distance < nearest) {
                nearest = distance;
                this._candidateX = xs[i];
                this._candidateY = ys[i];
            }
        }

        return nearest;
    }

    private _updateTrace(): void {
        if (this._pointerX < 0 || !this._curves.size) {
            this._traceGroup.opacity = 0;
            return;
        }

        const dataX = this._xScale.inverse(this._pointerX);

        let bestDistance = TRACE_THRESHOLD * TRACE_THRESHOLD;
        let bestX = 0;
        let bestY = 0;
        let bestColor = '';

        this._curves.forEach(state => {
            if (!state.series.visible || state.series.expression.error) {
                return;
            }

            const distance = this._traceDistance(state, dataX);

            if (distance >= bestDistance) {
                return;
            }

            bestDistance = distance;
            bestX = this._candidateX;
            bestY = this._candidateY;
            bestColor = state.series.color;
        });

        if (!bestColor) {
            this._traceGroup.opacity = 0;
            this._scene.invalidate();
            return;
        }

        this._placeTrace(bestX, bestY, bestColor);
        this._scene.invalidate();
    }

    private _placeTrace(px: number, py: number, color: string): void {
        const content = `(${formatCoordinate(this._xScale.inverse(px), this._xTicks.step)}, ${formatCoordinate(this._yScale.inverse(py), this._yTicks.step)})`;
        const width = estimateTextWidth(content) + TRACE_PADDING * 2;
        const flipped = px + MARKER_RADIUS + LABEL_GAP + width > this._width;
        const left = flipped ? px - MARKER_RADIUS - LABEL_GAP - width : px + MARKER_RADIUS + LABEL_GAP;
        const top = numberClamp(py - LABEL_BAND_SIZE / 2, 0, Math.max(0, this._height - LABEL_BAND_SIZE));

        this._traceMarker.cx = px;
        this._traceMarker.cy = py;
        this._traceMarker.fill = color;

        this._traceBacking.x = left;
        this._traceBacking.y = top;
        this._traceBacking.width = width;
        this._traceBacking.height = LABEL_BAND_SIZE;

        this._traceLabel.content = content;
        this._traceLabel.x = left + TRACE_PADDING;
        this._traceLabel.y = top + LABEL_BAND_SIZE / 2;

        this._traceGroup.opacity = 1;
    }

    /**
     * Replaces the drawn expressions, reusing the sample buffer of any expression whose id survives
     * so a color or visibility edit does not throw away the curve.
     *
     * @param series - The expressions to draw, in the order their colors index the palette.
     */
    public setExpressions(series: Graph2DSeries[]): void {
        const retained = new Set<string>();

        series.forEach((item, index) => {
            const state = this._curves.get(item.id) ?? this._createCurve(item);

            state.series = item;
            state.element.stroke = item.color;
            state.element.zIndex = index;

            retained.add(item.id);
            this._curves.set(item.id, state);
        });

        this._curves.forEach((state, id) => {
            if (retained.has(id)) {
                return;
            }

            state.element.destroy();
            this._curves.delete(id);
        });

        this._viewDirty = true;
    }

    /**
     * Replaces the values bound to the expressions' free symbols, re-sampling on the next frame.
     *
     * @param params - The parameter values, keyed by symbol name.
     */
    public setParams(params: Map<string, number>): void {
        this._params = new Map(params);
        this._scope = new Map(params);
        this._viewDirty = true;
    }

    /**
     * Repaints the axes, gridlines and labels in a freshly resolved theme.
     *
     * @param theme - The colors to draw with, typically from `resolveGraphTheme`.
     */
    public setTheme(theme: GraphTheme): void {
        this._theme = theme;

        this._background.fill = theme.background;
        this._minorGrid.stroke = theme.gridMinor;
        this._majorGrid.stroke = theme.gridMajor;
        this._xAxis.stroke = theme.axis;
        this._yAxis.stroke = theme.axis;
        this._xBand.fill = theme.labelBacking;
        this._yBand.fill = theme.labelBacking;
        this._traceBacking.fill = theme.labelBacking;
        this._traceLabel.fill = theme.label;

        this._xLabels.forEach(label => label.fill = theme.label);
        this._yLabels.forEach(label => label.fill = theme.label);

        this._scene.invalidate();
    }

    /**
     * Switches the x axis between decimal ticks and multiples of pi.
     *
     * @param enabled - Whether x ticks should fall on multiples of pi.
     */
    public setPiTicks(enabled: boolean): void {
        this._piTicks = enabled;
        this._viewDirty = true;
    }

    /** Returns the view to its default window, centered on the origin at the configured extent. */
    public resetView(): void {
        this._reframe(0, 0, this._defaultUnitsPerPixel());
    }

    /** The region currently visible, in data units, together with the pixel size it maps onto. */
    public getViewport(): Viewport2D {
        return {
            xMin: this._xMin,
            xMax: this._xMax,
            yMin: this._yMin,
            yMax: this._yMax,
            width: this._width,
            height: this._height,
        };
    }

    /** The theme the graph is currently drawn in. */
    public getTheme(): GraphTheme {
        return this._theme;
    }

    /** The width of one screen pixel, in data units, at the current zoom. */
    public getUnitsPerPixel(): number {
        return this._unitsPerPixel / this._navigator.transform.k;
    }

    /** Tears down the navigator, renderer, scene and every listener the graph attached. */
    public destroy(): void {
        this._disposables.forEach(disposable => disposable.dispose());
        this._disposables.length = 0;
        this._curves.clear();
        this._navigator.destroy();
        this._renderer.destroy();
        this._scene.destroy(this._ownsContext);
    }

}

/**
 * Factory function that creates a new {@link Graph2D} instance, bound to a canvas host.
 *
 * @example
 * ```ts
 * const graph = createGraph2D(host, {
 *     sample: samplePlot,
 *     theme: resolveGraphTheme(),
 * });
 *
 * graph.setExpressions([{ id: 'a', expression, color: '#d94a4a', visible: true }]);
 * ```
 */
export function createGraph2D(...options: ConstructorParameters<typeof Graph2D>): Graph2D {
    return new Graph2D(...options);
}
