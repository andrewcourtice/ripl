import {
    bench,
    describe,
} from 'vitest';

import {
    createRay,
    mat4Compose,
    mat4TransformPoint,
    rayIntersectsBox,
    rayIntersectTriangle,
    rayIntersectTriangleBuffer,
} from '../../src';

import type {
    Face3D,
    Matrix4,
    Ray,
    Vector3,
} from '../../src';

// Run with `yarn test:bench` (never in CI).

// Sink read by every arm so the JIT cannot dead-code-eliminate the intersection work.
let blackhole = 0;

/** A grid of quads, the shape a surface plot or a subdivided mesh actually produces. */
function createQuadMesh(faceCount: number, offsetY = 0): Face3D[] {
    const segments = Math.ceil(Math.sqrt(faceCount));
    const step = 4 / segments;
    const faces: Face3D[] = [];

    for (let row = 0; row < segments && faces.length < faceCount; row++) {
        for (let col = 0; col < segments && faces.length < faceCount; col++) {
            const x = -2 + col * step;
            const z = -2 + row * step;

            faces.push({
                vertices: [
                    [x, offsetY + Math.sin(x + z), z],
                    [x + step, offsetY + Math.sin(x + step + z), z],
                    [x + step, offsetY + Math.sin(x + step + z + step), z + step],
                    [x, offsetY + Math.sin(x + z + step), z + step],
                ],
            });
        }
    }

    return faces;
}

/** One part of an assembly: its own mesh plus the model matrix the scene graph would give it. */
interface Part {
    faces: Face3D[];
    matrix: Matrix4;
    vertices: Float64Array;
    offsets: Uint32Array;
    bounds: Float64Array;
}

function createPart(faceCount: number, index: number): Part {
    const faces = createQuadMesh(faceCount, index * 0.25);
    const matrix = mat4Compose([index * 0.5 - 2, 0, 0], [0, index * 0.2, 0], [1, 1, 1]);
    const vertexCount = faces.reduce((total, face) => total + face.vertices.length, 0);
    const part: Part = {
        faces,
        matrix,
        vertices: new Float64Array(vertexCount * 3),
        offsets: new Uint32Array(faces.length + 1),
        bounds: new Float64Array(6),
    };

    writeHitGeometry(part);

    return part;
}

/** What the render loop now retains: the world-space vertices it already transformed, plus their AABB. */
function writeHitGeometry(part: Part): void {
    const {
        faces,
        matrix,
        vertices,
        offsets,
        bounds,
    } = part;

    bounds[0] = Infinity;
    bounds[1] = Infinity;
    bounds[2] = Infinity;
    bounds[3] = -Infinity;
    bounds[4] = -Infinity;
    bounds[5] = -Infinity;

    let cursor = 0;

    for (let face = 0; face < faces.length; face++) {
        offsets[face] = cursor;

        for (const vertex of faces[face].vertices) {
            const world = mat4TransformPoint(matrix, vertex);

            vertices[cursor++] = world[0];
            vertices[cursor++] = world[1];
            vertices[cursor++] = world[2];

            bounds[0] = Math.min(bounds[0], world[0]);
            bounds[1] = Math.min(bounds[1], world[1]);
            bounds[2] = Math.min(bounds[2], world[2]);
            bounds[3] = Math.max(bounds[3], world[0]);
            bounds[4] = Math.max(bounds[4], world[1]);
            bounds[5] = Math.max(bounds[5], world[2]);
        }

        offsets[face + 1] = cursor;
    }
}

/** The pre-change pointer raycast: transform every vertex again, allocating five vectors per triangle. */
function raycastTransforming(part: Part, ray: Ray): number {
    let nearest = -1;

    for (const face of part.faces) {
        const vertices: Vector3[] = face.vertices.map(vertex => mat4TransformPoint(part.matrix, vertex));

        for (let corner = 1; corner < vertices.length - 1; corner++) {
            const hit = rayIntersectTriangle(ray, vertices[0], vertices[corner], vertices[corner + 1]);

            if (hit && (nearest < 0 || hit.distance < nearest)) {
                nearest = hit.distance;
            }
        }
    }

    return nearest;
}

/** The post-change pointer raycast: read the retained buffer, allocate nothing. */
function raycastRetained(part: Part, ray: Ray, reject: boolean): number {
    if (reject && !rayIntersectsBox(ray, part.bounds)) {
        return -1;
    }

    const {
        vertices,
        offsets,
    } = part;

    let nearest = -1;

    for (let face = 0; face + 1 < offsets.length; face++) {
        const start = offsets[face];
        const end = offsets[face + 1];

        for (let corner = start + 3; corner + 6 <= end; corner += 3) {
            const distance = rayIntersectTriangleBuffer(ray, vertices, start, corner, corner + 3);

            if (distance >= 0 && (nearest < 0 || distance < nearest)) {
                nearest = distance;
            }
        }
    }

    return nearest;
}

function describeAssembly(title: string, parts: Part[], ray: Ray): void {
    const triangles = parts.reduce((total, part) => total + part.faces.length * 2, 0);

    describe(`${title} — ${parts.length} shapes / ${triangles} triangles`, () => {
        bench('transform every vertex, allocating triangle test', () => {
            for (const part of parts) {
                blackhole += raycastTransforming(part, ray);
            }

            if (blackhole === Infinity) {
                throw new Error('unreachable');
            }
        });

        bench('retained vertices, allocation-free triangle test', () => {
            for (const part of parts) {
                blackhole += raycastRetained(part, ray, false);
            }

            if (blackhole === Infinity) {
                throw new Error('unreachable');
            }
        });

        bench('retained vertices, AABB reject first', () => {
            for (const part of parts) {
                blackhole += raycastRetained(part, ray, true);
            }

            if (blackhole === Infinity) {
                throw new Error('unreachable');
            }
        });
    });
}

// Roughly the jet engine: nine parts averaging ~425 quads each, ~7,300 triangles in total. The ray
// is aimed off the assembly's centre so the broad phase has parts to reject, which is what a pointer
// anywhere but the middle of an assembly actually does.
describeAssembly(
    'assembly',
    Array.from({ length: 9 }, (_, index) => createPart(425, index)),
    createRay([1.5, 6, 1.5], [-0.1, -1, -0.1])
);

// Roughly the graphing calculator's settled surface at its highest quality. The ray is aimed
// straight at it, because one mesh under the pointer is exactly the case an AABB cannot help with.
describeAssembly('single mesh', [createPart(9025, 0)], createRay([-2, 6, 0], [0, -1, 0]));
