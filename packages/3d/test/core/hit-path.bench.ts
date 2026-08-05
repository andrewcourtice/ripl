import {
    bench,
    describe,
} from 'vitest';

import {
    mat4LookAt,
    mat4Multiply,
    mat4Perspective,
    projectPoint,
} from '../../src';

import type {
    Face3D,
    ProjectedPoint,
} from '../../src';

import type {
    ContextPath,
} from '@ripl/core';

// Run with `yarn test:bench` (never in CI); jsdom's `Path2D` is a no-op so these are a lower bound.

// Sink read by every arm so the JIT cannot dead-code-eliminate the trace or the buffer writes.
let blackhole = 0;

// Shared via the prototype so `createNoopPath` allocates one object per call, like `new Path2D()`.
const noopPathMethods = {
    moveTo(x: number, y: number) {
        blackhole += x + y;
    },
    lineTo(x: number, y: number) {
        blackhole += x + y;
    },
    closePath() {},
};

/** A path whose methods consume coordinates into a sink (mirrors a polyfilled Path2D's shape). */
function createNoopPath(): ContextPath {
    return Object.create(noopPathMethods) as ContextPath;
}

const VIEWPORT = {
    width: 1200,
    height: 800,
};

const viewProjection = mat4Multiply(
    mat4Perspective(Math.PI / 3, VIEWPORT.width / VIEWPORT.height, 0.1, 1000),
    mat4LookAt([0, 3, 8], [0, 0, 0], [0, 1, 0])
);

/** A grid of quads, the shape a surface plot or a subdivided mesh actually produces. */
function createQuadMesh(faceCount: number): Face3D[] {
    const segments = Math.ceil(Math.sqrt(faceCount));
    const step = 4 / segments;
    const faces: Face3D[] = [];

    for (let row = 0; row < segments && faces.length < faceCount; row++) {
        for (let col = 0; col < segments && faces.length < faceCount; col++) {
            const x = -2 + col * step;
            const z = -2 + row * step;

            faces.push({
                vertices: [
                    [x, Math.sin(x + z), z],
                    [x + step, Math.sin(x + step + z), z],
                    [x + step, Math.sin(x + step + z + step), z + step],
                    [x, Math.sin(x + z + step), z + step],
                ],
            });
        }
    }

    return faces;
}

function projectFace(face: Face3D): ProjectedPoint[] {
    return face.vertices.map(vertex => projectPoint(vertex, viewProjection, VIEWPORT));
}

/** The pre-change frame: one fresh path per shape, traced face by face whether or not it is used. */
function renderEager(faces: Face3D[]): void {
    const hitPath = createNoopPath();

    let nearestDepth = Infinity;

    for (const face of faces) {
        const points = projectFace(face);

        nearestDepth = Math.min(nearestDepth, points[0][2]);
        hitPath.moveTo(points[0][0], points[0][1]);

        for (let idx = 1; idx < points.length; idx++) {
            hitPath.lineTo(points[idx][0], points[idx][1]);
        }

        hitPath.closePath();
    }

    blackhole += nearestDepth;
}

/** The post-change frame: the same projection loop, writing screen-space points into a reused buffer. */
function renderLazy(faces: Face3D[], points: Float32Array, offsets: Uint32Array): void {
    let nearestDepth = Infinity;
    let cursor = 0;

    for (let face = 0; face < faces.length; face++) {
        const projected = projectFace(faces[face]);

        nearestDepth = Math.min(nearestDepth, projected[0][2]);
        offsets[face] = cursor;

        for (const point of projected) {
            points[cursor++] = point[0];
            points[cursor++] = point[1];
        }

        offsets[face + 1] = cursor;
    }

    blackhole += nearestDepth;
}

/** What a live hover costs on top of a lazy frame: one path built from the buffer, once. */
function buildHitPath(faceCount: number, points: Float32Array, offsets: Uint32Array): void {
    const hitPath = createNoopPath();

    for (let face = 0; face < faceCount; face++) {
        const start = offsets[face];
        const end = offsets[face + 1];

        hitPath.moveTo(points[start], points[start + 1]);

        for (let idx = start + 2; idx < end; idx += 2) {
            hitPath.lineTo(points[idx], points[idx + 1]);
        }

        hitPath.closePath();
    }
}

function createBuffers(faces: Face3D[]) {
    let vertexCount = 0;

    for (const face of faces) {
        vertexCount += face.vertices.length;
    }

    return {
        points: new Float32Array(vertexCount * 2),
        offsets: new Uint32Array(faces.length + 1),
    };
}

/** The same work with the shared projection hoisted out, so the delta is the hit path alone. */
function describeTraceOnly(faceCount: number): void {
    describe(`${faceCount} faces / frame — hit path only`, () => {
        const faces = createQuadMesh(faceCount);
        const { points, offsets } = createBuffers(faces);
        const projected = faces.map(projectFace);

        bench('eager (trace a fresh path every frame)', () => {
            const hitPath = createNoopPath();

            for (const face of projected) {
                hitPath.moveTo(face[0][0], face[0][1]);

                for (let idx = 1; idx < face.length; idx++) {
                    hitPath.lineTo(face[idx][0], face[idx][1]);
                }

                hitPath.closePath();
            }

            if (blackhole === Infinity) {
                throw new Error('unreachable');
            }
        });

        bench('lazy (write the reused buffer)', () => {
            let cursor = 0;

            for (let face = 0; face < projected.length; face++) {
                offsets[face] = cursor;

                for (const point of projected[face]) {
                    points[cursor++] = point[0];
                    points[cursor++] = point[1];
                }

                offsets[face + 1] = cursor;
            }

            blackhole += cursor;

            if (blackhole === Infinity) {
                throw new Error('unreachable');
            }
        });
    });
}

// The shared projection loop allocates five arrays per face, so this scenario is GC-bound and
// needs a long warmup before the hit-path delta shows through at all.
const FRAME_BENCH_OPTIONS = {
    time: 3000,
    warmupTime: 1000,
};

function describeFaceCount(faceCount: number): void {
    describe(`${faceCount} faces / frame`, () => {
        const faces = createQuadMesh(faceCount);
        const { points, offsets } = createBuffers(faces);

        bench('eager (trace a fresh path every frame)', () => {
            renderEager(faces);

            if (blackhole === Infinity) {
                throw new Error('unreachable');
            }
        }, FRAME_BENCH_OPTIONS);

        bench('lazy (nothing hit-tests)', () => {
            renderLazy(faces, points, offsets);

            if (blackhole === Infinity) {
                throw new Error('unreachable');
            }
        }, FRAME_BENCH_OPTIONS);

        bench('lazy (a live hover builds the path once)', () => {
            renderLazy(faces, points, offsets);
            buildHitPath(faces.length, points, offsets);

            if (blackhole === Infinity) {
                throw new Error('unreachable');
            }
        }, FRAME_BENCH_OPTIONS);
    });
}

describeFaceCount(1000);
describeFaceCount(5000);
describeFaceCount(10000);

describeTraceOnly(1000);
describeTraceOnly(5000);
describeTraceOnly(10000);
