import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createCircle,
    createRect,
    createScene,
    createText,
    factory,
} from '../../src';

import type {
    Element,
    Scene,
} from '../../src';

/** Options controlling the shape, spread, and composition of a generated element set. */
export interface FixtureOptions {
    width?: number;
    height?: number;
    /** Fraction (0–1) of generated elements that are text (the rest alternate circle/rect). */
    textFraction?: number;
    /** Attach a `mousemove` listener to each element so it participates in hit testing. */
    interactive?: boolean;
}

/**
 * Installs the canvas platform factory backed by the stub context so scenes can be constructed and
 * rendered headlessly. Call once per bench/test module before mounting a scene.
 */
export function installCanvasFactory(): void {
    polyfillPath2D();
    mockCanvasContext();
    factory.set({
        createContext,
    });
}

/**
 * Generates `count` elements spread deterministically across the viewport — a mix of circles, rects,
 * and (optionally) text — for rendering, hit-testing, and interpolation benchmarks.
 */
export function createElements(count: number, options: FixtureOptions = {}): Element[] {
    const {
        width = 1920,
        height = 1080,
        textFraction = 0,
        interactive = false,
    } = options;

    const columns = Math.ceil(Math.sqrt(count));
    const elements: Element[] = [];

    for (let index = 0; index < count; index++) {
        const cx = (index % columns) / columns * width;
        const cy = Math.floor(index / columns) / columns * height;
        const hue = index % 360;

        let element: Element;

        if (textFraction > 0 && index % Math.round(1 / textFraction) === 0) {
            element = createText({
                x: cx,
                y: cy,
                content: `label-${index}`,
                fill: `hsl(${hue}, 70%, 50%)`,
            });
        } else if (index % 2 === 0) {
            element = createCircle({
                cx,
                cy,
                radius: 6,
                fill: `hsl(${hue}, 70%, 50%)`,
            });
        } else {
            element = createRect({
                x: cx,
                y: cy,
                width: 10,
                height: 10,
                fill: `hsl(${hue}, 70%, 50%)`,
            });
        }

        if (interactive) {
            element.on('mousemove', () => undefined);
        }

        elements.push(element);
    }

    return elements;
}

/** A mounted scene fixture plus its generated elements and DOM target, ready to render. */
export interface SceneFixture {
    scene: Scene;
    elements: Element[];
    target: HTMLElement;
}

/**
 * Mounts a scene populated with `count` generated elements. The elements are supplied via the scene
 * constructor so the flat render buffer is available synchronously (the async `graph` rebuffer is
 * not needed for a one-shot render).
 */
export function mountScene(count: number, options: FixtureOptions = {}): SceneFixture {
    installCanvasFactory();

    const target = document.createElement('div');
    document.body.appendChild(target);

    const elements = createElements(count, options);
    const scene = createScene(target, {
        renderOnResize: false,
        children: elements,
    });

    return {
        scene,
        elements,
        target,
    };
}
