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
    createRenderer,
    createScene,
    factory,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    Rect,
    Scene,
    Text,
} from '@ripl/core';

import {
    Tooltip,
} from '../src/components/tooltip';

import type {
    TooltipStyleOptions,
} from '../src/components/tooltip';

function measureByLength(scene: Scene) {
    (scene.context as unknown as { measureText: (text: string) => unknown }).measureText = (text: string) => ({
        width: text.length * 10,
        actualBoundingBoxAscent: 6,
        actualBoundingBoxDescent: 6,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: text.length * 10,
    });
}

describe('Tooltip', () => {

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

    function createTooltipHarness(options?: TooltipStyleOptions) {
        const scene = createScene(element);
        const renderer = createRenderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const tooltip = new Tooltip({
            scene,
            renderer,
            ...options,
        });

        return {
            scene,
            renderer,
            tooltip,
        };
    }

    test('Should render one text element per newline-separated line', () => {
        const {
            scene,
            tooltip,
        } = createTooltipHarness();

        tooltip.show(100, 100, 'first\nsecond');

        const texts = scene.getElementsByType<Text>('text');

        expect(texts).toHaveLength(2);
        expect(texts.map(text => text.content)).toEqual(['first', 'second']);
        expect(texts[1].y).toBeGreaterThan(texts[0].y);
    });

    test('Should reconcile line elements when content shrinks', () => {
        const {
            scene,
            tooltip,
        } = createTooltipHarness();

        tooltip.show(100, 100, 'first\nsecond\nthird');

        expect(scene.getElementsByType('text')).toHaveLength(3);

        tooltip.show(100, 100, 'only');

        const texts = scene.getElementsByType<Text>('text');

        expect(texts).toHaveLength(1);
        expect(texts[0].content).toBe('only');
    });

    test('Should wrap long content to maxWidth when wrapping is enabled', () => {
        const {
            scene,
            tooltip,
        } = createTooltipHarness({
            maxWidth: 100,
            wrap: true,
        });

        measureByLength(scene);

        tooltip.show(100, 100, 'aaaa bbbb cccc');

        const texts = scene.getElementsByType<Text>('text');

        expect(texts.map(text => text.content)).toEqual([
            'aaaa',
            'bbbb',
            'cccc',
        ]);
    });

    test('Should size the box to its content when wrapping is off', () => {
        const {
            scene,
            tooltip,
        } = createTooltipHarness({
            maxWidth: 100,
            padding: 8,
        });

        measureByLength(scene);

        // 14 chars at 10px = 140px against a 100px `maxWidth`; with no wrapping there is nothing to wrap to.
        tooltip.show(100, 100, 'aaaa bbbb cccc');

        const [text] = scene.getElementsByType<Text>('text');
        const [box] = scene.getElementsByType<Rect>('rect');

        expect(text.content).toBe('aaaa bbbb cccc');
        expect(box.width).toBeGreaterThanOrEqual(140 + 8 * 2);
    });

    test('Should not let an unwrapped box exceed the scene width', () => {
        const {
            scene,
            tooltip,
        } = createTooltipHarness({ padding: 8 });

        // jsdom reports no layout, so the scene starts 0x0 — size it so there is a real bound to clamp to.
        scene.context.rescale(600, 400);
        measureByLength(scene);

        tooltip.show(100, 100, 'a'.repeat(400));

        const [box] = scene.getElementsByType<Rect>('rect');

        expect(box.width).toBeLessThanOrEqual(scene.width);
    });

    test('Should apply wrap and maxWidth through setOptions at runtime', () => {
        const {
            scene,
            tooltip,
        } = createTooltipHarness();

        measureByLength(scene);

        tooltip.show(100, 100, 'aaaa bbbb cccc');

        expect(scene.getElementsByType('text')).toHaveLength(1);

        tooltip.setOptions({
            maxWidth: 100,
            wrap: true,
        });

        tooltip.show(100, 100, 'aaaa bbbb cccc');

        expect(scene.getElementsByType('text')).toHaveLength(3);
    });

});
