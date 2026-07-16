/**
 * Overview navigator strip.
 *
 * Renders a compressed, non-interactive overview of the full series beneath the plot, with a
 * draggable window (two edge handles + a movable body) that selects the visible x-range. The strip
 * owns none of the transform maths — it reports the selected window as fractions `[start, end]` of
 * the domain via `onWindow`, and the host chart converts that to a navigator transform. On each
 * render the host feeds back the current window (derived from the transform) so in-plot pan/zoom and
 * the strip stay in lock-step.
 *
 * Dragging is wired with DOM pointer listeners on the render context so a drag keeps tracking outside
 * the strip (pointer capture). A `pointerdown` inside the strip band calls
 * `stopImmediatePropagation` so the in-plot navigator — whose listeners are attached *after* the
 * strip's — never also pans; a `pointerdown` outside the band is left untouched so in-plot pan/zoom
 * still works over the plot.
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
} from '@ripl/core';

import {
    onDOMEvent,
} from '@ripl/dom';

/** Retention key for the strip's DOM pointer listeners. */
const LISTENER_KEY = Symbol('navigator-strip-listeners');
/** Pixel slop for grabbing an edge handle. */
const HANDLE_SLOP = 10;
/** Visible width of an edge handle, in pixels. */
const HANDLE_WIDTH = 8;
/** Minimum window width as a fraction of the domain (bounds the maximum zoom). */
const MIN_WINDOW = 0.02;

const STRIP_BACKGROUND = 'rgba(148, 163, 184, 0.10)';
const STRIP_BORDER = 'rgba(148, 163, 184, 0.45)';
const MASK_FILL = 'rgba(148, 163, 184, 0.32)';
const WINDOW_BORDER = 'rgba(100, 116, 139, 0.9)';
const HANDLE_FILL = 'rgba(100, 116, 139, 0.95)';
const OVERVIEW_OPACITY = 0.7;

/** A single series' values across the categories, for the overview mini-render. */
export interface ChartNavigatorSeries {
    /** The series id (used for the overview element ids). */
    id: string;
    /** The series colour. */
    color: string;
    /** The series' value at each category, in key order. */
    values: number[];
}

/** The selected window, as fractions `[0, 1]` of the domain. */
export interface ChartNavigatorWindow {
    /** The left edge of the window (`0` = domain start). */
    start: number;
    /** The right edge of the window (`1` = domain end). */
    end: number;
}

/** Inputs for one render of the {@link ChartNavigator} strip. */
export interface ChartNavigatorRenderOptions {
    /** The rectangle the overview draws into (aligned to the main plot's x-range). */
    area: ChartArea;
    /** The overview series to draw. */
    series: ChartNavigatorSeries[];
    /** The value extent `[min, max]` used to scale the overview vertically. */
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

/** The overview strip component that drives the chart's visible x-window. */
export class ChartNavigator extends ChartComponent {

    private _group?: Group;
    private _element?: HTMLElement;
    private _area?: ChartArea;
    private _window: ChartNavigatorWindow = {
        start: 0,
        end: 1,
    };
    private _onWindow?: (window: ChartNavigatorWindow) => void;
    private _attached = false;
    private _drag?: {
        mode: DragMode;
        startX: number;
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
        const { area, series, valueExtent, window, onWindow } = options;

        this._area = area;
        this._window = window;
        this._onWindow = onWindow;

        const group = this._ensureGroup();
        group.clear();

        const children: Element[] = [
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
            ...this._overviewElements(area, series, valueExtent),
            ...this._windowElements(area, window),
        ];

        group.add(children);
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

    private _overviewElements(area: ChartArea, series: ChartNavigatorSeries[], valueExtent: [number, number]): Element[] {
        const [min, max] = valueExtent;
        const span = max - min || 1;

        const xAt = (index: number, count: number) => {
            const t = count <= 1 ? 0.5 : index / (count - 1);
            return area.x + t * area.width;
        };

        const yAt = (value: number) => area.y + area.height - ((value - min) / span) * area.height;

        return series
            .filter(srs => srs.values.length > 0)
            .map(srs => {
                const points: Point[] = srs.values.map((value, index) => [xAt(index, srs.values.length), yAt(value)]);

                return createPolyline({
                    id: `navigator-overview-${srs.id}`,
                    points,
                    stroke: srs.color,
                    lineWidth: 1,
                    opacity: OVERVIEW_OPACITY,
                    pointerEvents: 'none',
                });
            });
    }

    private _windowElements(area: ChartArea, window: ChartNavigatorWindow): Element[] {
        const wx0 = area.x + clamp(window.start, 0, 1) * area.width;
        const wx1 = area.x + clamp(window.end, 0, 1) * area.width;

        return [
            // Dim the unselected regions on each side of the window.
            createRect({
                id: 'navigator-mask-left',
                x: area.x,
                y: area.y,
                width: Math.max(0, wx0 - area.x),
                height: area.height,
                fill: MASK_FILL,
                pointerEvents: 'none',
            }),
            createRect({
                id: 'navigator-mask-right',
                x: wx1,
                y: area.y,
                width: Math.max(0, area.x + area.width - wx1),
                height: area.height,
                fill: MASK_FILL,
                pointerEvents: 'none',
            }),
            // The window outline.
            createRect({
                id: 'navigator-window',
                x: wx0,
                y: area.y,
                width: Math.max(0, wx1 - wx0),
                height: area.height,
                fill: 'transparent',
                stroke: WINDOW_BORDER,
                lineWidth: 1,
                pointerEvents: 'none',
            }),
            // The two draggable edge handles.
            this._handle('navigator-handle-start', wx0, area),
            this._handle('navigator-handle-end', wx1, area),
        ];
    }

    private _handle(id: string, x: number, area: ChartArea): Element {
        return createRect({
            id,
            x: x - HANDLE_WIDTH / 2,
            y: area.y + area.height / 2 - area.height / 4,
            width: HANDLE_WIDTH,
            height: area.height / 2,
            fill: HANDLE_FILL,
            borderRadius: 2,
            pointerEvents: 'none',
        });
    }

    private _localPoint(event: PointerEvent): Point {
        const rect = this._element!.getBoundingClientRect();

        return [
            event.clientX - rect.left,
            event.clientY - rect.top,
        ];
    }

    private _hitTest(x: number): DragMode | null {
        if (!this._area) {
            return null;
        }

        const wx0 = this._area.x + this._window.start * this._area.width;
        const wx1 = this._area.x + this._window.end * this._area.width;

        if (Math.abs(x - wx0) <= HANDLE_SLOP) {
            return 'resize-start';
        }

        if (Math.abs(x - wx1) <= HANDLE_SLOP) {
            return 'resize-end';
        }

        if (x >= wx0 && x <= wx1) {
            return 'move';
        }

        return null;
    }

    private _onPointerDown = (event: PointerEvent): void => {
        if (!this._area || !this._onWindow || !this._element) {
            return;
        }

        const [x, y] = this._localPoint(event);

        // Only claim pointers that land inside the strip band; leave the rest to the in-plot navigator.
        if (y < this._area.y || y > this._area.y + this._area.height) {
            return;
        }

        // Block the in-plot navigator (its listeners were attached after ours) from also panning.
        event.stopImmediatePropagation();
        event.preventDefault();

        const mode = this._hitTest(x);

        if (!mode) {
            return;
        }

        this._drag = {
            mode,
            startX: x,
            startWindow: { ...this._window },
        };

        this._element.setPointerCapture?.(event.pointerId);
    };

    private _onPointerMove = (event: PointerEvent): void => {
        if (!this._drag || !this._area || !this._onWindow) {
            return;
        }

        const [x] = this._localPoint(event);
        const delta = (x - this._drag.startX) / Math.max(1, this._area.width);
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
