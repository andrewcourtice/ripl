/**
 * Overview navigator strip.
 *
 * Renders a compressed overview of the full series with a draggable window (two edge handles + a
 * movable body) that selects the visible range of the **category** axis. The strip is
 * orientation-aware: a `horizontal` strip (category on x) is a bottom bar whose window slides
 * left↔right; a `vertical` strip (category on y, e.g. a horizontal bar chart) is a side bar whose
 * window slides up↕down. It reports the window as fractions `[start, end]` of the category domain via
 * `onWindow`; the host converts that to a navigator transform. The overview draws each series by
 * type — lines as polylines, areas as filled bands, bars as silhouettes — along the **main** (category)
 * axis, scaled along the **cross** (value) axis.
 *
 * Dragging is wired with DOM pointer listeners on the render context (pointer capture keeps a drag
 * tracking outside the strip). A `pointerdown` inside the strip band calls `stopImmediatePropagation`
 * so the in-plot navigator — whose listeners attach after the strip's — never also pans.
 */

import {
    ChartComponent,
} from './_base';

import type {
    ChartArea,
} from '../core/layout';

import type {
    Element,
    Group,
    Point,
} from '@ripl/core';

import {
    createGroup,
    createPolyline,
    createRect,
    setColorAlpha,
} from '@ripl/core';

import {
    onDOMEvent,
} from '@ripl/dom';

/** Retention key for the strip's DOM pointer listeners. */
const LISTENER_KEY = Symbol('navigator-strip-listeners');
/** Pixel slop for grabbing an edge handle. */
const HANDLE_SLOP = 10;
/** Thickness of an edge handle along the main axis, in pixels. */
const HANDLE_WIDTH = 8;
/** Minimum window width as a fraction of the domain (bounds the maximum zoom). */
const MIN_WINDOW = 0.02;

const STRIP_BACKGROUND = 'rgba(148, 163, 184, 0.10)';
const STRIP_BORDER = 'rgba(148, 163, 184, 0.45)';
const MASK_FILL = 'rgba(148, 163, 184, 0.32)';
const WINDOW_BORDER = 'rgba(100, 116, 139, 0.9)';
const HANDLE_FILL = 'rgba(100, 116, 139, 0.95)';
const OVERVIEW_OPACITY = 0.7;
const AREA_FILL_ALPHA = 0.25;
const BAR_FILL_ALPHA = 0.55;

/** Which screen axis the strip's window slides along (matching the host's category axis). */
export type ChartNavigatorOrientation = 'horizontal' | 'vertical';

/** How a single overview series is drawn in the strip. */
export type ChartNavigatorSeriesType = 'line' | 'bar' | 'area';

/** A single series' values across the categories, for the overview mini-render. */
export interface ChartNavigatorSeries {
    /** The series id (used for the overview element ids). */
    id: string;
    /** The series colour. */
    color: string;
    /** How the series is drawn in the overview. */
    type: ChartNavigatorSeriesType;
    /** The series' value at each category, in key order. */
    values: number[];
}

/** The selected window, as fractions `[0, 1]` of the category domain. */
export interface ChartNavigatorWindow {
    /** The start edge of the window (`0` = domain start). */
    start: number;
    /** The end edge of the window (`1` = domain end). */
    end: number;
}

/** Inputs for one render of the {@link ChartNavigator} strip. */
export interface ChartNavigatorRenderOptions {
    /** Which axis the window slides along. */
    orientation: ChartNavigatorOrientation;
    /** The rectangle the overview draws into (aligned to the main plot's category range). */
    area: ChartArea;
    /** The overview series to draw. */
    series: ChartNavigatorSeries[];
    /** The value extent `[min, max]` used to scale the overview across the cross axis. */
    valueExtent: [number, number];
    /** The currently visible window (derived by the host from the navigator transform). */
    window: ChartNavigatorWindow;
    /** Called with the new window whenever the user drags a handle or the window body. */
    onWindow: (window: ChartNavigatorWindow) => void;
}

/** Which part of the window a drag is manipulating. */
type DragMode = 'move' | 'resize-start' | 'resize-end';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/** The overview strip component that drives the chart's visible category-axis window. */
export class ChartNavigator extends ChartComponent {

    private _group?: Group;
    private _element?: HTMLElement;
    private _orientation: ChartNavigatorOrientation = 'horizontal';
    private _area?: ChartArea;
    private _window: ChartNavigatorWindow = {
        start: 0,
        end: 1,
    };
    private _onWindow?: (window: ChartNavigatorWindow) => void;
    private _attached = false;
    private _drag?: {
        mode: DragMode;
        startMain: number;
        startWindow: ChartNavigatorWindow;
    };

    /**
     * Attaches the strip's DOM pointer listeners to the render context. Call this **before** the chart
     * creates its in-plot navigator so the strip's `pointerdown` listener runs first and can suppress
     * in-plot panning within the strip band. No-op on non-DOM contexts or if already attached.
     */
    public attach(): void {
        if (this._attached) {
            return;
        }

        const element = this.context.element as unknown as HTMLElement;

        if (!element || typeof element.getBoundingClientRect !== 'function' || typeof element.addEventListener !== 'function') {
            return;
        }

        this._element = element;
        this.retain(onDOMEvent(element, 'pointerdown', this._onPointerDown), LISTENER_KEY);
        this.retain(onDOMEvent(element, 'pointermove', this._onPointerMove), LISTENER_KEY);
        this.retain(onDOMEvent(element, 'pointerup', this._onPointerUp), LISTENER_KEY);
        this.retain(onDOMEvent(element, 'pointercancel', this._onPointerUp), LISTENER_KEY);
        this._attached = true;
    }

    /** Draws the overview, mask, and window for the current state. */
    public render(options: ChartNavigatorRenderOptions): void {
        const { orientation, area, series, valueExtent, window, onWindow } = options;

        this._orientation = orientation;
        this._area = area;
        this._window = window;
        this._onWindow = onWindow;

        const group = this._ensureGroup();
        group.clear();

        group.add([
            createRect({
                id: 'navigator-strip',
                x: area.x,
                y: area.y,
                width: area.width,
                height: area.height,
                fill: STRIP_BACKGROUND,
                stroke: STRIP_BORDER,
                lineWidth: 1,
                borderRadius: 3,
                pointerEvents: 'none',
            }),
            ...this._overviewElements(series, valueExtent),
            ...this._windowElements(window),
        ]);
    }

    /** Removes the strip's drawn elements (e.g. when the overview is toggled off), leaving listeners inert. */
    public clear(): void {
        this._area = undefined;
        this._onWindow = undefined;
        this._group?.destroy();
        this._group = undefined;
    }

    /** Detaches the strip's listeners and destroys its elements. */
    public destroy(): void {
        this.dispose(LISTENER_KEY);
        this._group?.destroy();
        this._group = undefined;
        this._attached = false;
        super.destroy();
    }

    private get _horizontal(): boolean {
        return this._orientation === 'horizontal';
    }

    private _mainStart(): number {
        return this._horizontal ? this._area!.x : this._area!.y;
    }

    private _mainSize(): number {
        return this._horizontal ? this._area!.width : this._area!.height;
    }

    private _crossStart(): number {
        return this._horizontal ? this._area!.y : this._area!.x;
    }

    private _crossSize(): number {
        return this._horizontal ? this._area!.height : this._area!.width;
    }

    /** The main-axis pixel position for a data index across `count` categories. */
    private _mainForIndex(index: number, count: number): number {
        const fraction = count <= 1 ? 0.5 : index / (count - 1);
        return this._mainStart() + fraction * this._mainSize();
    }

    /** The main-axis pixel position for a `[0, 1]` window fraction. */
    private _mainForFraction(fraction: number): number {
        return this._mainStart() + clamp(fraction, 0, 1) * this._mainSize();
    }

    /** The cross-axis pixel position for a value (values grow up for horizontal, right for vertical). */
    private _crossForValue(value: number, min: number, span: number): number {
        const fraction = (value - min) / span;
        return this._horizontal
            ? this._crossStart() + this._crossSize() - fraction * this._crossSize()
            : this._crossStart() + fraction * this._crossSize();
    }

    /** Maps a (main, cross) coordinate pair to an (x, y) point for the current orientation. */
    private _point(main: number, cross: number): Point {
        return this._horizontal ? [main, cross] : [cross, main];
    }

    private _overviewElements(series: ChartNavigatorSeries[], valueExtent: [number, number]): Element[] {
        const [min, max] = valueExtent;
        const span = max - min || 1;
        // Values ≥ 0 sit on the strip floor; a diverging series anchors at 0.
        const baseline = clamp(0, min, max);

        return series
            .filter(srs => srs.values.length > 0)
            .flatMap(srs => {
                if (srs.type === 'area') {
                    return this._areaOverview(srs, min, span, baseline);
                }

                if (srs.type === 'bar') {
                    return this._barOverview(srs, min, span, baseline);
                }

                return this._lineOverview(srs, min, span);
            });
    }

    private _lineOverview(srs: ChartNavigatorSeries, min: number, span: number): Element[] {
        const count = srs.values.length;
        const points = srs.values.map((value, index) => this._point(this._mainForIndex(index, count), this._crossForValue(value, min, span)));

        return [
            createPolyline({
                id: `navigator-overview-${srs.id}`,
                points,
                stroke: srs.color,
                lineWidth: 1,
                opacity: OVERVIEW_OPACITY,
                pointerEvents: 'none',
            }),
        ];
    }

    private _areaOverview(srs: ChartNavigatorSeries, min: number, span: number, baseline: number): Element[] {
        const count = srs.values.length;
        const top = srs.values.map((value, index) => this._point(this._mainForIndex(index, count), this._crossForValue(value, min, span)));
        const bottom = srs.values.map((_, index) => this._point(this._mainForIndex(index, count), this._crossForValue(baseline, min, span)));

        const fill = createPolyline({
            id: `navigator-overview-${srs.id}-fill`,
            points: [
                ...top,
                ...bottom.reverse(),
            ],
            fill: setColorAlpha(srs.color, AREA_FILL_ALPHA),
            pointerEvents: 'none',
        });

        fill.autoStroke = false;

        return [
            fill,
            createPolyline({
                id: `navigator-overview-${srs.id}-line`,
                points: top,
                stroke: srs.color,
                lineWidth: 1,
                opacity: OVERVIEW_OPACITY,
                pointerEvents: 'none',
            }),
        ];
    }

    private _barOverview(srs: ChartNavigatorSeries, min: number, span: number, baseline: number): Element[] {
        const count = srs.values.length;
        const baseCross = this._crossForValue(baseline, min, span);
        const thickness = Math.max(1, this._mainSize() / (count * 1.5));
        const fill = setColorAlpha(srs.color, BAR_FILL_ALPHA);

        return srs.values.map((value, index) => {
            const mainCentre = this._mainForIndex(index, count);
            const valueCross = this._crossForValue(value, min, span);
            const mainLo = mainCentre - thickness / 2;
            const crossLo = Math.min(baseCross, valueCross);
            const crossHi = Math.max(baseCross, valueCross);

            const rect = this._horizontal
                ? {
                    x: mainLo,
                    y: crossLo,
                    width: thickness,
                    height: crossHi - crossLo,
                }
                : {
                    x: crossLo,
                    y: mainLo,
                    width: crossHi - crossLo,
                    height: thickness,
                };

            return createRect({
                id: `navigator-overview-${srs.id}-bar-${index}`,
                ...rect,
                fill,
                pointerEvents: 'none',
            });
        });
    }

    private _windowElements(window: ChartNavigatorWindow): Element[] {
        const wStart = this._mainForFraction(window.start);
        const wEnd = this._mainForFraction(window.end);
        const mainLo = this._mainStart();
        const mainHi = this._mainStart() + this._mainSize();

        return [
            // Dim the unselected regions on each side of the window.
            this._spanRect('navigator-mask-start', mainLo, wStart, {
                fill: MASK_FILL,
            }),
            this._spanRect('navigator-mask-end', wEnd, mainHi, {
                fill: MASK_FILL,
            }),
            // The window outline.
            this._spanRect('navigator-window', wStart, wEnd, {
                fill: 'transparent',
                stroke: WINDOW_BORDER,
                lineWidth: 1,
            }),
            // The two draggable edge handles.
            this._handle('navigator-handle-start', wStart),
            this._handle('navigator-handle-end', wEnd),
        ];
    }

    /** A rect spanning `[mainLo, mainHi]` along the main axis and the full cross extent. */
    private _spanRect(id: string, mainLo: number, mainHi: number, style: { fill: string;
        stroke?: string;
        lineWidth?: number; }): Element {
        const size = Math.max(0, mainHi - mainLo);
        const rect = this._horizontal
            ? {
                x: mainLo,
                y: this._crossStart(),
                width: size,
                height: this._crossSize(),
            }
            : {
                x: this._crossStart(),
                y: mainLo,
                width: this._crossSize(),
                height: size,
            };

        return createRect({
            id,
            ...rect,
            ...style,
            pointerEvents: 'none',
        });
    }

    private _handle(id: string, mainCoord: number): Element {
        const crossInset = this._crossSize() / 4;
        const rect = this._horizontal
            ? {
                x: mainCoord - HANDLE_WIDTH / 2,
                y: this._crossStart() + crossInset,
                width: HANDLE_WIDTH,
                height: this._crossSize() / 2,
            }
            : {
                x: this._crossStart() + crossInset,
                y: mainCoord - HANDLE_WIDTH / 2,
                width: this._crossSize() / 2,
                height: HANDLE_WIDTH,
            };

        return createRect({
            id,
            ...rect,
            fill: HANDLE_FILL,
            borderRadius: 2,
            pointerEvents: 'none',
        });
    }

    private _ensureGroup(): Group {
        if (!this._group) {
            this._group = createGroup({
                id: '__navigator-strip',
                // Above the plot content (z-index 1) so the strip and its window sit on top.
                zIndex: 4,
            });

            this.scene.add(this._group);
        }

        return this._group;
    }

    private _localPoint(event: PointerEvent): Point {
        const rect = this._element!.getBoundingClientRect();

        return [
            event.clientX - rect.left,
            event.clientY - rect.top,
        ];
    }

    /** The pointer coordinate along the main (window) axis. */
    private _mainCoord(point: Point): number {
        return this._horizontal ? point[0] : point[1];
    }

    /** The pointer coordinate along the cross axis (used for the band hit test). */
    private _crossCoord(point: Point): number {
        return this._horizontal ? point[1] : point[0];
    }

    private _hitTest(main: number): DragMode | null {
        const wStart = this._mainForFraction(this._window.start);
        const wEnd = this._mainForFraction(this._window.end);

        if (Math.abs(main - wStart) <= HANDLE_SLOP) {
            return 'resize-start';
        }

        if (Math.abs(main - wEnd) <= HANDLE_SLOP) {
            return 'resize-end';
        }

        if (main >= wStart && main <= wEnd) {
            return 'move';
        }

        return null;
    }

    private _onPointerDown = (event: PointerEvent): void => {
        if (!this._area || !this._onWindow || !this._element) {
            return;
        }

        const point = this._localPoint(event);
        const cross = this._crossCoord(point);

        // Only claim pointers that land inside the strip band; leave the rest to the in-plot navigator.
        if (cross < this._crossStart() || cross > this._crossStart() + this._crossSize()) {
            return;
        }

        // Block the in-plot navigator (its listeners were attached after ours) from also panning.
        event.stopImmediatePropagation();
        event.preventDefault();

        const main = this._mainCoord(point);
        const mode = this._hitTest(main);

        if (!mode) {
            return;
        }

        this._drag = {
            mode,
            startMain: main,
            startWindow: { ...this._window },
        };

        this._element.setPointerCapture?.(event.pointerId);
    };

    private _onPointerMove = (event: PointerEvent): void => {
        if (!this._drag || !this._area || !this._onWindow) {
            return;
        }

        const main = this._mainCoord(this._localPoint(event));
        const delta = (main - this._drag.startMain) / Math.max(1, this._mainSize());
        const { mode, startWindow } = this._drag;

        let start = startWindow.start;
        let end = startWindow.end;

        if (mode === 'move') {
            const width = end - start;
            start = clamp(startWindow.start + delta, 0, 1 - width);
            end = start + width;
        } else if (mode === 'resize-start') {
            start = clamp(startWindow.start + delta, 0, end - MIN_WINDOW);
        } else {
            end = clamp(startWindow.end + delta, start + MIN_WINDOW, 1);
        }

        this._onWindow({
            start,
            end,
        });
    };

    private _onPointerUp = (event: PointerEvent): void => {
        if (!this._drag) {
            return;
        }

        this._drag = undefined;
        this._element?.releasePointerCapture?.(event.pointerId);
    };

}
