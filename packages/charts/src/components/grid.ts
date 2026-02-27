import {
    ChartComponent,
    ChartComponentOptions,
} from './_base';

import {
    createGroup,
    createLine,
    Group,
    Line,
    LineState,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
} from '@ripl/utilities';

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
    private horizontalLines: Line[] = [];
    private verticalLines: Line[] = [];
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
        if (!this.group) {
            this.group = createGroup({
                id: 'grid',
                class: 'chart-grid',
                zIndex: 0,
            });

            this.scene.add(this.group);
        }

        if (this.horizontal) {
            const {
                left: hEntries,
                inner: hUpdates,
                right: hExits,
            } = arrayJoin(yTicks, this.horizontalLines, (tick, line) => line.id === `grid-h-${tick}`);

            arrayForEach(hExits, el => el.destroy());

            const newLines = arrayMap(hEntries, tickY => {
                const line = createLine({
                    id: `grid-h-${tickY}`,
                    x1: x,
                    y1: tickY,
                    x2: x + width,
                    y2: tickY,
                    strokeStyle: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineDash: this.lineDash,
                });

                this.group!.add(line);

                return line;
            });

            arrayForEach(hUpdates, ([tickY, line]) => {
                line.data = {
                    x1: x,
                    y1: tickY,
                    x2: x + width,
                    y2: tickY,
                } as Partial<LineState>;
            });

            this.horizontalLines = [
                ...newLines,
                ...arrayMap(hUpdates, ([, line]) => line),
            ];
        }

        if (this.vertical) {
            const {
                left: vEntries,
                inner: vUpdates,
                right: vExits,
            } = arrayJoin(xTicks, this.verticalLines, (tick, line) => line.id === `grid-v-${tick}`);

            arrayForEach(vExits, el => el.destroy());

            const newLines = arrayMap(vEntries, tickX => {
                const line = createLine({
                    id: `grid-v-${tickX}`,
                    x1: tickX,
                    y1: y,
                    x2: tickX,
                    y2: y + height,
                    strokeStyle: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    lineDash: this.lineDash,
                });

                this.group!.add(line);

                return line;
            });

            arrayForEach(vUpdates, ([tickX, line]) => {
                line.data = {
                    x1: tickX,
                    y1: y,
                    x2: tickX,
                    y2: y + height,
                } as Partial<LineState>;
            });

            this.verticalLines = [
                ...newLines,
                ...arrayMap(vUpdates, ([, line]) => line),
            ];
        }
    }

    public destroy() {
        if (this.group) {
            this.group.destroy();
        }
    }

}
