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

import {
    SPACING,
} from '../constants/spacing';

import type {
    ResolvedAnimation,
} from '../core/animation';

import {
    exitElement,
} from '../core/animation';

import type {
    Group,
    Rect,
    Text,
} from '@ripl/core';

import {
    createGroup,
    createRect,
    createText,
} from '@ripl/core';

import {
    arrayJoin,
    stringUniqueId,
} from '@ripl/utilities';

/** A single legend entry with id, label, color, and active state. */
export interface LegendItem {
    /** Unique id linking the entry to its series/segment (used for highlight and toggling). */
    id: string;
    /** Text label shown next to the color swatch. */
    label: string;
    /** Swatch color, typically the series/segment color. */
    color: string;
    /** Whether the entry is active; inactive entries render dimmed. Defaults to `true`. */
    active?: boolean;
}

/** Options for constructing a legend component. */
export interface LegendOptions extends ChartComponentOptions {
    /** The legend entries to render. */
    items: LegendItem[];
    /** Which side of the chart the legend occupies. Defaults to `top`. */
    position?: LegendPosition;
    /** CSS font shorthand for the entry labels. */
    font?: string;
    /** Color of the entry labels. */
    fontColor?: string;
    /** Padding around the legend within its band, in pixels. */
    itemPadding?: number;
    /** Whether entries are interactive (hover-highlight and click-to-toggle). Defaults to `true`. */
    highlight?: boolean;
    /** Called when a legend entry is clicked, with the item and its new active state. */
    onToggle?: (item: LegendItem, active: boolean) => void;
    /** Called with an item id while its legend entry is hovered, and `null` when the pointer leaves. */
    onHighlight?: (id: string | null) => void;
}

/** Smallest a swatch may be. It otherwise fills its row, so it scales with the label beside it. */
const MIN_SWATCH_SIZE = 10;
/** Corner radius as a fraction of the swatch, so a larger swatch keeps the same rounded look. */
const SWATCH_RADIUS_RATIO = 0.2;
const ITEM_GAP_X = SPACING.md;
const ROW_GAP = SPACING.sm;
const LABEL_GAP = SPACING.sm;
const DEFAULT_FONT_SIZE = 11;
const DEFAULT_PADDING = SPACING.md;
const INACTIVE_COLOR = '#cccccc';
const INACTIVE_LABEL_COLOR = '#999999';

interface ItemPlacement {
    item: LegendItem;
    swatchSize: number;
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
 * A chart legend rendering color swatches and labels, supporting all four positions, item
 * reconciliation across renders (so toggling a series animates rather than rebuilding), and a
 * `measure`/`render` API that plugs into the shared layout system.
 */
export class Legend extends ChartComponent {

    private _group?: Group;
    private _items: LegendItem[] = [];
    private _position: LegendPosition;
    private _font: string;
    private _fontColor: string;
    private _itemPadding: number;
    private _highlight: boolean;
    private _onToggle?: (item: LegendItem, active: boolean) => void;
    private _onHighlight?: (id: string | null) => void;
    private _labelWidthCache = new Map<string, number>();

    constructor(options: LegendOptions) {
        super(options);

        this._items = options.items;
        this._position = options.position || 'top';
        this._font = options.font ?? `${DEFAULT_FONT_SIZE}px sans-serif`;
        this._fontColor = options.fontColor ?? '#333333';
        this._itemPadding = options.itemPadding ?? DEFAULT_PADDING;
        this._highlight = options.highlight ?? true;
        this._onToggle = options.onToggle;
        this._onHighlight = options.onHighlight;
    }

    private get _isHorizontal() {
        return this._position === 'top' || this._position === 'bottom';
    }

    /**
     * Reconfigures the legend in place (position, label styling, and interactivity) so
     * `chart.update({ legend })` restyles and relocates the live legend without recreating it.
     * A font change invalidates the label measurement cache.
     *
     * @param options - The options to apply; omitted properties keep their current values.
     */
    public setOptions(options: Pick<LegendOptions, 'position' | 'font' | 'fontColor' | 'itemPadding' | 'highlight'>): void {
        if (options.font !== undefined && options.font !== this._font) {
            this._labelWidthCache.clear();
        }

        this._position = options.position ?? this._position;
        this._font = options.font ?? this._font;
        this._fontColor = options.fontColor ?? this._fontColor;
        this._itemPadding = options.itemPadding ?? this._itemPadding;
        this._highlight = options.highlight ?? this._highlight;
    }

    /** Updates the legend items, replacing the previous set. */
    public update(items: LegendItem[]) {
        this._items = items;
    }

    private get _fontHeight(): number {
        const metrics = this.context.measureText('Mg', this._font);
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }

    private _measureLabel(label: string): number {
        let width = this._labelWidthCache.get(label);

        if (width === undefined) {
            width = this.context.measureText(label, this._font).width;
            this._labelWidthCache.set(label, width);
        }

        return width;
    }

    /**
     * The swatch fills its row, so it stays square against the label rather than a fixed size that
     * a backend's own resolution can make far larger or far smaller than the text beside it.
     */
    private get _swatchSize(): number {
        return Math.max(MIN_SWATCH_SIZE, this._fontHeight);
    }

    private _itemWidth(item: LegendItem): number {
        return this._swatchSize + LABEL_GAP + this._measureLabel(item.label);
    }

    /**
     * Computes item placements within the given region and the band thickness required.
     * Horizontal legends wrap across the available width; vertical legends stack in a column.
     */
    private _computeLayout(region: ChartArea): LegendLayout {
        const swatchSize = this._swatchSize;
        const rowHeight = swatchSize;
        const placements: ItemPlacement[] = [];

        if (this._isHorizontal) {
            const available = region.width - this._itemPadding * 2;

            // Group items into rows based on the available width.
            const rows: LegendItem[][] = [[]];
            let rowWidth = 0;

            this._items.forEach(item => {
                const width = this._itemWidth(item);
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

            const thickness = rows.length * rowHeight + (rows.length - 1) * ROW_GAP + this._itemPadding * 2;
            let y = region.y + this._itemPadding;

            rows.forEach(row => {
                const totalWidth = row.reduce((sum, item, index) => {
                    return sum + this._itemWidth(item) + (index > 0 ? ITEM_GAP_X : 0);
                }, 0);

                let x = region.x + (region.width - totalWidth) / 2;

                row.forEach(item => {
                    placements.push({
                        item,
                        swatchX: x,
                        swatchSize,
                        swatchY: y + (rowHeight - swatchSize) / 2,
                        labelX: x + swatchSize + LABEL_GAP,
                        labelY: y + rowHeight / 2,
                    });

                    x += this._itemWidth(item) + ITEM_GAP_X;
                });

                y += rowHeight + ROW_GAP;
            });

            return {
                placements,
                thickness,
            };
        }

        // Vertical: single column stacked top to bottom, centered within the region height.
        const maxItemWidth = this._items.reduce((max, item) => Math.max(max, this._itemWidth(item)), 0);
        const thickness = maxItemWidth + this._itemPadding * 2;
        const totalHeight = this._items.length * rowHeight + (this._items.length - 1) * ROW_GAP;

        let y = region.y + Math.max(this._itemPadding, (region.height - totalHeight) / 2);
        const x = region.x + this._itemPadding;

        this._items.forEach(item => {
            placements.push({
                item,
                swatchX: x,
                swatchSize,
                swatchY: y + (rowHeight - swatchSize) / 2,
                labelX: x + swatchSize + LABEL_GAP,
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
        if (this._items.length === 0) {
            return 0;
        }

        return this._computeLayout(area).thickness;
    }

    /** Renders (and reconciles) the legend within the given layout region. */
    public render(region: ChartArea, animation?: ResolvedAnimation): void {
        this._draw(region, animation);
    }

    private _draw(region: ChartArea, animation?: ResolvedAnimation) {
        if (!this._group) {
            this._group = createGroup({
                id: 'legend',
                class: 'chart-legend',
                zIndex: 2000,
            });

            this.scene.add(this._group);
        }

        const { placements } = this._computeLayout(region);
        const placementById = new Map(placements.map(placement => [placement.item.id, placement]));

        const swatches = this._group.getElementsByType('rect') as Rect[];

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(placements, swatches, (placement, swatch) => swatch.id === `legend-swatch-${placement.item.id}`);

        // Exit removed items, fading them out to match how entries fade in.
        exits.forEach(swatch => {
            const item = swatch.data as LegendItem;
            const label = this._group?.query(`#legend-label-${item.id}`) as Text | undefined;

            if (!animation?.enabled || animation.duration <= 0) {
                swatch.destroy();
                label?.destroy();
                return;
            }

            // Retag first so a re-entering item of the same id can't collide with the fading pair.
            swatch.id = `${swatch.id}:exit:${stringUniqueId()}`;
            void exitElement(this.renderer, swatch, animation);

            if (label) {
                label.id = `${label.id}:exit:${stringUniqueId()}`;
                void exitElement(this.renderer, label, animation);
            }
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
                width: placement.swatchSize,
                height: placement.swatchSize,
                borderRadius: placement.swatchSize * SWATCH_RADIUS_RATIO,
                fill: isActive ? item.color : INACTIVE_COLOR,
                opacity: animation?.enabled ? 0 : restOpacity,
                data: item,
            });

            const label = createText({
                id: `legend-label-${item.id}`,
                x: placement.labelX,
                y: placement.labelY,
                content: item.label,
                fill: isActive ? this._fontColor : INACTIVE_LABEL_COLOR,
                font: this._font,
                textBaseline: 'middle',
                opacity: animation?.enabled ? 0 : 1,
                data: item,
            });

            if (this._highlight) {
                const toggle = () => this._toggleItem(item);
                swatch.on('click', toggle);
                label.on('click', toggle);

                if (this._onHighlight) {
                    const enter = () => this._onHighlight?.(item.id);
                    const leave = () => this._onHighlight?.(null);
                    swatch.on('mouseenter', enter);
                    swatch.on('mouseleave', leave);
                    label.on('mouseenter', enter);
                    label.on('mouseleave', leave);
                }
            }

            this._group!.add([swatch, label]);

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
            const label = this._group?.query(`#legend-label-${item.id}`) as Text | undefined;

            swatch.data = item;
            swatch.fill = isActive ? item.color : INACTIVE_COLOR;

            if (label) {
                label.data = item;
                label.content = item.label;
                label.fill = isActive ? this._fontColor : INACTIVE_LABEL_COLOR;
            }

            const target = placementById.get(item.id)!;

            if (animation?.enabled) {
                // Size is tweened, not assigned: it tracks the row, so a font or backend change
                // between renders resizes an existing swatch rather than leaving it at its old size.
                this.renderer.transition(swatch, {
                    duration: animation.duration,
                    ease: animation.ease,
                    state: {
                        x: target.swatchX,
                        y: target.swatchY,
                        width: target.swatchSize,
                        height: target.swatchSize,
                        borderRadius: target.swatchSize * SWATCH_RADIUS_RATIO,
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
                swatch.width = target.swatchSize;
                swatch.height = target.swatchSize;
                swatch.borderRadius = target.swatchSize * SWATCH_RADIUS_RATIO;
                swatch.opacity = isActive ? 1 : 0.5;

                if (label) {
                    label.x = target.labelX;
                    label.y = target.labelY;
                }
            }
        });
    }

    private _toggleItem(item: LegendItem) {
        const newActive = item.active === false;
        item.active = newActive;
        this._onToggle?.(item, newActive);
    }

    /** Removes the legend's elements from the scene. */
    public destroy() {
        if (this._group) {
            this.scene.remove(this._group);
            this._group = undefined;
        }
    }

}
