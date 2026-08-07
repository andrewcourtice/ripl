import {
    vec3Cross,
    vec3Dot,
    vec3Normalize,
    vec3Sub,
} from './vector';

import type {
    Vector3,
} from './vector';

// Column-major 4x4 matrix stored as a 16-element array
/** A column-major 4×4 matrix stored as a 16-element `Float64Array`. */
export type Matrix4 = Float64Array;

/** Creates a zeroed 4×4 matrix. */
export function mat4Create(): Matrix4 {
    return new Float64Array(16);
}

/** Creates a 4×4 identity matrix. */
export function mat4Identity(): Matrix4 {
    const out = mat4Create();
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;

    return out;
}

/** Returns a copy of the given matrix. */
export function mat4Clone(m: Matrix4): Matrix4 {
    return new Float64Array(m);
}

/** Multiplies two 4×4 matrices. */
export function mat4Multiply(a: Matrix4, b: Matrix4): Matrix4 {
    const out = mat4Create();

    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            out[col * 4 + row] =
                a[row] * b[col * 4] +
                a[4 + row] * b[col * 4 + 1] +
                a[8 + row] * b[col * 4 + 2] +
                a[12 + row] * b[col * 4 + 3];
        }
    }

    return out;
}

/** Applies a translation to a matrix. */
export function mat4Translate(m: Matrix4, v: Vector3): Matrix4 {
    const t = mat4Identity();
    t[12] = v[0];
    t[13] = v[1];
    t[14] = v[2];

    return mat4Multiply(m, t);
}

/** Applies a scale transform to a matrix. */
export function mat4Scale(m: Matrix4, v: Vector3): Matrix4 {
    const s = mat4Identity();
    s[0] = v[0];
    s[5] = v[1];
    s[10] = v[2];

    return mat4Multiply(m, s);
}

/** Applies a rotation around the X axis to a matrix. */
export function mat4RotateX(m: Matrix4, angle: number): Matrix4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const r = mat4Identity();
    r[5] = c;
    r[6] = s;
    r[9] = -s;
    r[10] = c;

    return mat4Multiply(m, r);
}

/** Applies a rotation around the Y axis to a matrix. */
export function mat4RotateY(m: Matrix4, angle: number): Matrix4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const r = mat4Identity();
    r[0] = c;
    r[2] = -s;
    r[8] = s;
    r[10] = c;

    return mat4Multiply(m, r);
}

/** Applies a rotation around the Z axis to a matrix. */
export function mat4RotateZ(m: Matrix4, angle: number): Matrix4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const r = mat4Identity();
    r[0] = c;
    r[1] = s;
    r[4] = -s;
    r[5] = c;

    return mat4Multiply(m, r);
}

// Tried in order when `up` is parallel to the view direction and the cross product collapses.
const FALLBACK_UP_AXES: Vector3[] = [
    [0, 0, 1],
    [1, 0, 0],
];

function vec3IsZero(v: Vector3): boolean {
    return v[0] === 0 && v[1] === 0 && v[2] === 0;
}

function resolveBasisX(up: Vector3, zAxis: Vector3): Vector3 {
    for (const candidate of [up, ...FALLBACK_UP_AXES]) {
        const axis = vec3Normalize(vec3Cross(candidate, zAxis));

        if (!vec3IsZero(axis)) {
            return axis;
        }
    }

    return [1, 0, 0];
}

/**
 * Constructs a view matrix looking from `eye` toward `target` with the given `up` direction.
 *
 * Degenerate inputs are defended rather than silently collapsed: an `eye` equal to `target` yields
 * the identity, and an `up` parallel to the view direction falls back to a perpendicular axis. Both
 * previously produced a rank-deficient matrix that projected every point to the viewport centre.
 */
export function mat4LookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4 {
    const zAxis = vec3Normalize(vec3Sub(eye, target));

    if (vec3IsZero(zAxis)) {
        return mat4Identity();
    }

    const xAxis = resolveBasisX(up, zAxis);
    const yAxis = vec3Cross(zAxis, xAxis);

    const out = mat4Create();

    out[0] = xAxis[0];
    out[1] = yAxis[0];
    out[2] = zAxis[0];
    out[3] = 0;

    out[4] = xAxis[1];
    out[5] = yAxis[1];
    out[6] = zAxis[1];
    out[7] = 0;

    out[8] = xAxis[2];
    out[9] = yAxis[2];
    out[10] = zAxis[2];
    out[11] = 0;

    out[12] = -vec3Dot(xAxis, eye);
    out[13] = -vec3Dot(yAxis, eye);
    out[14] = -vec3Dot(zAxis, eye);
    out[15] = 1;

    return out;
}

/**
 * Constructs a perspective projection matrix.
 *
 * Depth maps to the WebGPU convention: the near plane projects to `0` and the far plane to `1`,
 * matching the `0 ≤ z ≤ w` clip volume the GPU backend rasterises against. The CPU painter reads
 * the projected depth only as a sort key, and it stays monotonic with distance.
 */
export function mat4Perspective(fovRadians: number, aspect: number, near: number, far: number): Matrix4 {
    // eslint-disable-next-line id-length
    const f = 1.0 / Math.tan(fovRadians / 2);
    const rangeInv = 1.0 / (near - far);

    const out = mat4Create();

    out[0] = f / aspect;
    out[5] = f;
    out[10] = far * rangeInv;
    out[11] = -1;
    out[14] = far * near * rangeInv;

    return out;
}

/**
 * Constructs an orthographic projection matrix.
 *
 * Depth maps to the WebGPU convention: the near plane projects to `0` and the far plane to `1`.
 * See {@link mat4Perspective}.
 */
export function mat4Orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
): Matrix4 {
    const out = mat4Create();

    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    out[0] = -2 * lr;
    out[5] = -2 * bt;
    out[10] = nf;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = near * nf;
    out[15] = 1;

    return out;
}

/**
 * Inverts a 4×4 matrix, or returns `null` when it is singular.
 *
 * Mirrors the `matrixInvert` contract from `@ripl/core`'s 2D matrix module: a matrix with a zero
 * determinant has no inverse, and `null` says so rather than propagating `Infinity` through every
 * downstream coordinate.
 *
 * @param m - The matrix to invert.
 * @returns The inverse, or `null` if `m` is singular.
 */
export function mat4Invert(m: Matrix4): Matrix4 | null {
    const a00 = m[0]; const a01 = m[1]; const a02 = m[2]; const a03 = m[3];
    const a10 = m[4]; const a11 = m[5]; const a12 = m[6]; const a13 = m[7];
    const a20 = m[8]; const a21 = m[9]; const a22 = m[10]; const a23 = m[11];
    const a30 = m[12]; const a31 = m[13]; const a32 = m[14]; const a33 = m[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (det === 0 || !isFinite(det)) {
        return null;
    }

    const inv = 1 / det;
    const out = mat4Create();

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * inv;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * inv;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * inv;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * inv;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * inv;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * inv;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * inv;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * inv;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * inv;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * inv;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * inv;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * inv;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * inv;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * inv;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * inv;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * inv;

    return out;
}

/** Returns the transpose of a 4×4 matrix. */
export function mat4Transpose(m: Matrix4): Matrix4 {
    const out = mat4Create();

    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            out[col * 4 + row] = m[row * 4 + col];
        }
    }

    return out;
}

/**
 * Builds the normal matrix for a model matrix — the inverse transpose of its upper-3×3.
 *
 * Transforming a normal by the model matrix itself is only correct under uniform scale; under
 * non-uniform scale it shears the normal off the surface and the shading goes wrong. The
 * translation column is dropped because a normal is a direction, not a position.
 *
 * @param m - The model matrix.
 * @returns The normal matrix, or the identity when `m` is singular.
 */
export function mat4NormalMatrix(m: Matrix4): Matrix4 {
    const linear = mat4Clone(m);

    linear[12] = 0;
    linear[13] = 0;
    linear[14] = 0;
    linear[3] = 0;
    linear[7] = 0;
    linear[11] = 0;
    linear[15] = 1;

    const inverse = mat4Invert(linear);

    return inverse ? mat4Transpose(inverse) : mat4Identity();
}

/**
 * Composes a transform from translation, per-axis rotation and scale, applied in that order.
 *
 * Matches the order `Shape3D` builds its model matrix in, so a composed matrix and an element's
 * own transform agree.
 *
 * @param translation - Translation applied last.
 * @param rotation - Rotation around the X, Y and Z axes, in radians.
 * @param scale - Per-axis scale applied first.
 * @returns The composed matrix.
 */
export function mat4Compose(translation: Vector3, rotation: Vector3, scale: Vector3): Matrix4 {
    let out = mat4Translate(mat4Identity(), translation);

    out = mat4RotateX(out, rotation[0]);
    out = mat4RotateY(out, rotation[1]);
    out = mat4RotateZ(out, rotation[2]);

    return mat4Scale(out, scale);
}

/** Transforms a direction vector by the upper-3×3 of a 4×4 matrix, ignoring translation. */
export function mat4TransformDirection(m: Matrix4, v: Vector3): Vector3 {
    return [
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2],
    ];
}

/**
 * Transforms a direction vector by the **transposed** upper-3×3 of a 4×4 matrix, ignoring
 * translation. For a rigid transform (rotation plus translation, such as a view matrix) the
 * transposed rotation is its inverse, so this undoes {@link mat4TransformDirection} — use it to
 * carry a direction from view space back into world space.
 */
export function mat4TransformDirectionInverse(m: Matrix4, v: Vector3): Vector3 {
    return [
        m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
        m[4] * v[0] + m[5] * v[1] + m[6] * v[2],
        m[8] * v[0] + m[9] * v[1] + m[10] * v[2],
    ];
}

/**
 * Transforms a 3D point by a 4×4 matrix, performing the perspective divide.
 *
 * There is deliberately **no near-plane clipping**: a point behind the eye has `w < 0` and comes
 * back mirrored through the origin, and a point on the eye plane (`w === 0`) is returned
 * undivided. Clipping is a rasteriser's job — the GPU backend does it in hardware — and doing it
 * here would mean returning something other than a point. The CPU painter's renderer therefore
 * draws geometry straddling the camera inside-out; keep the near plane in front of the scene.
 */
export function mat4TransformPoint(m: Matrix4, v: Vector3): Vector3 {
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    const invW = w !== 0 ? 1 / w : 1;

    return [
        (m[0] * x + m[4] * y + m[8] * z + m[12]) * invW,
        (m[1] * x + m[5] * y + m[9] * z + m[13]) * invW,
        (m[2] * x + m[6] * y + m[10] * z + m[14]) * invW,
    ];
}
