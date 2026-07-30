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

    // `getContext` is overloaded and `@webgpu/types` contributes the last overload, so
    // `mockReturnValue` infers `GPUCanvasContext`. `never` satisfies every overload's return
    // type; the stub is a 2D context regardless.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(stub as never);

    return stub;
}
