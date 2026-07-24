import type {
    Matrix,
} from '@ripl/core';

/**
 * Converts a Ripl {@link Matrix} (the six significant values of a 2D affine transform, in Canvas 2D
 * `[a, b, c, d, e, f]` column order) into the nine-element row-major 3×3 matrix Skia's
 * `SkCanvas.concat` / `SkPath.transform` expect.
 *
 * Ripl/Canvas store `| a c e |` over `| b d f |` over `| 0 0 1 |`, so the row-major nine-tuple is
 * `[a, c, e, b, d, f, 0, 0, 1]`.
 *
 * @param matrix - The source affine matrix in Ripl's `[a, b, c, d, e, f]` order.
 * @returns The equivalent nine-element row-major matrix for Skia.
 */
export function riplMatrixToSkia(matrix: Matrix): number[] {
    return [
        matrix[0],
        matrix[2],
        matrix[4],
        matrix[1],
        matrix[3],
        matrix[5],
        0,
        0,
        1,
    ];
}

/**
 * Builds a row-major 3×3 rotation matrix (for Skia) that rotates by `radians` about the point
 * (`cx`, `cy`). Used to apply rotation to a rotated-ellipse sub-path.
 *
 * @param radians - The rotation angle in radians.
 * @param cx - The x coordinate of the rotation origin.
 * @param cy - The y coordinate of the rotation origin.
 * @returns The nine-element row-major rotation matrix.
 */
export function rotationMatrixAbout(radians: number, cx: number, cy: number): number[] {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return [
        cos,
        -sin,
        cx - cx * cos + cy * sin,
        sin,
        cos,
        cy - cx * sin - cy * cos,
        0,
        0,
        1,
    ];
}
