import {
    Layout,
} from './layout';

import type {
    LayoutOptions,
    LayoutState,
} from './layout';

import type {
    FlexAlign,
} from './flex';

import type {
    Element,
} from '../core';

import type {
    Box,
} from '../math';

import {
    typeIsArray,
    typeIsNumber,
} from '@ripl/utilities';

/** State for a grid layout container. */
export interface GridState extends LayoutState {
    columns?: number | number[];
    rows?: number | number[];
    columnGap?: number;
    rowGap?: number;
    justifyItems?: FlexAlign;
    alignItems?: FlexAlign;
}

interface GridCell {
    child: Element;
    box: Box;
    width: number;
    height: number;
}

const EPSILON = 0.01;

/** A grid-style layout container that arranges children into rows and columns of sized tracks. */
export class Grid extends Layout<GridState> {

    public get columns(): number | number[] | undefined {
        return this.state.columns;
    }

    public set columns(value: number | number[] | undefined) {
        this.setStateValue('columns', value as GridState['columns']);
    }

    public get rows(): number | number[] | undefined {
        return this.state.rows;
    }

    public set rows(value: number | number[] | undefined) {
        this.setStateValue('rows', value as GridState['rows']);
    }

    public get columnGap(): number {
        return this.state.columnGap ?? this.gap;
    }

    public set columnGap(value: number) {
        this.setStateValue('columnGap', value as GridState['columnGap']);
    }

    public get rowGap(): number {
        return this.state.rowGap ?? this.gap;
    }

    public set rowGap(value: number) {
        this.setStateValue('rowGap', value as GridState['rowGap']);
    }

    public get justifyItems(): FlexAlign {
        return this.state.justifyItems ?? 'start';
    }

    public set justifyItems(value: FlexAlign) {
        this.setStateValue('justifyItems', value);
    }

    public get alignItems(): FlexAlign {
        return this.state.alignItems ?? 'start';
    }

    public set alignItems(value: FlexAlign) {
        this.setStateValue('alignItems', value);
    }

    constructor(options: LayoutOptions<GridState> = {
        x: 0,
        y: 0,
    }) {
        super('grid', options);
    }

    private columnCount(): number {
        const columns = this.columns;

        if (typeIsArray(columns)) {
            return Math.max(1, columns.length);
        }

        if (typeIsNumber(columns)) {
            return Math.max(1, columns);
        }

        return 1;
    }

    private rowCount(childCount: number, columnCount: number): number {
        const rows = this.rows;

        if (typeIsArray(rows)) {
            return rows.length;
        }

        if (typeIsNumber(rows)) {
            return rows;
        }

        return Math.ceil(childCount / columnCount);
    }

    private cellAt(cells: (GridCell | undefined)[], row: number, column: number, columnCount: number): GridCell | undefined {
        return cells[row * columnCount + column];
    }

    private resolveTracks(
        explicit: number | number[] | undefined,
        count: number,
        available: number | undefined,
        gap: number,
        measure: (index: number) => number
    ): number[] {
        if (typeIsArray(explicit)) {
            return Array.from({ length: count }, (_, index) => explicit[index] ?? 0);
        }

        if (typeIsNumber(explicit) && available !== undefined) {
            const size = Math.max(0, (available - gap * Math.max(0, count - 1)) / count);
            return Array.from({ length: count }, () => size);
        }

        return Array.from({ length: count }, (_, index) => measure(index));
    }

    private alignOffset(itemSize: number, trackSize: number, align: FlexAlign): number {
        if (align === 'center') {
            return (trackSize - itemSize) / 2;
        }

        if (align === 'end') {
            return trackSize - itemSize;
        }

        return 0;
    }

    private applyStretch(child: Element, property: 'width' | 'height', size: number): void {
        const target = child as unknown as Record<string, unknown>;

        if (typeof target[property] !== 'number' || Math.abs((target[property] as number) - size) < EPSILON) {
            return;
        }

        target[property] = size;
    }

    private placeCell(cell: GridCell, cellX: number, cellY: number, columnWidth: number, rowHeight: number): void {
        const justify = cell.child.layout?.justifySelf ?? this.justifyItems;
        const align = cell.child.layout?.alignSelf ?? this.alignItems;

        let dx = 0;
        let dy = 0;

        if (justify === 'stretch') {
            this.applyStretch(cell.child, 'width', columnWidth);
        } else {
            dx = this.alignOffset(cell.width, columnWidth, justify);
        }

        if (align === 'stretch') {
            this.applyStretch(cell.child, 'height', rowHeight);
        } else {
            dy = this.alignOffset(cell.height, rowHeight, align);
        }

        this.place(cell.child, cellX + dx, cellY + dy, cell.box);
    }

    protected isRelayoutKey(key: string): boolean {
        return super.isRelayoutKey(key)
            || key === 'columns'
            || key === 'rows'
            || key === 'columnGap'
            || key === 'rowGap'
            || key === 'justifyItems'
            || key === 'alignItems';
    }

    protected relayout(): void {
        const children = this.orderedChildren();
        const padding = this.resolvePadding();
        const ox = this.x + padding.left;
        const oy = this.y + padding.top;

        const columnGap = this.columnGap;
        const rowGap = this.rowGap;

        const columnCount = this.columnCount();
        const rowCount = this.rowCount(children.length, columnCount);

        const cells: (GridCell | undefined)[] = children.map(child => {
            // Measure once; `place()` reuses this box (its top-left is stable under resize).
            const box = this.measureChild(child);

            return {
                child,
                box,
                width: box.width,
                height: box.height,
            };
        });

        const availWidth = this.width === undefined ? undefined : this.width - padding.left - padding.right;
        const availHeight = this.height === undefined ? undefined : this.height - padding.top - padding.bottom;

        const columnWidths = this.resolveTracks(this.columns, columnCount, availWidth, columnGap, column => {
            return this.maxTrackSize(cells, rowCount, columnCount, (row, col) => col === column, cell => cell.width);
        });

        const rowHeights = this.resolveTracks(this.rows, rowCount, availHeight, rowGap, row => {
            return this.maxTrackSize(cells, rowCount, columnCount, (r) => r === row, cell => cell.height);
        });

        this.placeRows(cells, columnWidths, rowHeights, columnCount, rowCount, ox, oy, columnGap, rowGap);

        const contentWidth = columnWidths.reduce((sum, value) => sum + value, 0) + columnGap * Math.max(0, columnCount - 1);
        const contentHeight = rowHeights.reduce((sum, value) => sum + value, 0) + rowGap * Math.max(0, rowCount - 1);

        this.setContentSize(
            contentWidth + padding.left + padding.right,
            contentHeight + padding.top + padding.bottom
        );
    }

    private maxTrackSize(
        cells: (GridCell | undefined)[],
        rowCount: number,
        columnCount: number,
        include: (row: number, column: number) => boolean,
        size: (cell: GridCell) => number
    ): number {
        let max = 0;

        cells.forEach((cell, index) => {
            const row = Math.floor(index / columnCount);
            const column = index % columnCount;

            if (cell && row < rowCount && include(row, column)) {
                max = Math.max(max, size(cell));
            }
        });

        return max;
    }

    private placeRows(
        cells: (GridCell | undefined)[],
        columnWidths: number[],
        rowHeights: number[],
        columnCount: number,
        rowCount: number,
        ox: number,
        oy: number,
        columnGap: number,
        rowGap: number
    ): void {
        let cellY = oy;

        for (let row = 0; row < rowCount; row++) {
            this.placeRow(cells, row, columnWidths, rowHeights[row], columnCount, ox, cellY, columnGap);
            cellY += rowHeights[row] + rowGap;
        }
    }

    private placeRow(
        cells: (GridCell | undefined)[],
        row: number,
        columnWidths: number[],
        rowHeight: number,
        columnCount: number,
        ox: number,
        cellY: number,
        columnGap: number
    ): void {
        let cellX = ox;

        for (let column = 0; column < columnCount; column++) {
            const cell = this.cellAt(cells, row, column, columnCount);

            if (cell) {
                this.placeCell(cell, cellX, cellY, columnWidths[column], rowHeight);
            }

            cellX += columnWidths[column] + columnGap;
        }
    }

}

/** Factory function that creates a new `Grid` container. */
export function createGrid(...options: ConstructorParameters<typeof Grid>) {
    return new Grid(...options);
}

/** Type guard that checks whether a value is a `Grid` container. */
export function elementIsGrid(value: unknown): value is Grid {
    return value instanceof Grid;
}
