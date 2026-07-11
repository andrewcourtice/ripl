import type {
    ChartComponentOptions,
} from './_base';

import {
    ChartComponent,
} from './_base';

import type {
    Group,
    Line,
} from '@ripl/core';

import {
    createGroup,
    createLine,
} from '@ripl/core';

/** Options for constructing a crosshair component. */
export interface CrosshairOptions extends ChartComponentOptions {
    vertical?: boolean;
    horizontal?: boolean;
    stroke?: string;
    lineWidth?: number;
    lineDash?: number[];
}

const EVENTS_KEY = Symbol('events');
const DEFAULT_STROKE = '#94a3b8';
const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LINE_DASH = [4, 4];

/** A crosshair overlay that follows mouse position within the chart area. */
export class Crosshair extends ChartComponent {

    private _group?: Group;
    private _verticalLine?: Line;
    private _horizontalLine?: Line;
    private _showVertical: boolean;
    private _showHorizontal: boolean;
    private _stroke: string;
    private _lineWidth: number;
    private _lineDash: number[];

    private _bounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };

    constructor(options: CrosshairOptions) {
        super(options);

        this._showVertical = options.vertical ?? true;
        this._showHorizontal = options.horizontal ?? false;
        this._stroke = options.stroke ?? DEFAULT_STROKE;
        this._lineWidth = options.lineWidth ?? DEFAULT_LINE_WIDTH;
        this._lineDash = options.lineDash ?? DEFAULT_LINE_DASH;
    }

    /** Initializes the crosshair lines and attaches mouse event listeners within the given bounds. */
    public setup(x: number, y: number, width: number, height: number) {
        this._bounds = {
            x,
            y,
            width,
            height,
        };

        if (this._group) {
            this._group.clear();
            this.scene.remove(this._group);
        }

        this._group = createGroup({
            id: 'crosshair',
            class: 'chart-crosshair',
            zIndex: 1500,
        });

        if (this._showVertical) {
            this._verticalLine = createLine({
                id: 'crosshair-v',
                x1: 0,
                y1: y,
                x2: 0,
                y2: y + height,
                stroke: this._stroke,
                lineWidth: this._lineWidth,
                lineDash: this._lineDash,
                opacity: 0,
            });

            this._group.add(this._verticalLine);
        }

        if (this._showHorizontal) {
            this._horizontalLine = createLine({
                id: 'crosshair-h',
                x1: x,
                y1: 0,
                x2: x + width,
                y2: 0,
                stroke: this._stroke,
                lineWidth: this._lineWidth,
                lineDash: this._lineDash,
                opacity: 0,
            });

            this._group.add(this._horizontalLine);
        }

        this.scene.add(this._group);

        this.dispose(EVENTS_KEY);

        this.retain(this.context.on('mousemove', (event) => {
            const { x, y } = event.data;
            this.show(x, y);
        }), EVENTS_KEY);

        this.retain(this.context.on('mouseleave', () => {
            this.hide();
        }), EVENTS_KEY);
    }

    /** Shows the crosshair lines at the given mouse coordinates, hiding if outside bounds. */
    public show(mouseX: number, mouseY: number) {
        const { x, y, width, height } = this._bounds;

        if (mouseX < x || mouseX > x + width || mouseY < y || mouseY > y + height) {
            this.hide();
            return;
        }

        if (this._verticalLine) {
            this._verticalLine.x1 = mouseX;
            this._verticalLine.x2 = mouseX;
            this._verticalLine.opacity = 1;
        }

        if (this._horizontalLine) {
            this._horizontalLine.y1 = mouseY;
            this._horizontalLine.y2 = mouseY;
            this._horizontalLine.opacity = 1;
        }
    }

    /** Hides the crosshair lines. */
    public hide() {
        if (this._verticalLine) {
            this._verticalLine.opacity = 0;
        }

        if (this._horizontalLine) {
            this._horizontalLine.opacity = 0;
        }
    }

    /** Destroys the crosshair, removing event listeners and scene elements. */
    public destroy() {
        this.dispose();

        if (this._group) {
            this.scene.remove(this._group);
        }
    }

}
