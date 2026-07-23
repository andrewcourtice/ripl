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
