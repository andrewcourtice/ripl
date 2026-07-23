import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import type {
    SVGContext,
} from '../src';

import {
    createContext,
} from '../src';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

interface ContextInternals {
    _patternCache: Map<string, unknown>;
}

describe('SVG pattern defs', () => {

    let el: HTMLDivElement;
    let ctx: SVGContext;

    beforeEach(() => {
        mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
        ctx = createContext(el);
    });

    afterEach(() => {
        ctx.destroy();
        el.remove();
        vi.restoreAllMocks();
    });

    function getInternals() {
        return ctx as unknown as ContextInternals;
    }

    function getDefs() {
        return ctx.element.querySelector('defs')!;
    }

    function renderPass(body: () => void) {
        ctx.save();
        ctx.markRenderStart();
        body();
        ctx.markRenderEnd();
        ctx.restore();
        ctx.export();
    }

    function drawRect(id: string) {
        const path = ctx.createPath(id);
        path.rect(0, 0, 10, 10);
        ctx.applyFill(path);
    }

    test('Should materialize a pattern fill as one <pattern> def with tile shapes', () => {
        renderPass(() => {
            ctx.fill = 'pattern(diagonal, #1a6, #ffffff, 8)';
            drawRect('p1');
        });

        const defs = getDefs();

        expect(defs.childElementCount).toBe(1);

        const pattern = defs.firstElementChild!;

        expect(pattern.tagName.toLowerCase()).toBe('pattern');
        expect(pattern.getAttribute('patternUnits')).toBe('userSpaceOnUse');
        expect(pattern.getAttribute('width')).toBe('8');
        // Background rect + three diagonal lines.
        expect(pattern.querySelectorAll('rect')).toHaveLength(1);
        expect(pattern.querySelectorAll('line')).toHaveLength(3);
        expect(getInternals()._patternCache.size).toBe(1);
    });

    test('Should reuse the def across passes and update it when the pattern changes', () => {
        renderPass(() => {
            ctx.fill = 'pattern(dots, red, transparent, 8)';
            drawRect('p1');
        });

        const first = getDefs().firstElementChild!;

        renderPass(() => {
            ctx.fill = 'pattern(dots, red, transparent, 16)';
            drawRect('p1');
        });

        expect(getDefs().childElementCount).toBe(1);
        expect(getDefs().firstElementChild).toBe(first);
        expect(first.getAttribute('width')).toBe('16');
    });

    test('Should sweep pattern defs when the element is no longer rendered', () => {
        renderPass(() => {
            ctx.fill = 'pattern(vertical, #333, transparent, 6)';
            drawRect('p1');
        });

        expect(getDefs().childElementCount).toBe(1);

        renderPass(() => {
            // p1 not rendered this pass
        });

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._patternCache.size).toBe(0);
    });

    test('Should sweep a pattern def when the fill becomes a solid color', () => {
        renderPass(() => {
            ctx.fill = 'pattern(cross-hatch, #333, transparent, 6)';
            drawRect('p1');
        });

        expect(getDefs().childElementCount).toBe(1);

        renderPass(() => {
            ctx.fill = 'red';
            drawRect('p1');
        });

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._patternCache.size).toBe(0);
    });

});
