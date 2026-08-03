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
    createPolyline,
} from '@ripl/core';

import type {
    Point,
    PolylineSegment,
} from '@ripl/core';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

const POINTS: Point[] = [
    [0, 0],
    [10, 20],
    [20, 10],
    [30, 30],
    [40, 5],
    [50, 25],
];

describe('Segmented polylines on SVG', () => {

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

    function renderPass(segments?: PolylineSegment[]) {
        ctx.save();
        ctx.markRenderStart();

        createPolyline({
            id: 'line',
            stroke: '#ff0000',
            lineWidth: 3,
            points: POINTS,
            segments,
        }).render(ctx);

        ctx.markRenderEnd();
        ctx.restore();

    }

    function paths() {
        return Array.from(ctx.element.querySelectorAll('path'));
    }

    test('Should emit one dasharray-carrying path per run', () => {
        renderPass([{
            from: 1,
            to: 3,
            lineDash: [6, 4],
        }]);

        const stroked = paths().filter(path => path.style.stroke && path.style.stroke !== 'none');

        expect(stroked.map(path => path.id)).toEqual(['line:0', 'line:1', 'line:2']);
        expect(stroked.map(path => path.style.strokeDasharray)).toEqual(['', '6 4', '']);
        expect(stroked.every(path => path.style.strokeWidth === '3')).toBe(true);
    });

    test('Should leave the unstroked full path invisible', () => {
        renderPass([{
            from: 1,
            to: 3,
            lineDash: [6, 4],
        }]);

        const full = ctx.element.querySelector('#line') as SVGPathElement;

        expect(full).not.toBeNull();
        expect(full.style.stroke).toBe('none');
        expect(full.style.fill).toBe('none');
        expect(full.getAttribute('d')).not.toBe('');
    });

    test('Should draw every span of the line exactly once', () => {
        renderPass([{
            from: 1,
            to: 3,
            lineDash: [6, 4],
        }]);

        const stroked = paths().filter(path => path.style.stroke && path.style.stroke !== 'none');
        const commands = stroked.map(path => (path.getAttribute('d') ?? '').split(/(?=[ML])/).length);

        expect(commands).toEqual([2, 3, 3]);
    });

    test('Should remove stale run paths when the segment count shrinks', () => {
        renderPass([
            {
                from: 1,
                to: 2,
                lineDash: [6, 4],
            },
            {
                from: 3,
                to: 4,
                lineDash: [2, 3],
            },
        ]);

        expect(paths().map(path => path.id)).toContain('line:4');

        renderPass([{
            from: 1,
            to: 2,
            lineDash: [6, 4],
        }]);

        const ids = paths().map(path => path.id);

        expect(ids).toContain('line:2');
        expect(ids).not.toContain('line:3');
        expect(ids).not.toContain('line:4');
    });

    test('Should stroke the full path when unsegmented', () => {
        renderPass();

        const full = ctx.element.querySelector('#line') as SVGPathElement;

        expect(paths()).toHaveLength(1);
        expect(full.style.stroke).toBe('rgb(255, 0, 0)');
    });

});
