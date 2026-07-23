import type {
    Face3D,
    Vector3,
} from '@ripl/3d';

/** Side wall + end caps of a solid cylinder whose axis runs along Z, centred at (cx, cy). */
export function cylinderZ(cx: number, cy: number, radius: number, z1: number, z2: number, segments: number): Face3D[] {
    const faces: Face3D[] = [];
    const near = Math.min(z1, z2);
    const far = Math.max(z1, z2);

    for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;
        const c1 = Math.cos(a1);
        const s1 = Math.sin(a1);
        const c2 = Math.cos(a2);
        const s2 = Math.sin(a2);

        const p1: Vector3 = [cx + c1 * radius, cy + s1 * radius, near];
        const p2: Vector3 = [cx + c2 * radius, cy + s2 * radius, near];
        const p3: Vector3 = [cx + c2 * radius, cy + s2 * radius, far];
        const p4: Vector3 = [cx + c1 * radius, cy + s1 * radius, far];

        // Side quad (outward-facing winding).
        faces.push({ vertices: [p1, p2, p3, p4] });

        // Front cap (+Z) and back cap (-Z) triangles.
        faces.push({
            vertices: [[cx, cy, far], p4, p3],
            normal: [0, 0, 1],
        });
        faces.push({
            vertices: [[cx, cy, near], p2, p1],
            normal: [0, 0, -1],
        });
    }

    return faces;
}

/** Side wall + end caps of a solid cylinder whose axis runs along Y, centred at (cx, cz). */
export function cylinderY(cx: number, cz: number, radius: number, y1: number, y2: number, segments: number): Face3D[] {
    const faces: Face3D[] = [];
    const bottom = Math.min(y1, y2);
    const top = Math.max(y1, y2);

    for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;
        const c1 = Math.cos(a1);
        const s1 = Math.sin(a1);
        const c2 = Math.cos(a2);
        const s2 = Math.sin(a2);

        const p1: Vector3 = [cx + c1 * radius, bottom, cz + s1 * radius];
        const p2: Vector3 = [cx + c2 * radius, bottom, cz + s2 * radius];
        const p3: Vector3 = [cx + c2 * radius, top, cz + s2 * radius];
        const p4: Vector3 = [cx + c1 * radius, top, cz + s1 * radius];

        faces.push({ vertices: [p1, p2, p3, p4] });

        faces.push({
            vertices: [[cx, top, cz], p4, p3],
            normal: [0, 1, 0],
        });
        faces.push({
            vertices: [[cx, bottom, cz], p2, p1],
            normal: [0, -1, 0],
        });
    }

    return faces;
}

/** Annular ring (tube with a hole) whose axis runs along Z — used for the connecting-rod ends. */
export function ringZ(cx: number, cy: number, innerR: number, outerR: number, z1: number, z2: number, segments: number): Face3D[] {
    const faces: Face3D[] = [];

    for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;
        const c1 = Math.cos(a1);
        const s1 = Math.sin(a1);
        const c2 = Math.cos(a2);
        const s2 = Math.sin(a2);

        const oi1: Vector3 = [cx + c1 * outerR, cy + s1 * outerR, z1];
        const oi2: Vector3 = [cx + c2 * outerR, cy + s2 * outerR, z1];
        const oo1: Vector3 = [cx + c1 * outerR, cy + s1 * outerR, z2];
        const oo2: Vector3 = [cx + c2 * outerR, cy + s2 * outerR, z2];
        const ii1: Vector3 = [cx + c1 * innerR, cy + s1 * innerR, z1];
        const ii2: Vector3 = [cx + c2 * innerR, cy + s2 * innerR, z1];
        const io1: Vector3 = [cx + c1 * innerR, cy + s1 * innerR, z2];
        const io2: Vector3 = [cx + c2 * innerR, cy + s2 * innerR, z2];

        faces.push({ vertices: [oi1, oi2, oo2, oo1] });
        faces.push({ vertices: [io1, io2, ii2, ii1] });
        faces.push({
            vertices: [ii1, ii2, oi2, oi1],
            normal: [0, 0, 1],
        });
        faces.push({
            vertices: [oo1, oo2, io2, io1],
            normal: [0, 0, -1],
        });
    }

    return faces;
}

/** The six faces of an axis-aligned box spanning two opposite corners. */
export function box(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Face3D[] {
    const [xa, xb] = [Math.min(x1, x2), Math.max(x1, x2)];
    const [ya, yb] = [Math.min(y1, y2), Math.max(y1, y2)];
    const [za, zb] = [Math.min(z1, z2), Math.max(z1, z2)];

    return [
        {
            vertices: [[xa, ya, zb], [xb, ya, zb], [xb, yb, zb], [xa, yb, zb]],
            normal: [0, 0, 1],
        },
        {
            vertices: [[xb, ya, za], [xa, ya, za], [xa, yb, za], [xb, yb, za]],
            normal: [0, 0, -1],
        },
        {
            vertices: [[xb, ya, zb], [xb, ya, za], [xb, yb, za], [xb, yb, zb]],
            normal: [1, 0, 0],
        },
        {
            vertices: [[xa, ya, za], [xa, ya, zb], [xa, yb, zb], [xa, yb, za]],
            normal: [-1, 0, 0],
        },
        {
            vertices: [[xa, yb, zb], [xb, yb, zb], [xb, yb, za], [xa, yb, za]],
            normal: [0, 1, 0],
        },
        {
            vertices: [[xa, ya, za], [xb, ya, za], [xb, ya, zb], [xa, ya, zb]],
            normal: [0, -1, 0],
        },
    ];
}
