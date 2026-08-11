import {
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCircle,
    createGroup,
    createRect,
    matrixIdentity,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createTerminalTransform,
    letterboxMatrix,
} from '../src/transform';

import {
    createContext,
} from '../src/context';

import {
    createMockOutput,
    createSpyRasterizer,
} from './helpers';

polyfillPath2D();

/** Renders a scene to plain braille art, for comparing two ways of expressing the same geometry. */
function renderArt(build: (context: ReturnType<typeof createContext>) => void): string {
    const context = createContext(createMockOutput(40, 12));

    context.batch(() => build(context));

    return context.export().toString();
}

/** Collects the dots a scene lights, sorted, for asserting on exact geometry. */
function renderPixels(build: (context: ReturnType<typeof createContext>) => void): string[] {
    const rasterizer = createSpyRasterizer(20, 6);
    const context = createContext(createMockOutput(20, 6), {
        rasterizer,
    });

    context.markRenderStart();
    build(context);
    context.markRenderEnd();

    return rasterizer.pixels.map(([x, y]) => `${x},${y}`).sort();
}

describe('TerminalTransform', () => {

    test('Should report a letterbox as axis-aligned and uniform', () => {
        const transform = createTerminalTransform(letterboxMatrix(2, 10, 4));

        expect(transform.axisAligned).toBe(true);
        expect(transform.uniform).toBe(true);
    });

    test('Should map a point through the letterbox', () => {
        const transform = createTerminalTransform(letterboxMatrix(2, 10, 4));

        expect(transform.point(5, 3)).toEqual({
            x: 20,
            y: 10,
        });
    });

    test('Should scale a length by the geometric mean of the scale factors', () => {
        expect(createTerminalTransform([4, 0, 0, 1, 0, 0]).scalar(3)).toBe(6);
    });

    test('Should report a rotation as neither axis-aligned nor uniform', () => {
        const transform = createTerminalTransform(matrixIdentity(), [0, 1, -1, 0, 0, 0]);

        expect(transform.axisAligned).toBe(false);
        expect(transform.uniform).toBe(false);
    });

    test('Should report a non-uniform scale as axis-aligned but not uniform', () => {
        const transform = createTerminalTransform(matrixIdentity(), [2, 0, 0, 3, 0, 0]);

        expect(transform.axisAligned).toBe(true);
        expect(transform.uniform).toBe(false);
    });

    test('Should compose the letterbox with the transform, letterbox first', () => {
        const transform = createTerminalTransform(letterboxMatrix(2, 0, 0), [1, 0, 0, 1, 5, 5]);

        expect(transform.point(0, 0)).toEqual({
            x: 10,
            y: 10,
        });
    });

});

describe('TerminalContext transforms', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    test('Should fill a translated path exactly where the offset path lands', () => {
        const translated = renderPixels(context => {
            context.translate(6, 4);
            context.fill = '#ff0000';

            const path = context.createPath();

            path.rect(2, 2, 6, 4);
            context.applyFill(path);
        });

        const offset = renderPixels(context => {
            context.fill = '#ff0000';

            const path = context.createPath();

            path.rect(8, 6, 6, 4);
            context.applyFill(path);
        });

        expect(translated.length).toBeGreaterThan(0);
        expect(translated).toEqual(offset);
    });

    test('Should render a translated group identically to pre-baked geometry', () => {
        const transformed = renderArt(context => {
            const group = createGroup({
                translateX: 20,
                translateY: 8,
            });

            group.add(createCircle({
                fill: '#ff0000',
                cx: 10,
                cy: 10,
                radius: 6,
            }));

            group.render(context);
        });

        const baked = renderArt(context => {
            createCircle({
                fill: '#ff0000',
                cx: 30,
                cy: 18,
                radius: 6,
            }).render(context);
        });

        expect(transformed).toBe(baked);
    });

    test('Should render a scaled shape identically to pre-baked geometry', () => {
        const transformed = renderArt(context => {
            createRect({
                fill: '#ff0000',
                x: 5,
                y: 2,
                width: 10,
                height: 4,
                transformScaleX: 2,
                transformScaleY: 2,
            }).render(context);
        });

        const baked = renderArt(context => {
            createRect({
                fill: '#ff0000',
                x: 10,
                y: 4,
                width: 20,
                height: 8,
            }).render(context);
        });

        expect(transformed).toBe(baked);
    });

    test('Should rotate a rect off its axis', () => {
        const rotated = renderArt(context => {
            createRect({
                fill: '#ff0000',
                x: 20,
                y: 10,
                width: 20,
                height: 6,
                rotation: Math.PI / 4,
                transformOriginX: '50%',
                transformOriginY: '50%',
            }).render(context);
        });

        const flat = renderArt(context => {
            createRect({
                fill: '#ff0000',
                x: 20,
                y: 10,
                width: 20,
                height: 6,
            }).render(context);
        });

        expect(rotated).not.toBe(flat);
    });

    test('Should map a quarter turn from a horizontal line to a vertical one', () => {
        const context = createContext(createMockOutput(20, 6));

        context.rotate(Math.PI / 2);

        const path = context.createPath();

        path.moveTo(0, 0);
        path.lineTo(10, 0);

        const rasterizer = createSpyRasterizer(20, 6);
        const rotated = createContext(createMockOutput(20, 6), {
            rasterizer,
        });

        rotated.rotate(Math.PI / 2);
        rotated.stroke = '#ff0000';

        const rotatedPath = rotated.createPath();

        rotatedPath.moveTo(0, 0);
        rotatedPath.lineTo(10, 0);

        rotated.markRenderStart();
        rotated.applyStroke(rotatedPath);
        rotated.markRenderEnd();

        expect(rasterizer.pixels.every(([x]) => x === 0)).toBe(true);
        expect(new Set(rasterizer.pixels.map(([, y]) => y)).size).toBeGreaterThan(1);
    });

    test('Should restore the transform saved before it', () => {
        const untransformed = renderPixels(context => {
            context.stroke = '#ff0000';

            const path = context.createPath();

            path.moveTo(0, 4);
            path.lineTo(10, 4);

            context.applyStroke(path);
        });

        const restored = renderPixels(context => {
            context.save();
            context.translate(5, 2);
            context.restore();

            context.stroke = '#ff0000';

            const path = context.createPath();

            path.moveTo(0, 4);
            path.lineTo(10, 4);

            context.applyStroke(path);
        });

        expect(restored).toEqual(untransformed);
    });

    test('Should treat setTransform as replacing the transform, in logical units', () => {
        const replaced = renderPixels(context => {
            context.translate(100, 100);
            context.setTransform(1, 0, 0, 1, 4, 2);
            context.stroke = '#ff0000';

            const path = context.createPath();

            path.moveTo(0, 0);
            path.lineTo(6, 0);

            context.applyStroke(path);
        });

        const translated = renderPixels(context => {
            context.translate(4, 2);
            context.stroke = '#ff0000';

            const path = context.createPath();

            path.moveTo(0, 0);
            path.lineTo(6, 0);

            context.applyStroke(path);
        });

        expect(replaced).toEqual(translated);
    });

    test('Should reset the transform along with the rest of the state', () => {
        const context = createContext(createMockOutput(20, 6));

        context.translate(10, 10);
        context.reset();

        const rasterizer = createSpyRasterizer(20, 6);
        const fresh = createContext(createMockOutput(20, 6), {
            rasterizer,
        });

        context.stroke = '#ff0000';
        fresh.stroke = '#ff0000';

        expect(context.width).toBe(fresh.width);
    });

    test('Should scale the stroke width by the transform', () => {
        const scaled = renderPixels(context => {
            context.scale(3, 3);
            context.stroke = '#ff0000';
            context.lineWidth = 1;

            const path = context.createPath();

            path.moveTo(0, 2);
            path.lineTo(4, 2);

            context.applyStroke(path);
        });

        const plain = renderPixels(context => {
            context.stroke = '#ff0000';
            context.lineWidth = 1;

            const path = context.createPath();

            path.moveTo(0, 6);
            path.lineTo(12, 6);

            context.applyStroke(path);
        });

        expect(scaled.length).toBeGreaterThan(plain.length);
    });

});
