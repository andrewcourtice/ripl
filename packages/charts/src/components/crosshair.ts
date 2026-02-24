import {
    createGroup,
    createLine,
    Group,
    Line,
} from '@ripl/core';

import {
    Disposable,
} from '@ripl/utilities';

import {
    ChartComponent,
    ChartComponentOptions,
} from './_base';

export interface CrosshairOptions extends ChartComponentOptions {
    vertical?: boolean;
    horizontal?: boolean;
    strokeStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
}

const DEFAULT_STROKE = '#94a3b8';
const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LINE_DASH = [4, 4];

export class Crosshair extends ChartComponent {

    private group?: Group;
    private verticalLine?: Line;
    private horizontalLine?: Line;
    private showVertical: boolean;
    private showHorizontal: boolean;
    private strokeStyle: string;
    private lineWidth: number;
    private lineDash: number[];

    private disposables: Disposable[] = [];

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
        this.strokeStyle = options.strokeStyle ?? DEFAULT_STROKE;
        this.lineWidth = options.lineWidth ?? DEFAULT_LINE_WIDTH;
        this.lineDash = options.lineDash ?? DEFAULT_LINE_DASH;
    }

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
                strokeStyle: this.strokeStyle,
                lineWidth: this.lineWidth,
                lineDash: this.lineDash,
                globalAlpha: 0,
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
                strokeStyle: this.strokeStyle,
                lineWidth: this.lineWidth,
                lineDash: this.lineDash,
                globalAlpha: 0,
            });

            this.group.add(this.horizontalLine);
        }

        this.scene.add(this.group);

        this.disposables.forEach(d => d.dispose());
        this.disposables = [
            this.scene.on('mousemove', (event) => {
                const { x, y } = event.data;
                this.show(x, y);
            }),
            this.scene.on('mouseleave', () => {
                this.hide();
            }),
        ];
    }

    public show(mouseX: number, mouseY: number) {
        const { x, y, width, height } = this.bounds;

        if (mouseX < x || mouseX > x + width || mouseY < y || mouseY > y + height) {
            this.hide();
            return;
        }

        if (this.verticalLine) {
            this.verticalLine.x1 = mouseX;
            this.verticalLine.x2 = mouseX;
            this.verticalLine.globalAlpha = 1;
        }

        if (this.horizontalLine) {
            this.horizontalLine.y1 = mouseY;
            this.horizontalLine.y2 = mouseY;
            this.horizontalLine.globalAlpha = 1;
        }
    }

    public hide() {
        if (this.verticalLine) {
            this.verticalLine.globalAlpha = 0;
        }

        if (this.horizontalLine) {
            this.horizontalLine.globalAlpha = 0;
        }
    }

    public destroy() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        if (this.group) {
            this.scene.remove(this.group);
        }
    }

}
