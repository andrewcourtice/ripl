import {
    Box,
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
const PADDING = 16;

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

    public getBoundingBox(availableWidth?: number): Box {
        const isVertical = this.position === 'left' || this.position === 'right';

        if (isVertical) {
            const height = this.items.length * (SWATCH_SIZE + ITEM_GAP) - ITEM_GAP + PADDING * 2;
            return new Box(0, 0, height, 120);
        }

        const rows = this.getRowCount(availableWidth);
        const rowHeight = SWATCH_SIZE + ITEM_GAP;
        const height = rows * rowHeight - ITEM_GAP + PADDING * 2;

        return new Box(0, 0, height, 0);
    }

    private getRowCount(width?: number): number {
        if (!width) {
            return 1;
        }

        let rows = 1;
        let offsetX = 0;

        arrayForEach(this.items, (item) => {
            const labelWidth = this.context.measureText(item.label, `${FONT_SIZE}px sans-serif`).width;
            const itemWidth = SWATCH_SIZE + LABEL_GAP + labelWidth + ITEM_GAP;

            if (offsetX + itemWidth > width && offsetX > 0) {
                rows++;
                offsetX = 0;
            }

            offsetX += itemWidth;
        });

        return rows;
    }

    public update(items: LegendItem[]) {
        this.items = items;
    }

    private measureLabelWidths(): Map<string, number> {
        const widths = new Map<string, number>();
        const font = `${FONT_SIZE}px sans-serif`;

        arrayForEach(this.items, (item) => {
            if (!widths.has(item.label)) {
                widths.set(item.label, this.context.measureText(item.label, font).width);
            }
        });

        return widths;
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
        const labelWidths = this.measureLabelWidths();

        let offsetX = x;
        let offsetY = y + PADDING;

        arrayForEach(this.items, (item) => {
            const isActive = item.active !== false;
            const labelWidth = labelWidths.get(item.label) ?? 0;

            if (isHorizontal) {
                const itemWidth = SWATCH_SIZE + LABEL_GAP + labelWidth + ITEM_GAP;

                if (offsetX + itemWidth > x + width && offsetX > x) {
                    offsetX = x;
                    offsetY += SWATCH_SIZE + ITEM_GAP;
                }
            }

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
                offsetX += SWATCH_SIZE + LABEL_GAP + labelWidth + ITEM_GAP;
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
