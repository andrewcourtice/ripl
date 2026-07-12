import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    CHART_IDS,
} from './visual/chart-ids';

/**
 * Exercises every chart type's construction + initial render path. The deterministic gallery module
 * (shared with the Playwright visual harness) builds one of each chart into the document; importing
 * it under the canvas mock renders the whole catalogue in jsdom. This guards against a chart type
 * throwing during construction/render — the failure mode a per-type unit test is meant to catch.
 */
describe('chart catalogue', () => {

    beforeAll(async () => {
        polyfillPath2D();
        mockCanvasContext();

        // `@ripl/web` (imported by the gallery) registers the canvas context factory; the gallery
        // body then mounts every chart. Both run during this dynamic import.
        await import('./visual/gallery');

        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    });

    afterAll(() => {
        document.body.innerHTML = '';
        document.body.removeAttribute('data-ready');
    });

    test('mounts every chart in the shared id list', () => {
        expect(document.body.getAttribute('data-ready')).toBe('true');
    });

    for (const id of CHART_IDS) {
        test(`${id} chart renders a canvas`, () => {
            const container = document.querySelector(`[data-chart="${id}"]`);

            expect(container).not.toBeNull();
            expect(container!.querySelector('canvas')).not.toBeNull();
        });
    }

});
