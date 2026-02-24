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
export type Matrix4 = Float64Array;

export function mat4Create(): Matrix4 {
    return new Float64Array(16);
}

export function mat4Identity(): Matrix4 {
    const out = mat4Create();
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;

    return out;
}

export function mat4Clone(m: Matrix4): Matrix4 {
    return new Float64Array(m);
}

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

export function mat4Translate(m: Matrix4, v: Vector3): Matrix4 {
    const t = mat4Identity();
    t[12] = v[0];
    t[13] = v[1];
    t[14] = v[2];

    return mat4Multiply(m, t);
}

export function mat4Scale(m: Matrix4, v: Vector3): Matrix4 {
    const s = mat4Identity();
    s[0] = v[0];
    s[5] = v[1];
    s[10] = v[2];

    return mat4Multiply(m, s);
}

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

export function mat4LookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4 {
    const zAxis = vec3Normalize(vec3Sub(eye, target));
    const xAxis = vec3Normalize(vec3Cross(up, zAxis));
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

export function mat4Perspective(fovRadians: number, aspect: number, near: number, far: number): Matrix4 {
    // eslint-disable-next-line id-length
    const f = 1.0 / Math.tan(fovRadians / 2);
    const rangeInv = 1.0 / (near - far);

    const out = mat4Create();

    out[0] = f / aspect;
    out[5] = f;
    out[10] = (near + far) * rangeInv;
    out[11] = -1;
    out[14] = 2 * near * far * rangeInv;

    return out;
}

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
    out[10] = 2 * nf;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (near + far) * nf;
    out[15] = 1;

    return out;
}

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
