import {
    ChartComponent,
    ChartComponentOptions,
} from './_base';

import {
    createGroup,
    createLine,
    Group,
    Line,
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

    private group?: Group;
    private verticalLine?: Line;
    private horizontalLine?: Line;
    private showVertical: boolean;
    private showHorizontal: boolean;
    private stroke: string;
    private lineWidth: number;
    private lineDash: number[];

    private bounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };

    constructor(options: CrosshairOptions) {
        super(options);

        this.showVertical = options.vertical ?? true;
        this.showHorizontal = options.horizontal ?? false;
        this.stroke = options.stroke ?? DEFAULT_STROKE;
        this.lineWidth = options.lineWidth ?? DEFAULT_LINE_WIDTH;
        this.lineDash = options.lineDash ?? DEFAULT_LINE_DASH;
    }

    /** Initializes the crosshair lines and attaches mouse event listeners within the given bounds. */
    public setup(x: number, y: number, width: number, height: number) {
        this.bounds = {
            x,
            y,
            width,
            height,
        };

        if (this.group) {
            this.group.clear();
            this.scene.remove(this.group);
        }

        this.group = createGroup({
            id: 'crosshair',
            class: 'chart-crosshair',
            zIndex: 1500,
        });

        if (this.showVertical) {
            this.verticalLine = createLine({
                id: 'crosshair-v',
                x1: 0,
                y1: y,
                x2: 0,
                y2: y + height,
                stroke: this.stroke,
                lineWidth: this.lineWidth,
                lineDash: this.lineDash,
                opacity: 0,
            });

            this.group.add(this.verticalLine);
        }

        if (this.showHorizontal) {
            this.horizontalLine = createLine({
                id: 'crosshair-h',
                x1: x,
                y1: 0,
                x2: x + width,
                y2: 0,
                stroke: this.stroke,
                lineWidth: this.lineWidth,
                lineDash: this.lineDash,
                opacity: 0,
            });

            this.group.add(this.horizontalLine);
        }

        this.scene.add(this.group);

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
        const { x, y, width, height } = this.bounds;

        if (mouseX < x || mouseX > x + width || mouseY < y || mouseY > y + height) {
            this.hide();
            return;
        }

        if (this.verticalLine) {
            this.verticalLine.x1 = mouseX;
            this.verticalLine.x2 = mouseX;
            this.verticalLine.opacity = 1;
        }

        if (this.horizontalLine) {
            this.horizontalLine.y1 = mouseY;
            this.horizontalLine.y2 = mouseY;
            this.horizontalLine.opacity = 1;
        }
    }

    /** Hides the crosshair lines. */
    public hide() {
        if (this.verticalLine) {
            this.verticalLine.opacity = 0;
        }

        if (this.horizontalLine) {
            this.horizontalLine.opacity = 0;
        }
    }

    /** Destroys the crosshair, removing event listeners and scene elements. */
    public destroy() {
        this.dispose();

        if (this.group) {
            this.scene.remove(this.group);
        }
    }

}
