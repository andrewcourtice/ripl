import {
    createGroup,
    createLine,
    Group,
} from '@ripl/core';

import {
    arrayForEach,
} from '@ripl/utilities';

import {
    ChartComponent,
    ChartComponentOptions,
} from './_base';

export interface GridOptions extends ChartComponentOptions {
    horizontal?: boolean;
    vertical?: boolean;
    strokeStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
}

const DEFAULT_STROKE = '#e5e7eb';
const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LINE_DASH = [4, 4];

export class Grid extends ChartComponent {

    private group?: Group;
    private horizontal: boolean;
    private vertical: boolean;
    private strokeStyle: string;
    private lineWidth: number;
    private lineDash: number[];

    constructor(options: GridOptions) {
        super(options);

        this.horizontal = options.horizontal ?? true;
        this.vertical = options.vertical ?? false;
        this.strokeStyle = options.strokeStyle ?? DEFAULT_STROKE;
        this.lineWidth = options.lineWidth ?? DEFAULT_LINE_WIDTH;
        this.lineDash = options.lineDash ?? DEFAULT_LINE_DASH;
    }

    public async render(
        xTicks: number[],
        yTicks: number[],
        x: number,
        y: number,
        width: number,
        height: number
    ) {
        if (this.group) {
            this.group.clear();
            this.scene.remove(this.group);
        }

        this.group = createGroup({
            id: 'grid',
            class: 'chart-grid',
            zIndex: 0,
        });

        if (this.horizontal) {
            arrayForEach(yTicks, (tickY) => {
                this.group!.add(createLine({
                    id: `grid-h-${tickY}`,
                    x1: x,
                    y1: tickY,
                    x2: x + width,
                    y2: tickY,
                    strokeStyle: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineDash: this.lineDash,
                }));
            });
        }

        if (this.vertical) {
            arrayForEach(xTicks, (tickX) => {
                this.group!.add(createLine({
                    id: `grid-v-${tickX}`,
                    x1: tickX,
                    y1: y,
                    x2: tickX,
                    y2: y + height,
                    strokeStyle: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineDash: this.lineDash,
                }));
            });
        }

        this.scene.add(this.group);
    }

    public destroy() {
        if (this.group) {
            this.scene.remove(this.group);
        }
    }

}
