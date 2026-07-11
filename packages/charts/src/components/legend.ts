import type {
    ChartComponentOptions,
} from './_base';

import {
    ChartComponent,
} from './_base';

import type {
    LegendPosition,
} from '../core/options';

import type {
    ChartArea,
} from '../core/layout';

import type {
    ResolvedAnimation,
} from '../core/animation';

import type {
    Group,
    Rect,
    Text,
} from '@ripl/core';

import {
    Box,
    createGroup,
    createRect,
    createText,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** A single legend entry with id, label, color, and active state. */
export interface LegendItem {
    id: string;
    label: string;
    color: string;
    active?: boolean;
}

/** Options for constructing a legend component. */
export interface LegendOptions extends ChartComponentOptions {
    items: LegendItem[];
    position?: LegendPosition;
    font?: string;
    fontColor?: string;
    itemPadding?: number;
    highlight?: boolean;
    onToggle?: (item: LegendItem, active: boolean) => void;
    /** Called with an item id while its legend entry is hovered, and `null` when the pointer leaves. */
    onHighlight?: (id: string | null) => void;
}

const SWATCH_SIZE = 10;
const SWATCH_RADIUS = 2;
const ITEM_GAP_X = 16;
const ROW_GAP = 8;
const LABEL_GAP = 6;
const DEFAULT_FONT_SIZE = 11;
const DEFAULT_PADDING = 12;
const INACTIVE_COLOR = '#cccccc';
const INACTIVE_LABEL_COLOR = '#999999';

interface ItemPlacement {
    item: LegendItem;
    swatchX: number;
    swatchY: number;
    labelX: number;
    labelY: number;
}

interface LegendLayout {
    placements: ItemPlacement[];
    thickness: number;
}

/**
 * A chart legend rendering colour swatches and labels, supporting all four positions, item
 * reconciliation across renders (so toggling a series animates rather than rebuilding), and a
 * `measure`/`render` API that plugs into the shared layout system.
 */
export class Legend extends ChartComponent {

    private group?: Group;
    private items: LegendItem[] = [];
    private position: LegendPosition;
    private font: string;
    private fontColor: string;
    private itemPadding: number;
    private highlight: boolean;
    private onToggle?: (item: LegendItem, active: boolean) => void;
    private onHighlight?: (id: string | null) => void;
    private labelWidthCache = new Map<string, number>();

    constructor(options: LegendOptions) {
        super(options);

        this.items = options.items;
        this.position = options.position || 'top';
        this.font = options.font ?? `${DEFAULT_FONT_SIZE}px sans-serif`;
        this.fontColor = options.fontColor ?? '#333333';
        this.itemPadding = options.itemPadding ?? DEFAULT_PADDING;
        this.highlight = options.highlight ?? true;
        this.onToggle = options.onToggle;
        this.onHighlight = options.onHighlight;
    }

    private get isHorizontal() {
        return this.position === 'top' || this.position === 'bottom';
    }

    /** Updates the legend items, replacing the previous set. */
    public update(items: LegendItem[]) {
        this.items = items;
    }

    private get fontHeight(): number {
        const metrics = this.context.measureText('Mg', this.font);
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }

    private measureLabel(label: string): number {
        let width = this.labelWidthCache.get(label);

        if (width === undefined) {
            width = this.context.measureText(label, this.font).width;
            this.labelWidthCache.set(label, width);
        }

        return width;
    }

    private itemWidth(item: LegendItem): number {
        return SWATCH_SIZE + LABEL_GAP + this.measureLabel(item.label);
    }

    /**
     * Computes item placements within the given region and the band thickness required.
     * Horizontal legends wrap across the available width; vertical legends stack in a column.
     */
    private computeLayout(region: ChartArea): LegendLayout {
        const rowHeight = Math.max(SWATCH_SIZE, this.fontHeight);
        const placements: ItemPlacement[] = [];

        if (this.isHorizontal) {
            const available = region.width - this.itemPadding * 2;

            // Group items into rows based on the available width.
            const rows: LegendItem[][] = [[]];
            let rowWidth = 0;

            this.items.forEach(item => {
                const width = this.itemWidth(item);
                const currentRow = rows[rows.length - 1];
                const additional = currentRow.length === 0 ? width : width + ITEM_GAP_X;

                if (currentRow.length > 0 && rowWidth + additional > available) {
                    rows.push([item]);
                    rowWidth = width;
                } else {
                    currentRow.push(item);
                    rowWidth += additional;
                }
            });

            const thickness = rows.length * rowHeight + (rows.length - 1) * ROW_GAP + this.itemPadding * 2;
            let y = region.y + this.itemPadding;

            rows.forEach(row => {
                const totalWidth = row.reduce((sum, item, index) => {
                    return sum + this.itemWidth(item) + (index > 0 ? ITEM_GAP_X : 0);
                }, 0);

                let x = region.x + (region.width - totalWidth) / 2;

                row.forEach(item => {
                    placements.push({
                        item,
                        swatchX: x,
                        swatchY: y + (rowHeight - SWATCH_SIZE) / 2,
                        labelX: x + SWATCH_SIZE + LABEL_GAP,
                        labelY: y + rowHeight / 2,
                    });

                    x += this.itemWidth(item) + ITEM_GAP_X;
                });

                y += rowHeight + ROW_GAP;
            });

            return {
                placements,
                thickness,
            };
        }

        // Vertical: single column stacked top to bottom, centred within the region height.
        const maxItemWidth = this.items.reduce((max, item) => Math.max(max, this.itemWidth(item)), 0);
        const thickness = maxItemWidth + this.itemPadding * 2;
        const totalHeight = this.items.length * rowHeight + (this.items.length - 1) * ROW_GAP;

        let y = region.y + Math.max(this.itemPadding, (region.height - totalHeight) / 2);
        const x = region.x + this.itemPadding;

        this.items.forEach(item => {
            placements.push({
                item,
                swatchX: x,
                swatchY: y + (rowHeight - SWATCH_SIZE) / 2,
                labelX: x + SWATCH_SIZE + LABEL_GAP,
                labelY: y + rowHeight / 2,
            });

            y += rowHeight + ROW_GAP;
        });

        return {
            placements,
            thickness,
        };
    }

    /** Measures the band thickness the legend needs within the given available area. */
    public measure(area: ChartArea): number {
        if (this.items.length === 0) {
            return 0;
        }

        return this.computeLayout(area).thickness;
    }

    /**
     * Measures the legend's footprint for the given available area, returning a `Box` whose
     * `width`/`height` both equal the band thickness.
     *
     * @deprecated Prefer {@link Legend.measure}; retained for charts not yet on the layout system.
     */
    public getBoundingBox(availableWidth?: number): Box {
        const thickness = this.measure({
            x: 0,
            y: 0,
            width: availableWidth ?? 0,
            height: 0,
        });

        return new Box(0, 0, thickness, thickness);
    }

    /**
     * Renders (and reconciles) the legend. Accepts either a layout region (preferred) or the
     * legacy positional form `(x, y, width)` used by charts not yet migrated to the layout system.
     */
    public render(region: ChartArea, animation?: ResolvedAnimation): void;
    /** @deprecated Positional form retained for charts not yet on the layout system. */
    public render(x: number, y: number, width: number): void;
    public render(regionOrX: ChartArea | number, animationOrY?: ResolvedAnimation | number, width?: number): void {
        if (typeof regionOrX === 'number') {
            const x = regionOrX;
            const y = animationOrY as number;
            const legendWidth = width ?? 0;
            const thickness = this.measure({
                x,
                y,
                width: legendWidth,
                height: 0,
            });

            this.draw({
                x,
                y,
                width: legendWidth,
                height: thickness,
            });
            return;
        }

        this.draw(regionOrX, animationOrY as ResolvedAnimation | undefined);
    }

    private draw(region: ChartArea, animation?: ResolvedAnimation) {
        if (!this.group) {
            this.group = createGroup({
                id: 'legend',
                class: 'chart-legend',
                zIndex: 2000,
            });

            this.scene.add(this.group);
        }

        const { placements } = this.computeLayout(region);
        const placementById = new Map(placements.map(placement => [placement.item.id, placement]));

        const swatches = this.group.getElementsByType('rect') as Rect[];

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(placements, swatches, (placement, swatch) => swatch.id === `legend-swatch-${placement.item.id}`);

        // Exit removed items.
        exits.forEach(swatch => {
            const item = swatch.data as LegendItem;
            const label = this.group?.query(`#legend-label-${item.id}`) as Text | undefined;
            swatch.destroy();
            label?.destroy();
        });

        // Enter new items.
        entries.forEach(placement => {
            const { item } = placement;
            const isActive = item.active !== false;
            const restOpacity = isActive ? 1 : 0.5;

            const swatch = createRect({
                id: `legend-swatch-${item.id}`,
                x: placement.swatchX,
                y: placement.swatchY,
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                borderRadius: SWATCH_RADIUS,
                fill: isActive ? item.color : INACTIVE_COLOR,
                opacity: animation?.enabled ? 0 : restOpacity,
                data: item,
            });

            const label = createText({
                id: `legend-label-${item.id}`,
                x: placement.labelX,
                y: placement.labelY,
                content: item.label,
                fill: isActive ? this.fontColor : INACTIVE_LABEL_COLOR,
                font: this.font,
                textBaseline: 'middle',
                opacity: animation?.enabled ? 0 : 1,
                data: item,
            });

            if (this.highlight) {
                const toggle = () => this.toggleItem(item);
                swatch.on('click', toggle);
                label.on('click', toggle);

                if (this.onHighlight) {
                    const enter = () => this.onHighlight?.(item.id);
                    const leave = () => this.onHighlight?.(null);
                    swatch.on('mouseenter', enter);
                    swatch.on('mouseleave', leave);
                    label.on('mouseenter', enter);
                    label.on('mouseleave', leave);
                }
            }

            this.group!.add([swatch, label]);

            if (animation?.enabled) {
                this.renderer.transition([swatch, label], element => ({
                    duration: animation.duration,
                    ease: animation.ease,
                    state: { opacity: element.type === 'rect' && !isActive ? 0.5 : 1 },
                }));
            }
        });

        // Update existing items in place.
        updates.forEach(([placement, swatch]) => {
            const { item } = placement;
            const isActive = item.active !== false;
            const label = this.group?.query(`#legend-label-${item.id}`) as Text | undefined;

            swatch.data = item;
            swatch.fill = isActive ? item.color : INACTIVE_COLOR;

            if (label) {
                label.data = item;
                label.content = item.label;
                label.fill = isActive ? this.fontColor : INACTIVE_LABEL_COLOR;
            }

            const target = placementById.get(item.id)!;

            if (animation?.enabled) {
                this.renderer.transition(swatch, {
                    duration: animation.duration,
                    ease: animation.ease,
                    state: {
                        x: target.swatchX,
                        y: target.swatchY,
                        opacity: isActive ? 1 : 0.5,
                    },
                });

                if (label) {
                    this.renderer.transition(label, {
                        duration: animation.duration,
                        ease: animation.ease,
                        state: {
                            x: target.labelX,
                            y: target.labelY,
                            opacity: 1,
                        },
                    });
                }
            } else {
                swatch.x = target.swatchX;
                swatch.y = target.swatchY;
                swatch.opacity = isActive ? 1 : 0.5;

                if (label) {
                    label.x = target.labelX;
                    label.y = target.labelY;
                }
            }
        });
    }

    private toggleItem(item: LegendItem) {
        const newActive = item.active === false;
        item.active = newActive;
        this.onToggle?.(item, newActive);
    }

    public destroy() {
        if (this.group) {
            this.scene.remove(this.group);
            this.group = undefined;
        }
    }

}
