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
    COLOR_SCHEME_VIRIDIS,
    createRenderer,
    createScene,
    factory,
    parseColor,
    scaleSequential,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    Rect,
} from '@ripl/core';

import {
    ColorLegend,
} from '../src';

function rgb(color: string): [number, number, number] {
    const parsed = parseColor(color);

    if (parsed) {
        return [
            Math.round(parsed[0]),
            Math.round(parsed[1]),
            Math.round(parsed[2]),
        ];
    }

    const [
        red,
        green,
        blue,
    ] = (color.match(/[\d.]+/g) ?? []).map(Number);

    return [
        Math.round(red),
        Math.round(green),
        Math.round(blue),
    ];
}

describe('ColorLegend', () => {

    let element: HTMLDivElement;

    beforeEach(() => {
        polyfillPath2D();
        mockCanvasContext();
        factory.set({
            createContext,
        });
        element = document.createElement('div');
        document.body.appendChild(element);
    });

    afterEach(() => {
        element.remove();
        factory.set({
            createContext: undefined,
        });
        vi.restoreAllMocks();
    });

    test('Should render a gradient bar and value labels for the scale', () => {
        const scene = createScene(element);
        const renderer = createRenderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const legend = new ColorLegend({
            scene,
            renderer,
            scale: scaleSequential(COLOR_SCHEME_VIRIDIS, [0, 100]),
            options: {
                segments: 16,
            },
        });

        legend.render({
            x: 0,
            y: 0,
            width: 320,
            height: 40,
        });

        const rects = scene.getElementsByType<Rect>('rect');
        const texts = scene.getElementsByType('text');

        expect(rects).toHaveLength(16);
        expect(texts.length).toBeGreaterThanOrEqual(2);

        // First and last segments track the scheme endpoints.
        expect(rgb(rects[0].fill)).toEqual(rgb(COLOR_SCHEME_VIRIDIS[0]));
        expect(rgb(rects[rects.length - 1].fill)).toEqual(rgb(COLOR_SCHEME_VIRIDIS[COLOR_SCHEME_VIRIDIS.length - 1]));

        legend.destroy();
        scene.destroy();
    });

    test('Should clear previous elements on re-render', () => {
        const scene = createScene(element);
        const renderer = createRenderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const legend = new ColorLegend({
            scene,
            renderer,
            scale: scaleSequential(COLOR_SCHEME_VIRIDIS, [0, 100]),
            options: {
                segments: 8,
            },
        });

        const region = {
            x: 0,
            y: 0,
            width: 320,
            height: 40,
        };

        legend.render(region);
        legend.render(region);

        expect(scene.getElementsByType('rect')).toHaveLength(8);

        legend.destroy();
        scene.destroy();
    });

});
