// @vitest-environment node

/**
 * Core's suite otherwise runs under jsdom, so a DOM dependency creeping into the render path would
 * go unnoticed. This file renders the element set with no `window` and no `document`, and pins the
 * two capabilities that are known to degrade rather than work off-platform.
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

// Side-effect import: registers the node factory bindings (overrides vitest.setup.ts).
import '@ripl/node';

import {
    createArc,
    createCircle,
    createEllipse,
    createGroup,
    createLine,
    createPolygon,
    createPolyline,
    createRect,
    createRenderer,
    createScene,
    createText,
    factory,
    getPathLength,
    measureText,
    Navigator,
    samplePathPoint,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/terminal';

import type {
    TerminalOutput,
} from '@ripl/terminal';

function capturingOutput() {
    const frames: string[] = [];

    return {
        frames,
        output: {
            write: (data: string) => void frames.push(data),
            columns: 80,
            rows: 24,
        } as TerminalOutput,
    };
}

describe('Core outside a DOM', () => {

    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        expect(console.error).not.toHaveBeenCalled();
        vi.restoreAllMocks();
    });

    test('Should be running without a document or a window', () => {
        expect(typeof window).toBe('undefined');
        expect(typeof document).toBe('undefined');
    });

    test('Should render every built-in element to a terminal surface', () => {
        const { frames, output } = capturingOutput();
        const scene = createScene(createContext(output));

        scene.add(createGroup({
            id: 'shapes',
            children: [
                createArc({
                    cx: 30,
                    cy: 30,
                    radius: 10,
                    startAngle: 0,
                    endAngle: Math.PI,
                    fill: '#ff0000',
                }),
                createCircle({
                    cx: 60,
                    cy: 30,
                    radius: 8,
                    fill: '#00ff00',
                }),
                createEllipse({
                    cx: 90,
                    cy: 30,
                    radiusX: 12,
                    radiusY: 6,
                    fill: '#0000ff',
                }),
                createLine({
                    x1: 10,
                    y1: 60,
                    x2: 110,
                    y2: 60,
                    stroke: '#ffffff',
                }),
                createPolygon({
                    points: [[10, 80], [40, 80], [25, 100]],
                    fill: '#ffff00',
                }),
                createPolyline({
                    points: [[60, 80], [80, 100], [100, 80]],
                    stroke: '#00ffff',
                }),
                createRect({
                    x: 10,
                    y: 110,
                    width: 40,
                    height: 20,
                    fill: '#ff00ff',
                }),
                createText({
                    x: 60,
                    y: 120,
                    content: 'ripl',
                    fill: '#ffffff',
                }),
            ],
        }));

        scene.render();

        expect(frames.join('')).not.toBe('');

        scene.destroy(true);
    });

    test('Should drive a renderer off the platform animation frame', async () => {
        const { output } = capturingOutput();
        const scene = createScene(createContext(output));
        const renderer = createRenderer(scene);

        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 4,
            fill: '#ffffff',
        });

        scene.add(circle);

        await renderer.transition(circle, {
            duration: 10,
            state: {
                radius: 8,
            },
        });

        expect(circle.radius).toBe(8);

        renderer.destroy();
        scene.destroy(true);
    });

    test('Should measure text through the platform binding', () => {
        expect(measureText('ripl').width).toBeGreaterThan(0);
    });

    test('Should hand back the base navigator, which drives the view without input', () => {
        const { output } = capturingOutput();
        const navigator = factory.createNavigator(createContext(output));

        expect(navigator).toBeInstanceOf(Navigator);

        navigator.zoomTo(3, [0, 0]);

        expect(navigator.transform.k).toBe(3);

        navigator.destroy();
    });

    // Known gap: path metrics are measured by an SVG `<path>`, so off-DOM they degrade rather than throw.
    test('Should degrade path metrics rather than throw', () => {
        expect(getPathLength('M0,0 L10,10')).toBe(0);
        expect(samplePathPoint('M0,0 L10,10', 5)).toEqual({
            x: 0,
            y: 0,
            angle: 0,
        });
    });

});
