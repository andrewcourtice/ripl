/**
 * A 2D affine transformation matrix stored as the six significant values of the
 * augmented 3×3 matrix, in the same `[a, b, c, d, e, f]` order used by the Canvas
 * 2D API (`setTransform`) and CSS `matrix()`:
 *
 * ```
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 * ```
 *
 * A point `[x, y]` is transformed to `[a·x + c·y + e, b·x + d·y + f]`.
 */
export type Matrix = [a: number, b: number, c: number, d: number, e: number, f: number];

/** Returns the identity matrix (a no-op transform). */
export function matrixIdentity(): Matrix {
    return [1, 0, 0, 1, 0, 0];
}

/** Returns a translation matrix that moves points by `(x, y)`. */
export function matrixTranslate(x: number, y: number): Matrix {
    return [1, 0, 0, 1, x, y];
}

/** Returns a scaling matrix with the given horizontal and vertical factors. */
export function matrixScale(x: number, y: number): Matrix {
    return [x, 0, 0, y, 0, 0];
}

/** Returns a rotation matrix for the given angle, in radians. */
export function matrixRotate(angle: number): Matrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [cos, sin, -sin, cos, 0, 0];
}

/**
 * Post-multiplies `a` by `b`, returning the composite `a · b`. Applying the result to a
 * point is equivalent to applying `b` first and then `a`, matching how successive
 * `translate`/`rotate`/`scale` calls accumulate onto a canvas transform matrix.
 */
export function matrixMultiply(a: Matrix, b: Matrix): Matrix {
    return [
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4],
        a[1] * b[4] + a[3] * b[5] + a[5],
    ];
}

/**
 * Returns the inverse of `matrix`, or `null` when it is singular (zero determinant) and
 * therefore not invertible.
 */
export function matrixInvert(matrix: Matrix): Matrix | null {
    // eslint-disable-next-line id-length
    const [a, b, c, d, e, f] = matrix;
    const determinant = a * d - b * c;

    if (determinant === 0) {
        return null;
    }

    return [
        d / determinant,
        -b / determinant,
        -c / determinant,
        a / determinant,
        (c * f - d * e) / determinant,
        (b * e - a * f) / determinant,
    ];
}

/** Applies `matrix` to the point `[x, y]`, returning the transformed point. */
export function matrixApplyToPoint(matrix: Matrix, [x, y]: [number, number]): [number, number] {
    // eslint-disable-next-line id-length
    const [a, b, c, d, e, f] = matrix;
    return [a * x + c * y + e, b * x + d * y + f];
}

/** Tests whether `matrix` is the identity transform (within an exact comparison). */
export function matrixIsIdentity(matrix: Matrix): boolean {
    return matrix[0] === 1
        && matrix[1] === 0
        && matrix[2] === 0
        && matrix[3] === 1
        && matrix[4] === 0
        && matrix[5] === 0;
}
