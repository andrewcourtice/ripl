import {
    fillPolygon,
} from './algorithms';

import type {
    PixelCallback,
    Vertex,
} from './algorithms';

/**
 * A raster-space stencil restricting where a context may draw.
 *
 * A mask is immutable once built, so pushing one onto the context's state stack copies a reference
 * rather than a buffer.
 */
export interface ClipMask {
    /**
     * Whether the given raster pixel is inside the clip region.
     *
     * @param x - X coordinate in raster space.
     * @param y - Y coordinate in raster space.
     * @returns `true` when the pixel may be drawn.
     */
    contains(x: number, y: number): boolean;
}

/**
 * Builds a clip mask covering the interior of the given contours, intersected with an existing mask.
 *
 * Intersection rather than replacement is what makes nested clips behave the way they do on canvas
 * and SVG: an inner clip narrows the outer one, it never widens it.
 *
 * @param contours - The clip geometry, in raster space.
 * @param width - Width of the raster grid.
 * @param height - Height of the raster grid.
 * @param previous - The mask already in force, if any.
 * @returns The intersected mask.
 */
export function createClipMask(contours: Vertex[][], width: number, height: number, previous?: ClipMask | null): ClipMask {
    const bits = new Uint8Array(Math.ceil(Math.max(0, width * height) / 8));

    fillPolygon(contours, (x, y) => {
        const px = Math.round(x);
        const py = Math.round(y);

        if (px < 0 || py < 0 || px >= width || py >= height) {
            return;
        }

        if (previous && !previous.contains(px, py)) {
            return;
        }

        const index = py * width + px;

        bits[index >> 3] |= 1 << (index & 7);
    });

    return {
        contains(x, y) {
            const px = Math.round(x);
            const py = Math.round(y);

            if (px < 0 || py < 0 || px >= width || py >= height) {
                return false;
            }

            const index = py * width + px;

            return !!(bits[index >> 3] & (1 << (index & 7)));
        },
    };
}

/**
 * Gates a plot callback on a clip mask, dropping every pixel outside it.
 *
 * @param mask - The mask in force, or `null` when nothing is clipped.
 * @param plot - The callback to gate.
 * @returns A gated callback, or `plot` itself when there is no mask.
 */
export function clipPixels(mask: ClipMask | null, plot: PixelCallback): PixelCallback {
    if (!mask) {
        return plot;
    }

    return (x, y) => {
        if (mask.contains(x, y)) {
            plot(x, y);
        }
    };
}
