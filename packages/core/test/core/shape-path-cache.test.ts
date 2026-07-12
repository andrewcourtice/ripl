import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createContext,
} from '@ripl/canvas';

import {
    createContext as createSvgContext,
} from '@ripl/svg';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createCircle,
    factory,
} from '../../src';

describe('Shape2D path caching', () => {

    let target: HTMLDivElement;

    beforeEach(() => {
        polyfillPath2D();
        mockCanvasContext();
        factory.set({
            createContext,
        });
        target = document.createElement('div');
        document.body.appendChild(target);
    });

    afterEach(() => {
        target.remove();
        factory.set({
            createContext: undefined,
        });
        vi.restoreAllMocks();
    });

    test('Should expose path-caching support per backend', () => {
        const canvas = createContext(target);
        const svg = createSvgContext(target);

        expect(canvas.supportsPathCaching).toBe(true);
        expect(svg.supportsPathCaching).toBe(false);
    });

    test('Should reuse the path across renders while geometry is unchanged (canvas)', () => {
        const context = createContext(target);
        const createPathSpy = vi.spyOn(context, 'createPath');

        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
            fill: '#ffffff',
        });

        circle.render(context);
        circle.render(context);
        circle.render(context);

        expect(createPathSpy).toHaveBeenCalledTimes(1);
    });

    test('Should rebuild the path when a geometry setter changes state', () => {
        const context = createContext(target);
        const createPathSpy = vi.spyOn(context, 'createPath');

        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
            fill: '#ffffff',
        });

        circle.render(context);
        circle.radius = 8;
        circle.render(context);

        expect(createPathSpy).toHaveBeenCalledTimes(2);
    });

    test('Should rebuild the path when transition interpolation changes geometry', () => {
        const context = createContext(target);
        const createPathSpy = vi.spyOn(context, 'createPath');

        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
            fill: '#ffffff',
        });

        circle.render(context);

        const interpolate = circle.interpolate({
            radius: 20,
        });
        interpolate(0.5);

        circle.render(context);

        expect(createPathSpy).toHaveBeenCalledTimes(2);
    });

    test('Should not cache the path on a backend that rebuilds every frame (svg)', () => {
        const context = createSvgContext(target);
        const createPathSpy = vi.spyOn(context, 'createPath');

        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
            fill: '#ffffff',
        });

        circle.render(context);
        circle.render(context);

        expect(createPathSpy).toHaveBeenCalledTimes(2);
    });

});
