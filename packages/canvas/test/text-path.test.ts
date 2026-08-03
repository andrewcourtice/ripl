import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    mockTextMetrics,
} from '@ripl/test-utils';

import {
    renderTextAlongPath,
} from '../src/utilities';

import {
    ContextText,
    getPathLength,
    samplePathPoint,
} from '@ripl/core';

import type * as Core from '@ripl/core';

// jsdom implements neither `getTotalLength` nor `getPointAtLength`, so the path primitives are
// replaced with a straight horizontal line running from the origin to the `L` coordinate.
vi.mock('@ripl/core', async importOriginal => {
    const actual = await importOriginal<typeof Core>();
    const lengthOf = (pathData: string) => Number(/L(\d+)/.exec(pathData)?.[1] ?? 0);

    return {
        ...actual,
        getPathLength: vi.fn(lengthOf),
        samplePathPoint: vi.fn((pathData: string, distance: number) => ({
            x: Math.max(0, Math.min(lengthOf(pathData), distance)),
            y: 0,
            angle: 0,
        })),
    };
});

describe('Canvas text along a path', () => {

    let stub: ReturnType<typeof mockCanvasContext>;

    beforeEach(() => {
        stub = mockTextMetrics(mockCanvasContext(), {
            charWidth: 10,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    function render(content: string, pathData: string, options?: {
        startOffset?: number;
        maxWidth?: number;
    }) {
        const element = new ContextText({
            x: 0,
            y: 0,
            content,
            pathData,
            ...options,
        });

        renderTextAlongPath(stub as unknown as CanvasRenderingContext2D, element, 'fill');

        return stub.translate.mock.calls;
    }

    // CANVAS-13: glyphs were placed at their own mid-point but drawn with the context's alignment,
    // so under the canvas default of `start` the whole string slid forward by half a glyph.
    test('Should place each glyph at its own advance offset under the default alignment', () => {
        expect(render('AB', 'M0,0 L1000,0')).toEqual([[0, 0], [10, 0]]);
    });

    test('Should place each glyph at its mid-point under a centered alignment', () => {
        stub.textAlign = 'center';

        expect(render('AB', 'M0,0 L1001,0')).toEqual([[5, 0], [15, 0]]);
    });

    test('Should place each glyph at the end of its advance under a right alignment', () => {
        stub.textAlign = 'right';

        expect(render('AB', 'M0,0 L1002,0')).toEqual([[10, 0], [20, 0]]);
    });

    test('Should draw one glyph per character that fits', () => {
        render('AB', 'M0,0 L1003,0');

        expect(stub.fillText).toHaveBeenCalledTimes(2);
    });

    test('Should stroke each glyph when the stroke method is used', () => {
        const element = new ContextText({
            x: 0,
            y: 0,
            content: 'AB',
            pathData: 'M0,0 L1004,0',
        });

        renderTextAlongPath(stub as unknown as CanvasRenderingContext2D, element, 'stroke');

        expect(stub.strokeText).toHaveBeenCalledTimes(2);
    });

    // A negative offset used to stack every leading glyph on the path start, because the sampler
    // clamps the distance but the layout kept advancing from a negative one.
    test('Should clamp a negative start offset to the start of the path', () => {
        const calls = render('ABC', 'M0,0 L1005,0', {
            startOffset: -0.5,
        });

        expect(calls).toEqual([[0, 0], [10, 0], [20, 0]]);
    });

    test('Should lay out from a fractional start offset', () => {
        const calls = render('A', 'M0,0 L1000,0', {
            startOffset: 0.5,
        });

        expect(calls).toEqual([[500, 0]]);
    });

    test('Should stop laying out glyphs past the maximum width', () => {
        const calls = render('ABCD', 'M0,0 L1006,0', {
            maxWidth: 25,
        });

        expect(calls).toEqual([[0, 0], [10, 0], [20, 0]]);
    });

    test('Should drop glyphs whose mid-point falls past the end of the path', () => {
        const calls = render('ABCD', 'M0,0 L25,0');

        expect(calls).toEqual([[0, 0], [10, 0], [20, 0]]);
    });

    // CANVAS-15: every glyph re-parsed the whole `d` attribute, once per element per frame.
    test('Should not re-measure the path on the next frame', () => {
        render('ABCD', 'M0,0 L500,0');
        render('ABCD', 'M0,0 L500,0');

        expect(vi.mocked(getPathLength)).toHaveBeenCalledTimes(1);
    });

    test('Should not re-sample a glyph position on the next frame', () => {
        render('ABCD', 'M0,0 L501,0');

        const sampled = vi.mocked(samplePathPoint).mock.calls.length;

        render('ABCD', 'M0,0 L501,0');

        expect(vi.mocked(samplePathPoint)).toHaveBeenCalledTimes(sampled);
    });

});
