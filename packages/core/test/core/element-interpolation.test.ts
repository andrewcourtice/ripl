import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCircle,
    createRect,
} from '../../src';

import type {
    Interpolator,
    InterpolatorFactory,
} from '../../src';

describe('Element.interpolate', () => {

    test('Should interpolate numeric props from current to target', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 50,
        });

        const interpolator = rect.interpolate({
            x: 200,
            width: 300,
        });

        interpolator(0);
        expect(rect.x).toBe(0);
        expect(rect.width).toBe(100);

        interpolator(0.5);
        expect(rect.x).toBeCloseTo(100, 5);
        expect(rect.width).toBeCloseTo(200, 5);

        interpolator(1);
        expect(rect.x).toBe(200);
        expect(rect.width).toBe(300);
    });

    test('Should not mutate props not in target state', () => {
        const rect = createRect({
            x: 10,
            y: 20,
            width: 100,
            height: 50,
        });

        const interpolator = rect.interpolate({ x: 50 });

        interpolator(0.5);
        expect(rect.y).toBe(20);
        expect(rect.height).toBe(50);
    });

    test('Should skip props where current value is nil', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 50,
        });

        // fillStyle is undefined by default on state (inherits from parent)
        const interpolator = rect.interpolate({
            fillStyle: '#ff0000',
            x: 50,
        });

        interpolator(0.5);
        expect(rect.x).toBeCloseTo(25, 5);
    });

    test('Should interpolate color props (fillStyle)', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            fillStyle: '#000000',
        });

        const interpolator = rect.interpolate({
            fillStyle: '#ffffff',
        });

        interpolator(0);
        expect(rect.fillStyle).toBe('rgba(0, 0, 0, 1)');

        interpolator(1);
        expect(rect.fillStyle).toBe('rgba(255, 255, 255, 1)');
    });

    test('Should interpolate globalAlpha (numeric)', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            globalAlpha: 0,
        });

        const interpolator = rect.interpolate({
            globalAlpha: 1,
        });

        interpolator(0.5);
        expect(rect.globalAlpha).toBeCloseTo(0.5, 5);

        interpolator(1);
        expect(rect.globalAlpha).toBe(1);
    });

    test('Should accept custom interpolator function as value', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 50,
        });

        const customInterpolator: Interpolator<number> = (time) => time * time * 200;

        const interpolator = rect.interpolate({
            x: customInterpolator as unknown as number,
        });

        interpolator(0.5);
        expect(rect.x).toBeCloseTo(50, 5);

        interpolator(1);
        expect(rect.x).toBe(200);
    });

    test('Should accept custom interpolator overrides via second arg', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 50,
        });

        const customFactory: InterpolatorFactory<number> = (a, b) => {
            return (time) => a + (b - a) * time * time;
        };


        const interpolator = rect.interpolate(
            { x: 200 },
            { x: customFactory } as any
        );

        interpolator(0.5);
        // custom: 0 + 200 * 0.25 = 50
        expect(rect.x).toBeCloseTo(50, 5);

        interpolator(1);
        expect(rect.x).toBe(200);
    });

    test('Should interpolate keyframe arrays with explicit offsets', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 50,
        });

        const interpolator = rect.interpolate({
            x: [
                {
                    offset: 0,
                    value: 0,
                },
                {
                    offset: 0.5,
                    value: 200,
                },
                {
                    offset: 1,
                    value: 100,
                },
            ],
        });

        interpolator(0);
        expect(rect.x).toBe(0);

        interpolator(1);
        expect(rect.x).toBe(100);
    });

    test('Should interpolate multiple props simultaneously', () => {
        const circle = createCircle({
            cx: 0,
            cy: 0,
            radius: 10,
        });

        const interpolator = circle.interpolate({
            cx: 100,
            cy: 200,
            radius: 50,
        });

        interpolator(0.5);
        expect(circle.cx).toBeCloseTo(50, 5);
        expect(circle.cy).toBeCloseTo(100, 5);
        expect(circle.radius).toBeCloseTo(30, 5);

        interpolator(1);
        expect(circle.cx).toBe(100);
        expect(circle.cy).toBe(200);
        expect(circle.radius).toBe(50);
    });

    test('Should return a function', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const interpolator = rect.interpolate({ x: 100 });
        expect(typeof interpolator).toBe('function');
    });

    test('Should handle interpolating to the same value (no-op)', () => {
        const rect = createRect({
            x: 50,
            y: 0,
            width: 10,
            height: 10,
        });

        const interpolator = rect.interpolate({ x: 50 });

        interpolator(0.5);
        expect(rect.x).toBe(50);

        interpolator(1);
        expect(rect.x).toBe(50);
    });

    test('Should handle negative target values', () => {
        const rect = createRect({
            x: 100,
            y: 0,
            width: 10,
            height: 10,
        });

        const interpolator = rect.interpolate({ x: -100 });

        interpolator(0.5);
        expect(rect.x).toBeCloseTo(0, 5);

        interpolator(1);
        expect(rect.x).toBe(-100);
    });

    test('Should handle lineWidth interpolation', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            lineWidth: 1,
        });

        const interpolator = rect.interpolate({ lineWidth: 5 });

        interpolator(0.5);
        expect(rect.lineWidth).toBeCloseTo(3, 5);

        interpolator(1);
        expect(rect.lineWidth).toBe(5);
    });

});
