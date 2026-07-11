import type {
    ChartComponentOptions,
} from './_base';

import {
    ChartComponent,
} from './_base';

import type {
    Group,
    Line,
    LineState,
} from '@ripl/core';

import {
    createGroup,
    createLine,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** Options for constructing a grid component. */
export interface GridOptions extends ChartComponentOptions {
    horizontal?: boolean;
    vertical?: boolean;
    stroke?: string;
    lineWidth?: number;
    lineDash?: number[];
}

const DEFAULT_STROKE = '#e5e7eb';
const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LINE_DASH = [4, 4];

/** A background grid component rendering horizontal and/or vertical dashed lines at tick positions. */
export class Grid extends ChartComponent {

    private _group?: Group;
    private _horizontalLines: Line[] = [];
    private _verticalLines: Line[] = [];
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

    public async render(
        xTicks: number[],
        yTicks: number[],
        x: number,
        y: number,
        width: number,
        height: number
    ) {
        if (!this._group) {
            this._group = createGroup({
                id: 'grid',
                class: 'chart-grid',
                zIndex: 0,
            });

            this.scene.add(this._group);
        }

        // Drop grid lines that sit on the plot boundary — that's where the (solid) axis line lives,
        // so a dotted grid line there would draw right on top of it.
        const EDGE_EPSILON = 0.5;
        const onEdge = (value: number, min: number, max: number) => Math.abs(value - min) < EDGE_EPSILON || Math.abs(value - max) < EDGE_EPSILON;

        const hTicks = yTicks.filter(tick => !onEdge(tick, y, y + height));
        const vTicks = xTicks.filter(tick => !onEdge(tick, x, x + width));

        if (this._horizontal) {
            const {
                left: hEntries,
                inner: hUpdates,
                right: hExits,
            } = arrayJoin(hTicks, this._horizontalLines, (tick, line) => line.id === `grid-h-${tick}`);

            hExits.forEach(el => el.destroy());

            const newLines = hEntries.map(tickY => {
                const line = createLine({
                    id: `grid-h-${tickY}`,
                    x1: x,
                    y1: tickY,
                    x2: x + width,
                    y2: tickY,
                    stroke: this._stroke,
                    lineWidth: this._lineWidth,
                    lineDash: this._lineDash,
                });

                this._group!.add(line);

                return line;
            });

            hUpdates.forEach(([tickY, line]) => {
                line.data = {
                    x1: x,
                    y1: tickY,
                    x2: x + width,
                    y2: tickY,
                } as Partial<LineState>;
            });

            this._horizontalLines = [
                ...newLines,
                ...hUpdates.map(([, line]) => line),
            ];
        }

        if (this._vertical) {
            const {
                left: vEntries,
                inner: vUpdates,
                right: vExits,
            } = arrayJoin(vTicks, this._verticalLines, (tick, line) => line.id === `grid-v-${tick}`);

            vExits.forEach(el => el.destroy());

            const newLines = vEntries.map(tickX => {
                const line = createLine({
                    id: `grid-v-${tickX}`,
                    x1: tickX,
                    y1: y,
                    x2: tickX,
                    y2: y + height,
                    stroke: this._stroke,
                    lineWidth: this._lineWidth,
                    lineDash: this._lineDash,
                });

                this._group!.add(line);

                return line;
            });

            vUpdates.forEach(([tickX, line]) => {
                line.data = {
                    x1: tickX,
                    y1: y,
                    x2: tickX,
                    y2: y + height,
                } as Partial<LineState>;
            });

            this._verticalLines = [
                ...newLines,
                ...vUpdates.map(([, line]) => line),
            ];
        }
    }

    public destroy() {
        if (this._group) {
            this._group.destroy();
        }
    }

}
