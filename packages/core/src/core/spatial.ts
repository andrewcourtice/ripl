import type {
    Box,
} from '../math';

import type {
    RenderElement,
} from '../context';

/** Default grid cell size in pixels. Chosen so typical small marks (points, bars) land in one cell. */
const DEFAULT_CELL_SIZE = 64;

/**
 * A uniform-grid spatial index over element bounding boxes, used to shortlist hit-test candidates
 * before the expensive per-element path test. Elements are bucketed into every cell their box
 * overlaps; a point query returns only the elements sharing its cell, turning an O(n) scan into an
 * O(elements-per-cell) one. Elements without a box fall into a "loose" list that is always returned.
 *
 * Memory is bounded by the number of elements times the cells each spans — one grid per scene, not
 * per element — and the whole index is discarded and rebuilt when the render buffer changes.
 */
export class SpatialIndex {

    private readonly _cellSize: number;
    private readonly _columns = new Map<number, Map<number, RenderElement[]>>();

    private _loose: RenderElement[] = [];

    constructor(cellSize: number = DEFAULT_CELL_SIZE) {
        this._cellSize = cellSize > 0 ? cellSize : DEFAULT_CELL_SIZE;
    }

    private _bucket(column: number, row: number): RenderElement[] {
        let rows = this._columns.get(column);

        if (!rows) {
            rows = new Map();
            this._columns.set(column, rows);
        }

        let bucket = rows.get(row);

        if (!bucket) {
            bucket = [];
            rows.set(row, bucket);
        }

        return bucket;
    }

    /**
     * Inserts an element under every cell its box overlaps. Boxless elements go into the loose list.
     * `padding` expands the box on every side — pass the stroke half-width so points that hit a
     * shape's outline (which extends beyond its geometry box) are never missed near a cell boundary.
     */
    public insert(element: RenderElement, box?: Box, padding: number = 0): void {
        if (!box) {
            this._loose.push(element);
            return;
        }

        const size = this._cellSize;
        const minColumn = Math.floor((box.left - padding) / size);
        const maxColumn = Math.floor((box.right + padding) / size);
        const minRow = Math.floor((box.top - padding) / size);
        const maxRow = Math.floor((box.bottom + padding) / size);

        for (let column = minColumn; column <= maxColumn; column++) {
            for (let row = minRow; row <= maxRow; row++) {
                this._bucket(column, row).push(element);
            }
        }
    }

    /** Returns the elements whose box overlaps the cell containing the point, plus any loose elements. */
    public query(x: number, y: number): RenderElement[] {
        const size = this._cellSize;
        const bucket = this._columns.get(Math.floor(x / size))?.get(Math.floor(y / size));

        if (!bucket) {
            return this._loose.length ? this._loose.slice() : [];
        }

        return this._loose.length ? bucket.concat(this._loose) : bucket;
    }

    /** Empties the index for reuse. */
    public clear(): void {
        this._columns.clear();
        this._loose = [];
    }

}

/** Factory function that creates a new {@link SpatialIndex}. */
export function createSpatialIndex(cellSize?: number): SpatialIndex {
    return new SpatialIndex(cellSize);
}
