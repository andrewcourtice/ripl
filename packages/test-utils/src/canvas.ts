import {
    vi,
} from 'vitest';

/** Installs a minimal `Path2D` polyfill on `globalThis` if not already present. */
export function polyfillPath2D() {
    if (typeof globalThis.Path2D === 'undefined') {

        (globalThis as any).Path2D = class Path2D {
            arc() {}
            arcTo() {}
            addPath() {}
            bezierCurveTo() {}
            closePath() {}
            ellipse() {}
            lineTo() {}
            moveTo() {}
            quadraticCurveTo() {}
            rect() {}
            roundRect() {}
        };

    }
}

/** Per-character and vertical metrics the fake text measurer reports. */
export interface MockTextMetricsOptions {
    /** Advance width, in pixels, of a single character. Defaults to `7`. */
    charWidth?: number;
    /** Distance, in pixels, from the alphabetic baseline to the top of the glyphs. Defaults to `6`. */
    ascent?: number;
    /** Distance, in pixels, from the alphabetic baseline to the bottom of the glyphs. Defaults to `2`. */
    descent?: number;
}

/**
 * Installs a text measurer on a stub canvas context that reports **anchor-relative** metrics, the
 * way a real `CanvasRenderingContext2D` does: `actualBoundingBoxLeft/Right` shift with `textAlign`
 * and `actualBoundingBoxAscent/Descent` shift with `textBaseline`.
 *
 * The default `mockCanvasContext` stub reports zero for every metric, which collapses every text
 * box to a point — fine for smoke tests, useless for asserting layout. Use this whenever a test
 * depends on where text actually sits.
 *
 * @param stub - The context stub returned by {@link mockCanvasContext}.
 * @param options - Character width and vertical metrics to report.
 * @returns The same stub, for chaining.
 */
export function mockTextMetrics<TStub extends {
    measureText: unknown;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}>(stub: TStub, options: MockTextMetricsOptions = {}): TStub {
    const {
        charWidth = 7,
        ascent = 6,
        descent = 2,
    } = options;

    const height = ascent + descent;

    const horizontal: Partial<Record<CanvasTextAlign, (width: number) => [number, number]>> = {
        center: width => [width / 2, width / 2],
        right: width => [width, 0],
        end: width => [width, 0],
    };

    const vertical: Partial<Record<CanvasTextBaseline, () => [number, number]>> = {
        middle: () => [height / 2, height / 2],
        top: () => [0, height],
        hanging: () => [0, height],
        bottom: () => [height, 0],
    };

    stub.measureText = vi.fn((text: string) => {
        const width = String(text).length * charWidth;
        const [
            actualBoundingBoxLeft,
            actualBoundingBoxRight,
        ] = horizontal[stub.textAlign]?.(width) ?? [0, width];
        const [
            actualBoundingBoxAscent,
            actualBoundingBoxDescent,
        ] = vertical[stub.textBaseline]?.() ?? [ascent, descent];

        return {
            width,
            actualBoundingBoxLeft,
            actualBoundingBoxRight,
            actualBoundingBoxAscent,
            actualBoundingBoxDescent,
        } as TextMetrics;
    }) as TStub['measureText'];

    return stub;
}

/** Creates a stub `CanvasRenderingContext2D` and spies on `HTMLCanvasElement.prototype.getContext` to return it. */
export function mockCanvasContext() {
    const stub = {
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        transform: vi.fn(),
        measureText: vi.fn(() => ({
            width: 0,
            actualBoundingBoxAscent: 0,
            actualBoundingBoxDescent: 0,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: 0,
        })),
        createPattern: vi.fn(() => ({})),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        createConicGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
        drawImage: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        reset: vi.fn(),
        isPointInPath: vi.fn(() => false),
        isPointInStroke: vi.fn(() => false),
        canvas: document.createElement('canvas'),
        fillStyle: '#000000',
        strokeStyle: '#000000',
        filter: 'none',
        direction: 'ltr' as CanvasDirection,
        font: '10px sans-serif',
        fontKerning: 'auto' as CanvasFontKerning,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
        lineCap: 'butt' as CanvasLineCap,
        lineDashOffset: 0,
        lineJoin: 'miter' as CanvasLineJoin,
        lineWidth: 1,
        miterLimit: 10,
        shadowBlur: 0,
        shadowColor: 'rgba(0, 0, 0, 0)',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        textAlign: 'start' as CanvasTextAlign,
        textBaseline: 'alphabetic' as CanvasTextBaseline,
    };

    // `mockReturnValue` infers the last `getContext` overload (`GPUCanvasContext`); `never` satisfies them all.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(stub as never);

    return stub;
}

/** Drawing-state properties a real `CanvasRenderingContext2D` saves and restores. */
const STATEFUL_CANVAS_PROPERTIES = [
    'fillStyle',
    'strokeStyle',
    'filter',
    'direction',
    'font',
    'fontKerning',
    'globalAlpha',
    'globalCompositeOperation',
    'lineCap',
    'lineDashOffset',
    'lineJoin',
    'lineWidth',
    'miterLimit',
    'shadowBlur',
    'shadowColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'textAlign',
    'textBaseline',
] as const;

/** A 2D affine transform as the `[a, b, c, d, e, f]` tuple every canvas transform call composes into. */
export type MockCanvasMatrix = [number, number, number, number, number, number];

/** The transform and state-stack readouts {@link mockCanvasState} adds to a canvas stub. */
export interface MockCanvasStateStub {
    /**
     * The current transformation matrix as `[a, b, c, d, e, f]`, composed from every
     * `translate`/`scale`/`rotate`/`transform`/`setTransform`/`resetTransform` call and saved and
     * restored alongside the drawing state.
     */
    getMatrix(): MockCanvasMatrix;
    /** The number of `save()` calls not yet matched by a `restore()` — a state leak is a non-zero reading between frames. */
    getSaveDepth(): number;
}

const IDENTITY_MATRIX: MockCanvasMatrix = [1, 0, 0, 1, 0, 0];

/** Post-multiplies `matrix` by `operand`, matching how a canvas accumulates its CTM. */
function multiplyMatrix(matrix: MockCanvasMatrix, operand: MockCanvasMatrix): MockCanvasMatrix {
    return [
        matrix[0] * operand[0] + matrix[2] * operand[1],
        matrix[1] * operand[0] + matrix[3] * operand[1],
        matrix[0] * operand[2] + matrix[2] * operand[3],
        matrix[1] * operand[2] + matrix[3] * operand[3],
        matrix[0] * operand[4] + matrix[2] * operand[5] + matrix[4],
        matrix[1] * operand[4] + matrix[3] * operand[5] + matrix[5],
    ];
}

/**
 * Upgrades a {@link mockCanvasContext} stub so `save`/`restore` actually push and pop the drawing
 * state and the transformation matrix, the way a real `CanvasRenderingContext2D` does, and adds
 * {@link MockCanvasStateStub.getMatrix} / {@link MockCanvasStateStub.getSaveDepth} readouts.
 *
 * The default stub's `save`/`restore` are no-ops and it has no CTM, which structurally hides every
 * state-stack and transform defect: a test cannot tell a context that correctly restores its paint
 * from one that never restores anything, nor observe where a draw call actually landed. Use this
 * whenever a test asserts the drawing state *after* a scope closes, the transform in force at a
 * draw call, or that a frame left no save outstanding.
 *
 * @param stub - The context stub returned by {@link mockCanvasContext}.
 * @returns The same stub, widened with the transform and state-stack readouts, for chaining.
 */
export function mockCanvasState<TStub extends object>(stub: TStub): TStub & MockCanvasStateStub {
    const target = stub as Record<string, unknown>;
    const stack: Record<string, unknown>[] = [];
    const matrices: MockCanvasMatrix[] = [];

    let matrix: MockCanvasMatrix = [...IDENTITY_MATRIX];

    const compose = (operand: MockCanvasMatrix) => {
        matrix = multiplyMatrix(matrix, operand);
    };

    target.save = vi.fn(() => {
        stack.push(Object.fromEntries(STATEFUL_CANVAS_PROPERTIES.map(key => [key, target[key]])));
        matrices.push([...matrix]);
    });

    target.restore = vi.fn(() => {
        const state = stack.pop();

        if (state) {
            Object.assign(target, state);
        }

        matrix = matrices.pop() ?? matrix;
    });

    target.translate = vi.fn((x: number, y: number) => compose([1, 0, 0, 1, x, y]));
    target.scale = vi.fn((x: number, y: number) => compose([x, 0, 0, y, 0, 0]));

    target.rotate = vi.fn((angle: number) => {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        compose([cos, sin, -sin, cos, 0, 0]);
    });

    // eslint-disable-next-line id-length
    target.transform = vi.fn((a: number, b: number, c: number, d: number, e: number, f: number) => compose([a, b, c, d, e, f]));

    // eslint-disable-next-line id-length
    target.setTransform = vi.fn((a: number, b: number, c: number, d: number, e: number, f: number) => {
        matrix = [a, b, c, d, e, f];
    });

    target.resetTransform = vi.fn(() => {
        matrix = [...IDENTITY_MATRIX];
    });

    target.getMatrix = () => [...matrix] as MockCanvasMatrix;
    target.getSaveDepth = () => stack.length;

    return stub as TStub & MockCanvasStateStub;
}
