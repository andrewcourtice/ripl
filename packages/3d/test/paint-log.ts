import {
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    mockCanvasState,
} from '@ripl/test-utils';

import type {
    MockCanvasMatrix,
} from '@ripl/test-utils';

/** A single paint operation recorded off the canvas stub, with the state in force when it ran. */
export interface PaintRecord {
    /** Which native call produced the record. A 3D face fills with no path argument; a 2D element passes its `Path2D`. */
    op: 'face-fill' | 'face-stroke' | 'path-fill' | 'path-stroke' | 'text-fill' | 'image';
    /** The `fillStyle` in force. */
    fillStyle: string;
    /** The `strokeStyle` in force. */
    strokeStyle: string;
    /** The `globalAlpha` in force. */
    globalAlpha: number;
    /** The `globalCompositeOperation` in force. */
    globalCompositeOperation: string;
    /** The `lineWidth` in force. */
    lineWidth: number;
    /** The `filter` in force. */
    filter: string;
    /** The current transformation matrix in force, as `[a, b, c, d, e, f]`. */
    matrix: MockCanvasMatrix;
    /** The user-space path points traced since the last `beginPath`, in trace order. */
    points: [number, number][];
    /** How many clips are in force — clips installed since the enclosing `save`, plus every outer one. */
    clips: number;
}

/** A canvas stub that records every paint operation alongside the drawing state it ran under. */
export interface PaintLogStub {
    /** Every recorded paint operation, in call order. */
    records: PaintRecord[];
    /** The argument list of every `createLinearGradient` call, in call order. */
    gradients: number[][];
    /** The number of `clip()` calls made so far. */
    clipCount(): number;
    /** The current transformation matrix as `[a, b, c, d, e, f]`. */
    getMatrix(): MockCanvasMatrix;
    /** The number of `save()` calls not yet matched by a `restore()`. */
    getSaveDepth(): number;
}

/**
 * Installs a canvas stub that honours save/restore and the CTM ({@link mockCanvasState}) and, on top
 * of it, records the drawing state in force at every paint call.
 *
 * The 3D backend buffers its faces and paints them at the end of the frame, so the only way to test
 * what a face was actually drawn with is to read the state at the draw call itself — asserting on
 * `faceBuffer` says nothing about what reached the canvas.
 */
export function mockPaintLog(): PaintLogStub {
    const stub = mockCanvasState(mockCanvasContext());
    const records: PaintRecord[] = [];
    const clipStack: number[] = [];

    // A clip is scoped by save/restore like any other state, and only its live depth says whether
    // the geometry drawn at a given moment is actually masked.
    const baseSave = stub.save;
    const baseRestore = stub.restore;

    let clipCalls = 0;
    let liveClips = 0;
    let points: [number, number][] = [];

    stub.save = vi.fn(() => {
        clipStack.push(liveClips);
        baseSave();
    });

    stub.restore = vi.fn(() => {
        liveClips = clipStack.pop() ?? liveClips;
        baseRestore();
    });

    const record = (op: PaintRecord['op']) => {
        records.push({
            op,
            fillStyle: stub.fillStyle,
            strokeStyle: stub.strokeStyle,
            globalAlpha: stub.globalAlpha,
            globalCompositeOperation: stub.globalCompositeOperation,
            lineWidth: stub.lineWidth,
            filter: stub.filter,
            matrix: stub.getMatrix(),
            points: [...points],
            clips: liveClips,
        });
    };

    stub.beginPath = vi.fn(() => {
        points = [];
    });

    stub.moveTo = vi.fn((x: number, y: number) => {
        points.push([x, y]);
    });

    stub.lineTo = vi.fn((x: number, y: number) => {
        points.push([x, y]);
    });

    stub.fill = vi.fn((path?: unknown) => record(path ? 'path-fill' : 'face-fill'));
    stub.stroke = vi.fn((path?: unknown) => record(path ? 'path-stroke' : 'face-stroke'));
    stub.fillText = vi.fn(() => record('text-fill'));
    stub.drawImage = vi.fn(() => record('image'));
    stub.clip = vi.fn(() => {
        clipCalls += 1;
        liveClips += 1;
    });

    const gradients: number[][] = [];

    stub.createLinearGradient = vi.fn((...args: number[]) => {
        gradients.push(args);

        return {
            addColorStop: vi.fn(),
        };
    }) as typeof stub.createLinearGradient;

    return {
        records,
        gradients,
        clipCount: () => clipCalls,
        getMatrix: () => stub.getMatrix(),
        getSaveDepth: () => stub.getSaveDepth(),
    };
}

/** Sizes every host element measured through `getBoundingClientRect` to the given dimensions. */
export function mockHostSize(width: number, height: number): void {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        left: 0,
        top: 0,
        right: width,
        bottom: height,
        width,
        height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    }) as DOMRect);
}
