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
    createScene,
    createText,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    BrailleRasterizer,
} from '../src/rasterizer';

import {
    createContext,
} from '../src/context';

import {
    createMockOutput,
    createSpyRasterizer,
} from './helpers';

polyfillPath2D();

/**
 * Regression tests for the terminal rendering-context audit, which found the backend discarding
 * every transform, clipping nothing, hit-testing nothing, and letting whichever shape painted a
 * cell last take its whole color.
 */
describe('Terminal audit findings', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    // ── TERM-1: transforms were dropped, not approximated ─────────

    test('TERM-1: Should draw a translated group where the transform puts it', () => {
        const rasterizer = createSpyRasterizer(40, 12);
        const context = createContext(createMockOutput(40, 12), {
            rasterizer,
        });

        const group = createGroup({
            translateX: 20,
            translateY: 8,
        });

        group.add(createRect({
            fill: '#ff0000',
            x: 0,
            y: 0,
            width: 8,
            height: 4,
        }));

        context.batch(() => group.render(context));

        expect(rasterizer.pixels.length).toBeGreaterThan(0);
        expect(rasterizer.pixels.every(([x, y]) => x >= 20 && y >= 8)).toBe(true);
    });

    // A square marker is a quad rotated by a quarter of a right angle; unrotated it is a diamond.
    test('TERM-1: Should rotate a marker rather than drawing it unrotated', () => {
        const render = (rotation: number) => {
            const context = createContext(createMockOutput(40, 12));

            context.batch(() => createRect({
                fill: '#ff0000',
                x: 30,
                y: 16,
                width: 12,
                height: 12,
                rotation,
                transformOriginX: '50%',
                transformOriginY: '50%',
            }).render(context));

            return context.export().toString();
        };

        expect(render(Math.PI / 4)).not.toBe(render(0));
    });

    test('TERM-1: Should never warn that a transform was discarded', () => {
        const context = createContext(createMockOutput());

        expect(() => {
            context.translate(10, 20);
            context.rotate(Math.PI / 2);
            context.scale(2, 2);
        }).not.toThrow();
    });

    // ── TERM-2: a rotated glyph run had nowhere to go ─────────────

    test('TERM-2: Should run a quarter-turn axis title down a column', () => {
        const rasterizer = createSpyRasterizer(40, 12);
        const context = createContext(createMockOutput(40, 12), {
            rasterizer,
        });

        context.batch(() => createText({
            fill: '#ffffff',
            x: 20,
            y: 4,
            content: 'Revenue',
            rotation: -Math.PI / 2,
            transformOriginX: 20,
            transformOriginY: 4,
            textBaseline: 'top',
        }).render(context));

        expect(rasterizer.text()).toBe('Revenue');
        expect(new Set(rasterizer.chars.map(([col]) => col)).size).toBe(1);
    });

    // ── TERM-3: applyClip was an inherited no-op ──────────────────

    test('TERM-3: Should confine drawing to the clip region', () => {
        const rasterizer = createSpyRasterizer(20, 6);
        const context = createContext(createMockOutput(20, 6), {
            rasterizer,
        });

        const clip = context.createPath();

        clip.rect(0, 0, 8, 12);

        context.markRenderStart();
        context.applyClip(clip);
        context.fill = '#ff0000';

        const shape = context.createPath();

        shape.rect(0, 0, 40, 12);
        context.applyFill(shape);
        context.markRenderEnd();

        expect(rasterizer.pixels.length).toBeGreaterThan(0);
        expect(rasterizer.pixels.every(([x]) => x <= 8)).toBe(true);
    });

    // A clipping shape skips its own restore so the clip reaches later siblings; the scene root has
    // to absorb that save, or the state stack grows by one every frame.
    test('TERM-3: Should keep the save depth balanced across frames with a root-level clip', () => {
        const context = createContext(createMockOutput(20, 6));
        const scene = createScene(context);

        scene.add(createCircle({
            clip: true,
            cx: 10,
            cy: 10,
            radius: 5,
        }));

        scene.add(createRect({
            fill: '#ff0000',
            x: 0,
            y: 0,
            width: 20,
            height: 10,
        }));

        const depths: number[] = [];

        for (let frame = 0; frame < 5; frame++) {
            scene.render();
            depths.push((context as unknown as {
                saveDepth: number;
            }).saveDepth);
        }

        expect(depths).toEqual([0, 0, 0, 0, 0]);
    });

    // ── TERM-4: isPointInPath always returned false ───────────────

    test('TERM-4: Should hit a translated element at its drawn position', () => {
        const context = createContext(createMockOutput(40, 12));

        const rect = createRect({
            fill: '#ff0000',
            x: 0,
            y: 0,
            width: 20,
            height: 10,
            translateX: 30,
            translateY: 10,
        });

        context.batch(() => rect.render(context));

        expect(rect.intersectsWith(35, 12)).toBe(true);
        expect(rect.intersectsWith(5, 2)).toBe(false);
    });

    test('TERM-4: Should map a hit point back through the element transform', () => {
        expect(createContext(createMockOutput()).hitTestHonorsTransform).toBe(false);
    });

    // ── TERM-5: a cell took whichever color painted it last ───────

    test('TERM-5: Should blend two colors sharing one cell', () => {
        const rasterizer = new BrailleRasterizer(2, 1);

        rasterizer.setPixel(0, 0, [255, 0, 0, 1]);
        rasterizer.setPixel(1, 0, [0, 0, 255, 1]);

        expect(rasterizer.serialize()).toContain('\x1b[38;2;128;0;128m');
    });

    test('TERM-5: Should composite a translucent paint over what is already there', () => {
        const rasterizer = new BrailleRasterizer(1, 1);

        rasterizer.setPixel(0, 0, [255, 255, 255, 1]);
        rasterizer.setPixel(0, 0, [255, 0, 0, 0.5]);

        expect(rasterizer.serialize()).toContain('\x1b[38;2;255;128;128m');
    });

    // A lone translucent paint has nothing but the assumed background beneath it.
    test('TERM-5: Should composite a translucent paint against the background', () => {
        const rasterizer = new BrailleRasterizer(1, 1);

        rasterizer.setPixel(0, 0, [255, 0, 0, 0.5]);

        expect(rasterizer.serialize()).toContain('\x1b[38;2;128;0;0m');
    });

    // Alpha is stored in 8 bits, so a half-opaque paint reads back as 128/255 rather than exactly a half.
    test('TERM-5: Should composite against a configured background instead', () => {
        const rasterizer = new BrailleRasterizer(1, 1, {
            background: [255, 255, 255, 1],
        });

        rasterizer.setPixel(0, 0, [0, 0, 0, 0.5]);

        expect(rasterizer.serialize()).toContain('\x1b[38;2;127;127;127m');
    });

    // ── TERM-6: text and teardown assumed braille cell geometry ───

    test('TERM-6: Should place text using the rasterizer\'s own cell size', () => {
        const rasterizer = createSpyRasterizer(40, 12);

        Object.defineProperty(rasterizer, 'cellWidth', {
            value: 4,
        });

        const context = createContext(createMockOutput(40, 12), {
            rasterizer,
        });

        context.batch(() => createText({
            fill: '#ffffff',
            x: 40,
            y: 0,
            content: 'AB',
            textBaseline: 'top',
        }).render(context));

        expect(rasterizer.chars.map(([col]) => col)).toEqual([10, 11]);
    });

    // ── TERM-7: roundRect discarded its radii ─────────────────────

    test('TERM-7: Should draw a rounded rect differently from a square one', () => {
        const render = (radius: number) => {
            const context = createContext(createMockOutput(40, 12));

            context.batch(() => createRect({
                fill: '#ff0000',
                x: 8,
                y: 8,
                width: 40,
                height: 20,
                borderRadius: radius,
            }).render(context));

            return context.export().toString();
        };

        expect(render(8)).not.toBe(render(0));
    });

});
