import {
    vi,
} from 'vitest';

/** Installs a minimal `Path2D` polyfill on `globalThis` if not already present. */
export function polyfillPath2D() {
    if (typeof globalThis.Path2D === 'undefined') {
        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
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
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
    }
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

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(stub as unknown as CanvasRenderingContext2D);

    return stub;
}
