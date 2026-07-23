import type {
    ChartComponentOptions,
} from './_base';

import {
    ChartComponent,
} from './_base';

import type {
    ResolvedAnimation,
} from '../core/animation';

import {
    ANIMATION_REFERENCE,
    exitElement,
} from '../core/animation';

import type {
    Group,
    Line,
    LineState,
    Rect,
} from '@ripl/core';

import {
    createGroup,
    createLine,
    createRect,
    easeOutCubic,
} from '@ripl/core';

import {
    arrayJoin,
    stringUniqueId,
} from '@ripl/utilities';

/** One grid line to draw: the tick value it represents (a stable join key across rescales) and its pixel position. */
export interface GridTick {
    /** The tick's domain value; grid lines are keyed by it, so a persisting tick transitions instead of redrawing. */
    value: unknown;
    /** The tick's pixel position along the relevant axis. */
    position: number;
}

/** Options for constructing a grid component. */
export interface GridOptions extends ChartComponentOptions {
    /** Whether to draw horizontal grid lines (at y-axis ticks). Defaults to `true`. */
    horizontal?: boolean;
    /** Whether to draw vertical grid lines (at x-axis ticks). Defaults to `false`. */
    vertical?: boolean;
    /** Stroke color of the grid lines. */
    stroke?: string;
    /** Stroke width of the grid lines, in pixels. */
    lineWidth?: number;
    /** Canvas dash pattern for the grid lines. */
    lineDash?: number[];
}

/** Reconfigurable grid options accepted by {@link Grid.setOptions} (everything but the scene/renderer wiring). */
export type GridStyleOptions = Partial<Omit<GridOptions, 'scene' | 'renderer'>>;

const DEFAULT_STROKE = '#e5e7eb';
const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LINE_DASH = [4, 4];

/** Fallback animation used when the grid is not given one by its host chart. */
const DEFAULT_GRID_ANIMATION: ResolvedAnimation = {
    enabled: true,
    duration: ANIMATION_REFERENCE.axis,
    ease: easeOutCubic,
};

/** A background grid component rendering horizontal and/or vertical dashed lines at tick positions. */
export class Grid extends ChartComponent {

    private _group?: Group;
    private _clip?: Rect;
    private _horizontalLines: Line[] = [];
    private _verticalLines: Line[] = [];

    /** Resolved animation grid-line transitions run with; assigned by the host chart each render. */
    public animation: ResolvedAnimation = DEFAULT_GRID_ANIMATION;
    private _horizontal: boolean;
    private _vertical: boolean;
    private _stroke: string;
    private _lineWidth: number;
    private _lineDash: number[];

    constructor(options: GridOptions) {
        super(options);

        this._horizontal = options.horizontal ?? true;
        this._vertical = options.vertical ?? false;
        this._stroke = options.stroke ?? DEFAULT_STROKE;
        this._lineWidth = options.lineWidth ?? DEFAULT_LINE_WIDTH;
        this._lineDash = options.lineDash ?? DEFAULT_LINE_DASH;
    }

    /** Lazily creates the grid group and adds it to the scene once. */
    private _ensureGroup(): Group {
        if (!this._group) {
            this._group = createGroup({
                id: 'grid',
                class: 'chart-grid',
                zIndex: 0,
            });

            this.scene.add(this._group);
        }

        return this._group;
    }

    /**
     * Clips the grid lines to the plot rectangle, enabling the clip only while `enabled` (typically
     * while a navigator is active). Mirrors the plot-content clip so grid lines positioned by a
     * zoomed scale cannot bleed past the plot into the axis gutters.
     *
     * @param area - The current plot rectangle.
     * @param enabled - Whether the clip should mask.
     */
    public clipTo(area: { x: number;
        y: number;
        width: number;
        height: number; }, enabled: boolean): void {
        const group = this._ensureGroup();

        if (!this._clip) {
            this._clip = createRect({
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                clip: false,
                pointerEvents: 'none',
                zIndex: Number.NEGATIVE_INFINITY,
            });

            group.add(this._clip);
        }

        this._clip.x = area.x;
        this._clip.y = area.y;
        this._clip.width = area.width;
        this._clip.height = area.height;
        this._clip.clip = enabled;
    }

    /**
     * Reconfigures the grid in place, updating the stored options (used by the next render) and
     * restyling any existing grid lines so runtime option changes apply without recreating the
     * component. Disabling a direction destroys that direction's existing lines immediately.
     *
     * @param options - The options to apply; omitted properties keep their current values.
     */
    public setOptions(options: GridStyleOptions): void {
        this._horizontal = options.horizontal ?? this._horizontal;
        this._vertical = options.vertical ?? this._vertical;
        this._stroke = options.stroke ?? this._stroke;
        this._lineWidth = options.lineWidth ?? this._lineWidth;
        this._lineDash = options.lineDash ?? this._lineDash;

        if (!this._horizontal && this._horizontalLines.length > 0) {
            this._horizontalLines.forEach(line => line.destroy());
            this._horizontalLines = [];
        }

        if (!this._vertical && this._verticalLines.length > 0) {
            this._verticalLines.forEach(line => line.destroy());
            this._verticalLines = [];
        }

        [
            ...this._horizontalLines,
            ...this._verticalLines,
        ].forEach(line => {
            line.stroke = this._stroke;
            line.lineWidth = this._lineWidth;
            line.lineDash = this._lineDash;
        });
    }

    // Joins one direction's lines against the new ticks by tick VALUE, so a persisting tick's
    // line transitions to its new position, entries fade in, and exits fade out, instead of the
    // whole grid redrawing on every rescale.
    private _reconcileLines(
        ticks: GridTick[],
        lines: Line[],
        prefix: string,
        lineState: (position: number) => Pick<LineState, 'x1' | 'y1' | 'x2' | 'y2'>
    ): Line[] {
        const animated = this.animation.enabled && this.animation.duration > 0;

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(ticks, lines, (tick, line) => line.id === `${prefix}${String(tick.value)}`);

        exits.forEach(line => {
            // Retag first so a re-entering tick value can't collide with the fading line.
            line.id = `${line.id}:exit:${stringUniqueId()}`;
            void exitElement(this.renderer, line, this.animation);
        });

        const newLines = entries.map(tick => {
            const line = createLine({
                id: `${prefix}${String(tick.value)}`,
                ...lineState(tick.position),
                stroke: this._stroke,
                lineWidth: this._lineWidth,
                lineDash: this._lineDash,
                opacity: animated ? 0 : 1,
            });

            this._group!.add(line);

            if (animated) {
                void this.renderer.transition(line, {
                    duration: this.animation.duration,
                    ease: this.animation.ease,
                    state: {
                        opacity: 1,
                    },
                });
            }

            return line;
        });

        updates.forEach(([tick, line]) => {
            line.stroke = this._stroke;
            line.lineWidth = this._lineWidth;
            line.lineDash = this._lineDash;

            const state = lineState(tick.position);

            if (!animated) {
                Object.assign(line, state);
                return;
            }

            void this.renderer.transition(line, {
                duration: this.animation.duration,
                ease: this.animation.ease,
                state,
            });
        });

        return [
            ...newLines,
            ...updates.map(([, line]) => line),
        ];
    }

    /**
     * Renders (and reconciles) grid lines within the given plot rectangle. Lines are keyed by
     * tick value: persisting ticks transition to their new positions, new ticks fade in, and
     * removed ticks fade out.
     *
     * @param xTicks - Ticks (value + x pixel position) for the vertical grid lines.
     * @param yTicks - Ticks (value + y pixel position) for the horizontal grid lines.
     * @param x - Left edge of the plot rectangle, in pixels.
     * @param y - Top edge of the plot rectangle, in pixels.
     * @param width - Width of the plot rectangle, in pixels.
     * @param height - Height of the plot rectangle, in pixels.
     */
    public async render(
        xTicks: GridTick[],
        yTicks: GridTick[],
        x: number,
        y: number,
        width: number,
        height: number
    ) {
        this._ensureGroup();

        // Drop grid lines that sit on the plot boundary; that's where the (solid) axis line lives,
        // so a dotted grid line there would draw right on top of it.
        const EDGE_EPSILON = 0.5;
        const onEdge = (value: number, min: number, max: number) => Math.abs(value - min) < EDGE_EPSILON || Math.abs(value - max) < EDGE_EPSILON;

        const hTicks = yTicks.filter(tick => !onEdge(tick.position, y, y + height));
        const vTicks = xTicks.filter(tick => !onEdge(tick.position, x, x + width));

        if (this._horizontal) {
            this._horizontalLines = this._reconcileLines(hTicks, this._horizontalLines, 'grid-h-', position => ({
                x1: x,
                y1: position,
                x2: x + width,
                y2: position,
            }));
        }

        if (this._vertical) {
            this._verticalLines = this._reconcileLines(vTicks, this._verticalLines, 'grid-v-', position => ({
                x1: position,
                y1: y,
                x2: position,
                y2: y + height,
            }));
        }
    }

    /** Removes the grid's elements from the scene. */
    public destroy() {
        if (this._group) {
            this._group.destroy();
        }
    }

}
