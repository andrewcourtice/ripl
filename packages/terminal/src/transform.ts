import {
    matrixApplyToPoint,
    matrixIdentity,
    matrixMultiply,
} from '@ripl/core';

import type {
    Matrix,
} from '@ripl/core';

import type {
    Vertex,
} from './algorithms';

/**
 * The mapping from the logical space a scene is authored in onto the raster grid, composing the
 * context's letterbox with whatever transform is current.
 *
 * Every drawing path goes through one of these rather than reading `scaleX`/`scaleY` directly: a
 * separable per-axis scale cannot express rotation or skew, which is why transforms used to be
 * discarded by this backend.
 */
export interface TerminalTransform {
    /** The composite logical-to-raster matrix. */
    readonly matrix: Matrix;
    /** Whether the mapping is free of rotation and skew, so axis-aligned fast paths stay exact. */
    readonly axisAligned: boolean;
    /** Whether the mapping scales both axes equally, so a circle stays a circle. */
    readonly uniform: boolean;
    /**
     * Maps a point from logical space into raster space.
     *
     * @param x - X coordinate in logical space.
     * @param y - Y coordinate in logical space.
     * @returns The corresponding raster-space vertex.
     */
    point(x: number, y: number): Vertex;
    /**
     * Maps a logical length into raster space.
     *
     * @param value - The length in logical units.
     * @returns The length in raster pixels.
     */
    scalar(value: number): number;
}

/**
 * Builds the letterbox matrix a terminal context maps logical coordinates through: a uniform scale
 * plus the centring offset that fits the logical space into the character grid.
 *
 * @param scale - The uniform logical-to-raster scale factor.
 * @param offsetX - Horizontal centring offset, in raster pixels.
 * @param offsetY - Vertical centring offset, in raster pixels.
 * @returns The letterbox matrix.
 */
export function letterboxMatrix(scale: number, offsetX: number, offsetY: number): Matrix {
    return [scale, 0, 0, scale, offsetX, offsetY];
}

/**
 * Composes a letterbox with a transform and wraps the result as a {@link TerminalTransform}.
 *
 * @param letterbox - The context's logical-to-raster letterbox.
 * @param transform - The current transform, in logical space. Defaults to the identity.
 * @returns The composite mapping used by every drawing path.
 */
export function createTerminalTransform(letterbox: Matrix, transform: Matrix = matrixIdentity()): TerminalTransform {
    const matrix = matrixMultiply(letterbox, transform);
    const [scaleX, skewY, skewX, scaleY] = matrix;

    // A round pen is genuinely elliptical under a non-uniform scale, so a single width has to
    // approximate it; the geometric mean of the scale factors is the standard choice.
    const magnitude = Math.sqrt(Math.abs(scaleX * scaleY - skewY * skewX));

    return {
        matrix,
        axisAligned: skewY === 0 && skewX === 0,
        uniform: skewY === 0 && skewX === 0 && Math.abs(scaleX) === Math.abs(scaleY),
        point(x, y) {
            const [px, py] = matrixApplyToPoint(matrix, [x, y]);

            return {
                x: px,
                y: py,
            };
        },
        scalar(value) {
            return value * magnitude;
        },
    };
}
