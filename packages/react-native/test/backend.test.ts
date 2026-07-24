import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

vi.mock('@shopify/react-native-skia', () => import('./skia-mock'));

import {
    Skia,
} from './skia-mock';

import {
    getDefaultState,
} from '../src/defaults';

import {
    riplMatrixToSkia,
} from '../src/transform';

import {
    ReactNativeSkiaPath,
} from '../src/path';

import {
    buildPaint,
} from '../src/paint';

import {
    toSkiaShader,
} from '../src/shader';

import {
    measureSkiaText,
    parseFont,
} from '../src/font';

import {
    ReactNativeSkiaContext,
} from '../src/context';

import {
    factory,
} from '@ripl/core';

import type {
    BaseState,
} from '@ripl/core';

const BOUNDS = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
};

function state(overrides: Partial<BaseState> = {}): BaseState {
    return {
        ...getDefaultState(),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    // Override the jsdom canvas-based default state binding from vitest.setup.ts with the hand-written
    // React Native default state so contexts can be constructed without a real canvas.
    factory.set({
        getDefaultState,
        devicePixelRatio: 1,
    });
});

describe('riplMatrixToSkia', () => {

    test('Should reorder a Ripl [a,b,c,d,e,f] matrix into a row-major 3x3', () => {
        expect(riplMatrixToSkia([1, 2, 3, 4, 5, 6])).toEqual([1, 3, 5, 2, 4, 6, 0, 0, 1]);
    });

});

describe('ReactNativeSkiaPath', () => {

    test('Should map primitives onto their Skia path calls', () => {
        const path = new ReactNativeSkiaPath();

        path.moveTo(1, 2);
        path.lineTo(3, 4);
        path.bezierCurveTo(1, 2, 3, 4, 5, 6);
        path.quadraticCurveTo(1, 2, 3, 4);
        path.circle(5, 5, 10);
        path.rect(0, 0, 8, 8);
        path.arcTo(1, 2, 3, 4, 5);
        path.closePath();

        expect(path.skia.moveTo).toHaveBeenCalledWith(1, 2);
        expect(path.skia.lineTo).toHaveBeenCalledWith(3, 4);
        expect(path.skia.cubicTo).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6);
        expect(path.skia.quadTo).toHaveBeenCalledWith(1, 2, 3, 4);
        expect(path.skia.addCircle).toHaveBeenCalledWith(5, 5, 10);
        expect(path.skia.addRect).toHaveBeenCalled();
        expect(path.skia.arcToTangent).toHaveBeenCalledWith(1, 2, 3, 4, 5);
        expect(path.skia.close).toHaveBeenCalled();
    });

    test('Should use addOval for a full-circle arc and arcToOval for a partial arc', () => {
        const full = new ReactNativeSkiaPath();

        full.arc(0, 0, 10, 0, Math.PI * 2);
        expect(full.skia.addOval).toHaveBeenCalled();

        const partial = new ReactNativeSkiaPath();

        partial.arc(0, 0, 10, 0, Math.PI);
        expect(partial.skia.arcToOval).toHaveBeenCalled();
    });

    test('Should use a uniform rounded rect when all corner radii match', () => {
        const path = new ReactNativeSkiaPath();

        path.roundRect(0, 0, 10, 10, [4, 4, 4, 4]);

        expect(Skia.RRectXY).toHaveBeenCalled();
        expect(path.skia.addRRect).toHaveBeenCalled();
    });

    test('Should use a per-corner rounded rect when corner radii differ', () => {
        const path = new ReactNativeSkiaPath();

        path.roundRect(0, 0, 10, 10, [1, 2, 3, 4]);

        expect(path.skia.addRRect).toHaveBeenCalledWith(expect.objectContaining({
            topLeft: expect.anything(),
            bottomRight: expect.anything(),
        }));
    });

    test('Should append another Skia-backed path', () => {
        const target = new ReactNativeSkiaPath();
        const source = new ReactNativeSkiaPath();

        target.addPath(source);

        expect(target.skia.addPath).toHaveBeenCalledWith(source.skia);
    });

});

describe('buildPaint', () => {

    test('Should build a fill paint with a solid color', () => {
        const paint = buildPaint(state({
            fill: '#123456',
        }), 'fill', BOUNDS);

        expect(paint.setAntiAlias).toHaveBeenCalledWith(true);
        expect(paint.setStyle).toHaveBeenCalledWith(0);
        expect(paint.setColor).toHaveBeenCalled();
    });

    test('Should build a stroke paint with width, cap, join and miter', () => {
        const paint = buildPaint(state({
            stroke: '#000000',
            lineWidth: 3,
            lineCap: 'round',
            lineJoin: 'bevel',
            miterLimit: 8,
        }), 'stroke', BOUNDS);

        expect(paint.setStyle).toHaveBeenCalledWith(1);
        expect(paint.setStrokeWidth).toHaveBeenCalledWith(3);
        expect(paint.setStrokeCap).toHaveBeenCalledWith(1);
        expect(paint.setStrokeJoin).toHaveBeenCalledWith(2);
        expect(paint.setStrokeMiter).toHaveBeenCalledWith(8);
    });

    test('Should apply global opacity via setAlphaf', () => {
        const paint = buildPaint(state({
            fill: '#000000',
            opacity: 0.5,
        }), 'fill', BOUNDS);

        expect(paint.setAlphaf).toHaveBeenCalled();
    });

    test('Should apply a line dash for a dashed stroke', () => {
        const paint = buildPaint(state({
            stroke: '#000000',
            lineDash: [4, 2],
            lineDashOffset: 1,
        }), 'stroke', BOUNDS);

        expect(Skia.PathEffect.MakeDash).toHaveBeenCalledWith([4, 2], 1);
        expect(paint.setPathEffect).toHaveBeenCalled();
    });

    test('Should apply a drop shadow when a visible shadow is set', () => {
        const paint = buildPaint(state({
            fill: '#000000',
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
        }), 'fill', BOUNDS);

        expect(Skia.ImageFilter.MakeDropShadow).toHaveBeenCalled();
        expect(paint.setImageFilter).toHaveBeenCalled();
    });

    test('Should set a shader for a gradient fill instead of a color', () => {
        const paint = buildPaint(state({
            fill: 'linear-gradient(90deg, #ff0000, #0000ff)',
        }), 'fill', BOUNDS);

        expect(paint.setShader).toHaveBeenCalled();
        expect(paint.setColor).not.toHaveBeenCalled();
    });

});

describe('toSkiaShader', () => {

    test('Should build a linear gradient shader', () => {
        const shader = toSkiaShader('linear-gradient(90deg, #ff0000, #0000ff)', BOUNDS);

        expect(shader).toBeTruthy();
        expect(Skia.Shader.MakeLinearGradient).toHaveBeenCalled();
    });

    test('Should build a radial gradient shader', () => {
        toSkiaShader('radial-gradient(#ff0000, #0000ff)', BOUNDS);

        expect(Skia.Shader.MakeRadialGradient).toHaveBeenCalled();
    });

    test('Should build a conic gradient shader', () => {
        toSkiaShader('conic-gradient(#ff0000, #0000ff)', BOUNDS);

        expect(Skia.Shader.MakeSweepGradient).toHaveBeenCalled();
    });

    test('Should materialize a pattern into an image shader', () => {
        const shader = toSkiaShader('pattern(dots, #000000, transparent, 8)', BOUNDS);

        expect(shader).toBeTruthy();
        expect(Skia.Surface.MakeOffscreen).toHaveBeenCalled();
    });

    test('Should return null for a plain color', () => {
        expect(toSkiaShader('#ff0000', BOUNDS)).toBeNull();
    });

});

describe('parseFont', () => {

    test('Should parse weight, size and family from a shorthand', () => {
        expect(parseFont('bold 16px Menlo')).toMatchObject({
            size: 16,
            family: 'Menlo',
            weight: 700,
        });
    });

    test('Should parse an italic slant', () => {
        expect(parseFont('italic 12px sans-serif').slant).toBe(1);
    });

    test('Should fall back to defaults for an unparseable value', () => {
        expect(parseFont('')).toMatchObject({
            size: 12,
            family: 'sans-serif',
        });
    });

});

describe('measureSkiaText', () => {

    test('Should sum glyph advances and expose a full TextMetrics', () => {
        const metrics = measureSkiaText('abc', {
            font: '12px sans-serif',
        });

        expect(metrics.width).toBe(21);
        expect(metrics.actualBoundingBoxAscent).toBe(8);
        expect(metrics.actualBoundingBoxDescent).toBe(2);
        expect(metrics).toHaveProperty('fontBoundingBoxAscent');
        expect(metrics).toHaveProperty('hangingBaseline');
    });

    test('Should measure empty text as zero width', () => {
        expect(measureSkiaText('').width).toBe(0);
    });

});

describe('ReactNativeSkiaContext', () => {

    test('Should support path caching and create Skia-backed paths', () => {
        const context = new ReactNativeSkiaContext();

        expect(context.supportsPathCaching).toBe(true);
        expect(context.createPath()).toBeInstanceOf(ReactNativeSkiaPath);
    });

    test('Should record a picture per batch and present it to listeners', () => {
        const context = new ReactNativeSkiaContext({
            width: 40,
            height: 30,
        });

        const pictures: unknown[] = [];
        const subscription = context.onPresent(picture => pictures.push(picture));

        context.batch(() => undefined);

        expect(Skia.PictureRecorder).toHaveBeenCalledTimes(1);
        expect(pictures).toHaveLength(1);
        expect(pictures[0]).toMatchObject({
            __picture: true,
        });

        subscription.dispose();
        context.batch(() => undefined);

        expect(pictures).toHaveLength(1);
    });

    test('Should route a fill to drawPath on the recording canvas', () => {
        const context = new ReactNativeSkiaContext({
            width: 20,
            height: 20,
        });

        const path = context.createPath();

        path.rect(0, 0, 10, 10);

        context.batch(() => context.applyFill(path));

        const recorder = Skia.PictureRecorder.mock.results.at(-1)!.value;
        const canvas = recorder.beginRecording.mock.results.at(-1)!.value;

        expect(canvas.drawPath).toHaveBeenCalled();
    });

    test('Should resize and emit a single resize event, ignoring no-op resizes', () => {
        const context = new ReactNativeSkiaContext();
        const onResize = vi.fn();

        context.on('resize', onResize);
        context.resize(120, 90);

        expect(context.width).toBe(120);
        expect(context.height).toBe(90);
        expect(onResize).toHaveBeenCalledTimes(1);

        context.resize(120, 90);
        expect(onResize).toHaveBeenCalledTimes(1);
    });

    test('Should delegate point-in-path to the Skia path', () => {
        const context = new ReactNativeSkiaContext();
        const path = context.createPath();

        expect(context.isPointInPath(path, 5, 5)).toBe(true);
        expect(path.skia.setFillType).toHaveBeenCalled();
    });

    test('Should measure text via Skia metrics', () => {
        const context = new ReactNativeSkiaContext();

        expect(context.measureText('abcd').width).toBe(28);
    });

});
