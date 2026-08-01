import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createCircle,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Path cache invalidation', () => {

    let el: HTMLDivElement;

    beforeEach(() => {
        mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        vi.restoreAllMocks();
    });

    function renderTwice(mutate: (circle: ReturnType<typeof createCircle>) => void) {
        const context = createContext(el);
        const circle = createCircle({
            cx: 50,
            cy: 50,
            radius: 20,
        });

        circle.render(context);

        const createPath = vi.spyOn(context, 'createPath');

        mutate(circle);
        circle.render(context);

        return createPath;
    }

    test('Should re-trace when the geometry changes', () => {
        expect(renderTwice(circle => circle.radius = 30)).toHaveBeenCalled();
    });

    // The traced path is in local space, so a paint change cannot have invalidated it.
    test('Should not re-trace when only the fill changes', () => {
        expect(renderTwice(circle => circle.fill = '#00ff00')).not.toHaveBeenCalled();
    });

    test('Should not re-trace when only the stroke changes', () => {
        expect(renderTwice(circle => circle.stroke = '#00ff00')).not.toHaveBeenCalled();
    });

    test('Should not re-trace when only the opacity changes', () => {
        expect(renderTwice(circle => circle.opacity = 0.5)).not.toHaveBeenCalled();
    });

    // The transform is applied to the context, never to the path.
    test('Should not re-trace when only the position changes', () => {
        expect(renderTwice(circle => circle.translateX = 25)).not.toHaveBeenCalled();
    });

    test('Should not re-trace when only the rotation changes', () => {
        expect(renderTwice(circle => circle.rotation = 1)).not.toHaveBeenCalled();
    });

    test('Should re-trace once per frame while the geometry animates', () => {
        const context = createContext(el);
        const circle = createCircle({
            cx: 50,
            cy: 50,
            radius: 20,
        });

        circle.render(context);

        const createPath = vi.spyOn(context, 'createPath');
        const interpolator = circle.interpolate({
            radius: 40,
        });

        for (let frame = 1; frame <= 5; frame++) {
            interpolator(frame / 5);
            circle.render(context);
        }

        expect(createPath).toHaveBeenCalledTimes(5);
    });

    test('Should not re-trace while only the paint animates', () => {
        const context = createContext(el);
        const circle = createCircle({
            cx: 50,
            cy: 50,
            radius: 20,
            fill: '#ff0000',
        });

        circle.render(context);

        const createPath = vi.spyOn(context, 'createPath');
        const interpolator = circle.interpolate({
            fill: '#0000ff',
        });

        for (let frame = 1; frame <= 5; frame++) {
            interpolator(frame / 5);
            circle.render(context);
        }

        expect(createPath).not.toHaveBeenCalled();
    });

    test('Should clear the geometry flag at the end of a render cycle', () => {
        const context = createContext(el);
        const circle = createCircle({
            cx: 50,
            cy: 50,
            radius: 20,
        });

        circle.radius = 30;

        expect(circle.$geometryDirty).toBe(true);

        circle.render(context);

        expect(circle.$geometryDirty).toBe(false);
    });

});
