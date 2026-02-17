import {
    createGroup,
    createRect,
    createText,
    Group,
} from '@ripl/core';

import {
    arrayForEach,
} from '@ripl/utilities';

import {
    ChartComponent,
    ChartComponentOptions,
} from './_base';

import type {
    LegendPosition,
} from '../core/chart';

export interface LegendItem {
    id: string;
    label: string;
    color: string;
    active?: boolean;
}

export interface LegendOptions extends ChartComponentOptions {
    items: LegendItem[];
    position?: LegendPosition;
    onToggle?: (item: LegendItem, active: boolean) => void;
}

const SWATCH_SIZE = 10;
const SWATCH_RADIUS = 2;
const ITEM_GAP = 16;
const LABEL_GAP = 6;
const FONT_SIZE = 11;
const PADDING = 8;

export class Legend extends ChartComponent {

    private group?: Group;
    private items: LegendItem[] = [];
    private position: LegendPosition = 'top';
    private onToggle?: (item: LegendItem, active: boolean) => void;

    constructor(options: LegendOptions) {
        super(options);

        this.items = options.items;
        this.position = options.position || 'top';
        this.onToggle = options.onToggle;
    }

    public getHeight(): number {
        if (this.position === 'left' || this.position === 'right') {
            return this.items.length * (SWATCH_SIZE + ITEM_GAP) + PADDING * 2;
        }

        return SWATCH_SIZE + PADDING * 2 + FONT_SIZE;
    }

    public getWidth(): number {
        if (this.position === 'left' || this.position === 'right') {
            return 120;
        }

        return 0;
    }

    public update(items: LegendItem[]) {
        this.items = items;
    }

    public async render(x: number, y: number, width: number) {
        if (this.group) {
            this.group.clear();
            this.scene.remove(this.group);
        }

        this.group = createGroup({
            id: 'legend',
            class: 'chart-legend',
            zIndex: 2000,
        });

        const isHorizontal = this.position === 'top' || this.position === 'bottom';

        let offsetX = x;
        let offsetY = y + PADDING;

        arrayForEach(this.items, (item) => {
            const isActive = item.active !== false;

            const swatch = createRect({
                id: `legend-swatch-${item.id}`,
                x: offsetX,
                y: offsetY,
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                borderRadius: SWATCH_RADIUS,
                fillStyle: isActive ? item.color : '#ccc',
                globalAlpha: isActive ? 1 : 0.4,
            });

            const label = createText({
                id: `legend-label-${item.id}`,
                x: offsetX + SWATCH_SIZE + LABEL_GAP,
                y: offsetY + SWATCH_SIZE / 2,
                content: item.label,
                fillStyle: isActive ? '#333' : '#999',
                font: `${FONT_SIZE}px sans-serif`,
                textBaseline: 'middle',
            });

            swatch.data = item;
            label.data = item;

            const toggleHandler = () => {
                const newActive = item.active === false;
                item.active = newActive;
                this.onToggle?.(item, newActive);
            };

            swatch.on('click', toggleHandler);
            label.on('click', toggleHandler);

            this.group!.add([swatch, label]);

            if (isHorizontal) {
                this.context.font = `${FONT_SIZE}px sans-serif`;
                const labelWidth = this.context.measureText(item.label).width;
                offsetX += SWATCH_SIZE + LABEL_GAP + labelWidth + ITEM_GAP;

                if (offsetX > x + width) {
                    offsetX = x;
                    offsetY += SWATCH_SIZE + ITEM_GAP;
                }
            } else {
                offsetY += SWATCH_SIZE + ITEM_GAP;
            }
        });

        this.scene.add(this.group);
    }

    public destroy() {
        if (this.group) {
            this.scene.remove(this.group);
        }
    }

}
