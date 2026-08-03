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
    createContext as createCanvasContext,
} from '@ripl/canvas';

import {
    createGroup,
    createPolyline,
    createRect,
    createScene,
    factory,
} from '@ripl/core';

import {
    mockCanvasContext,
    mockCanvasState,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

interface ContextInternals {
    _domCache: Map<string, unknown>;
    _gradientCache: Map<string, unknown>;
    _patternCache: Map<string, unknown>;
    _textPathCache: Map<string, unknown>;
    _clipCache: Map<string, unknown>;
    _shadowCache: Map<string, unknown>;
    _currentTransforms: string[];
}

const GROUP_GRADIENT = 'linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 0, 255))';

// jsdom quotes the url in a serialized `fill`, a real browser does not.
const GRADIENT_REFERENCE = /^url\(["']?#gradient-/;

/**
 * Regression tests for the SVG rendering-context audit (see `docs/audits/svg.md`). Findings whose
 * failure mode is purely visual (S-18, S-19, S-20) are not represented here: jsdom rasterizes
 * nothing and implements no `SVGGeometryElement`, so they are deferred to the Playwright harness.
 */
describe('SVG audit findings', () => {

    let el: HTMLDivElement;

    beforeEach(() => {
        mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        factory.set({
            devicePixelRatio: 1,
        });
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    // The surface is an `SVGSVGElement`, so the spy has to sit on `Element`, not `HTMLElement`.
    function sizeHost(width: number, height: number) {
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
            left: 0,
            top: 0,
            right: width,
            bottom: height,
            width,
            height,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }) as DOMRect);
    }

    function create(): SVGContext {
        return createContext(el) as SVGContext;
    }

    function getInternals(ctx: SVGContext) {
        return ctx as unknown as ContextInternals;
    }

    function renderPass(ctx: SVGContext, body: () => void) {
        ctx.save();
        ctx.markRenderStart();
        body();
        ctx.markRenderEnd();
        ctx.restore();
    }

    // jsdom never loads a blob URL, so the decode has to be driven by hand.
    function stubImageDecode(succeeds: boolean) {
        vi.stubGlobal('Image', class {
            public onload?: () => void;
            public onerror?: () => void;

            public set src(_value: string) {
                queueMicrotask(() => (succeeds ? this.onload : this.onerror)?.());
            }
        });
    }

    // Two leaves at disjoint boxes, so a per-leaf resolve and a group-box resolve cannot coincide.
    function createGradientGroup() {
        return createGroup({
            id: 'G',
            fill: GROUP_GRADIENT,
            children: [
                createRect({
                    id: 'A',
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 50,
                }),
                createRect({
                    id: 'B',
                    x: 100,
                    y: 0,
                    width: 100,
                    height: 50,
                }),
            ],
        });
    }

    // ── S-4 · group gradient resolves against the group's own box ────────

    describe('S-4 · group gradient', () => {

        test('Should resolve a group gradient once against the group box', () => {
            sizeHost(400, 300);

            const ctx = create();
            const scene = createScene(ctx, {
                children: [createGradientGroup()],
            });

            scene.render();

            const gradients = Array.from(ctx.element.querySelectorAll('linearGradient'));

            expect(gradients).toHaveLength(1);
            expect(Number(gradients[0].getAttribute('x1'))).toBeCloseTo(0, 3);
            expect(Number(gradients[0].getAttribute('x2'))).toBeCloseTo(200, 3);

            ctx.destroy();
        });

        test('Should stamp the resolved group paint on the group node', () => {
            sizeHost(400, 300);

            const ctx = create();
            const scene = createScene(ctx, {
                children: [createGradientGroup()],
            });

            scene.render();

            const group = ctx.element.querySelector('#G') as SVGElement;

            expect(group.style.fill).toMatch(GRADIENT_REFERENCE);

            ctx.destroy();
        });

        test('Should give every leaf under the group the same gradient reference', () => {
            sizeHost(400, 300);

            const ctx = create();
            const scene = createScene(ctx, {
                children: [createGradientGroup()],
            });

            scene.render();

            const leafA = ctx.element.querySelector('#A') as SVGElement;
            const leafB = ctx.element.querySelector('#B') as SVGElement;

            // One ramp across the group, not a full ramp restarted over each leaf's own box.
            expect(leafA.style.fill).toMatch(GRADIENT_REFERENCE);
            expect(leafA.style.fill).toBe(leafB.style.fill);

            ctx.destroy();
        });

        test('Should still resolve a leaf gradient against the leaf box', () => {
            sizeHost(400, 300);

            const ctx = create();
            const scene = createScene(ctx, {
                children: [
                    createGroup({
                        id: 'G',
                        children: [
                            createRect({
                                id: 'A',
                                x: 100,
                                y: 0,
                                width: 50,
                                height: 50,
                                fill: GROUP_GRADIENT,
                            }),
                        ],
                    }),
                ],
            });

            scene.render();

            const gradients = Array.from(ctx.element.querySelectorAll('linearGradient'));

            expect(gradients).toHaveLength(1);
            expect(Number(gradients[0].getAttribute('x1'))).toBeCloseTo(100, 3);
            expect(Number(gradients[0].getAttribute('x2'))).toBeCloseTo(150, 3);

            ctx.destroy();
        });

        test('Should resolve a group stroke gradient against the group box too', () => {
            sizeHost(400, 300);

            const ctx = create();
            const scene = createScene(ctx, {
                children: [
                    createGroup({
                        id: 'G',
                        stroke: GROUP_GRADIENT,
                        lineWidth: 2,
                        children: [
                            createRect({
                                id: 'A',
                                x: 0,
                                y: 0,
                                width: 50,
                                height: 50,
                            }),
                            createRect({
                                id: 'B',
                                x: 100,
                                y: 0,
                                width: 100,
                                height: 50,
                            }),
                        ],
                    }),
                ],
            });

            scene.render();

            const gradients = Array.from(ctx.element.querySelectorAll('linearGradient'));
            const group = ctx.element.querySelector('#G') as SVGElement;

            expect(gradients).toHaveLength(1);
            expect(Number(gradients[0].getAttribute('x2'))).toBeCloseTo(200, 3);
            expect(group.style.stroke).toMatch(GRADIENT_REFERENCE);

            ctx.destroy();
        });

        test('Should agree with the canvas backend on the group gradient box', () => {
            sizeHost(400, 300);

            const stub = mockCanvasContext();
            const canvasContext = createCanvasContext(el);
            const canvasScene = createScene(canvasContext, {
                children: [createGradientGroup()],
            });

            canvasScene.render();

            const svgContext = create();
            const svgScene = createScene(svgContext, {
                children: [createGradientGroup()],
            });

            svgScene.render();

            const gradient = svgContext.element.querySelector('linearGradient')!;
            const svgSpan = [
                Number(gradient.getAttribute('x1')),
                Number(gradient.getAttribute('y1')),
                Number(gradient.getAttribute('x2')),
                Number(gradient.getAttribute('y2')),
            ];

            expect(stub.createLinearGradient).toHaveBeenCalledTimes(1);
            expect(stub.createLinearGradient).toHaveBeenCalledWith(...svgSpan);

            svgContext.destroy();
            canvasContext.destroy();
        });

    });

    // ── S-5 · group opacity composites multiplicatively on both backends ─

    describe('S-5 · group opacity', () => {

        function createOpacityScene() {
            return [
                createGroup({
                    id: 'OUTER',
                    opacity: 0.5,
                    children: [
                        createGroup({
                            id: 'INNER',
                            opacity: 0.5,
                            children: [
                                createRect({
                                    id: 'LEAF_OWN',
                                    opacity: 0.5,
                                    fill: '#ff0000',
                                    x: 0,
                                    y: 0,
                                    width: 10,
                                    height: 10,
                                }),
                                createRect({
                                    id: 'LEAF_NONE',
                                    fill: '#00ff00',
                                    x: 20,
                                    y: 0,
                                    width: 10,
                                    height: 10,
                                }),
                            ],
                        }),
                    ],
                }),
            ];
        }

        function getEffectiveOpacity(ctx: SVGContext, id: string): number {
            let node = ctx.element.querySelector(`#${id}`) as SVGElement | null;
            let opacity = 1;

            while (node && node !== ctx.element) {
                opacity *= Number(node.style.opacity || 1);
                node = node.parentElement as unknown as SVGElement | null;
            }

            return opacity;
        }

        test('Should composite a leaf opacity under its ancestor groups', () => {
            sizeHost(400, 300);

            const ctx = create();
            const scene = createScene(ctx, {
                children: createOpacityScene(),
            });

            scene.render();

            expect(getEffectiveOpacity(ctx, 'LEAF_OWN')).toBeCloseTo(0.125, 5);
            expect(getEffectiveOpacity(ctx, 'LEAF_NONE')).toBeCloseTo(0.25, 5);

            ctx.destroy();
        });

        test('Should agree with the canvas backend on the effective alpha', () => {
            sizeHost(400, 300);

            const stub = mockCanvasState(mockCanvasContext());
            const alphas: number[] = [];

            stub.fill = vi.fn(() => alphas.push(stub.globalAlpha));

            const canvasContext = createCanvasContext(el);
            const canvasScene = createScene(canvasContext, {
                children: createOpacityScene(),
            });

            canvasScene.render();

            const svgContext = create();
            const svgScene = createScene(svgContext, {
                children: createOpacityScene(),
            });

            svgScene.render();

            expect(alphas).toHaveLength(2);
            expect(alphas[0]).toBeCloseTo(getEffectiveOpacity(svgContext, 'LEAF_OWN'), 5);
            expect(alphas[1]).toBeCloseTo(getEffectiveOpacity(svgContext, 'LEAF_NONE'), 5);

            svgContext.destroy();
            canvasContext.destroy();
        });

    });

    // ── S-6 · box hit testing is in surface space, not device pixels ─────

    describe('S-6 · box hit testing', () => {

        test('Should hit a box-tested element at a 2x device pixel ratio', () => {
            factory.set({
                devicePixelRatio: 2,
            });
            sizeHost(400, 300);

            const ctx = create();
            const group = createGroup({
                id: 'G',
                children: [
                    createRect({
                        id: 'A',
                        x: 100,
                        y: 100,
                        width: 50,
                        height: 50,
                    }),
                ],
            });

            const scene = createScene(ctx, {
                children: [group],
            });

            scene.render();

            // The halved point (62.5, 62.5) sits outside the box, so a DPR divide reads as a miss.
            expect(group.intersectsWith(ctx.scaleX(125), ctx.scaleY(125))).toBe(true);
            expect(group.intersectsWith(ctx.scaleX(62.5), ctx.scaleY(62.5))).toBe(false);

            ctx.destroy();
        });

    });

    // ── S-7 · the image encode is memoized across frames ─────────────────

    describe('S-7 · image encoding', () => {

        test('Should encode an unchanged image once across repeated frames', () => {
            sizeHost(400, 300);

            const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAAA');
            const ctx = create();
            const image = new Image(64, 64);

            image.src = 'https://example.test/logo.png';

            for (let frame = 0; frame < 3; frame++) {
                renderPass(ctx, () => ctx.drawImage(image, 0, 0, 64, 64));
            }

            expect(toDataURL).toHaveBeenCalledTimes(1);
            expect(ctx.element.querySelector('image')!.getAttribute('href')).toBe('data:image/png;base64,AAAA');

            ctx.destroy();
        });

        test('Should re-encode when the image is drawn at a new size', () => {
            sizeHost(400, 300);

            const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAAA');
            const ctx = create();
            const image = new Image(64, 64);

            image.src = 'https://example.test/logo.png';

            renderPass(ctx, () => ctx.drawImage(image, 0, 0, 64, 64));
            renderPass(ctx, () => ctx.drawImage(image, 0, 0, 32, 32));

            expect(toDataURL).toHaveBeenCalledTimes(2);

            ctx.destroy();
        });

        test('Should re-encode a canvas source, whose pixels move under a stable identity', () => {
            sizeHost(400, 300);

            const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAAA');
            const ctx = create();
            const source = document.createElement('canvas');

            source.width = 32;
            source.height = 32;

            renderPass(ctx, () => ctx.drawImage(source, 0, 0, 32, 32));
            renderPass(ctx, () => ctx.drawImage(source, 0, 0, 32, 32));

            expect(toDataURL).toHaveBeenCalledTimes(2);

            ctx.destroy();
        });

    });

    // ── S-10 · destroy releases every retained cache ─────────────────────

    describe('S-10 · teardown', () => {

        test('Should release every cache on destroy', () => {
            sizeHost(400, 300);

            const ctx = create();

            renderPass(ctx, () => {
                ctx.fill = 'linear-gradient(180deg, red, blue)';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 4;

                const clipPath = ctx.createPath('clip');

                clipPath.rect(0, 0, 5, 5);
                ctx.applyClip(clipPath);

                const path = ctx.createPath('shape');

                path.rect(0, 0, 10, 10);
                ctx.applyFill(path);

                ctx.createText({
                    id: 'label',
                    x: 0,
                    y: 0,
                    content: 'Hello',
                    pathData: 'M0,0 L10,10',
                });
            });

            const internals = getInternals(ctx);

            expect(internals._domCache.size).toBeGreaterThan(0);
            expect(internals._gradientCache.size).toBeGreaterThan(0);

            ctx.destroy();

            expect(internals._domCache.size).toBe(0);
            expect(internals._gradientCache.size).toBe(0);
            expect(internals._patternCache.size).toBe(0);
            expect(internals._textPathCache.size).toBe(0);
            expect(internals._clipCache.size).toBe(0);
            expect(internals._shadowCache.size).toBe(0);
        });

        test('Should drop the transform and clip scopes on reset', () => {
            sizeHost(400, 300);

            const ctx = create();

            ctx.save();
            ctx.markRenderStart();
            ctx.translate(10, 20);

            const clipPath = ctx.createPath('clip');

            clipPath.rect(0, 0, 5, 5);
            ctx.applyClip(clipPath);
            ctx.reset();

            const path = ctx.createPath('after');

            ctx.applyFill(path);
            ctx.markRenderEnd();

            expect(getInternals(ctx)._currentTransforms).toEqual([]);
            expect(ctx.element.querySelector(':scope > #after')).not.toBeNull();

            ctx.destroy();
        });

    });

    // ── S-11 · maxWidth reaches the SVG surface ──────────────────────────

    describe('S-11 · text maxWidth', () => {

        test('Should emit textLength for a text with a maxWidth', () => {
            sizeHost(400, 300);

            const ctx = create();

            renderPass(ctx, () => ctx.createText({
                id: 'label',
                x: 5,
                y: 6,
                content: 'hello',
                maxWidth: 40,
            }));

            const node = ctx.element.querySelector('#label')!;

            expect(node.getAttribute('textLength')).toBe('40');
            expect(node.getAttribute('lengthAdjust')).toBe('spacingAndGlyphs');

            ctx.destroy();
        });

        test('Should drop textLength when the maxWidth is removed', () => {
            sizeHost(400, 300);

            const ctx = create();

            renderPass(ctx, () => ctx.createText({
                id: 'label',
                x: 5,
                y: 6,
                content: 'hello',
                maxWidth: 40,
            }));

            renderPass(ctx, () => ctx.createText({
                id: 'label',
                x: 5,
                y: 6,
                content: 'hello',
            }));

            const node = ctx.element.querySelector('#label')!;

            expect(node.getAttribute('textLength')).toBeNull();
            expect(node.getAttribute('lengthAdjust')).toBeNull();

            ctx.destroy();
        });

    });

    // ── S-12 · composite operations map to mix-blend-mode ────────────────

    describe('S-12 · blend mode', () => {

        test('Should map a composite operation to mix-blend-mode', () => {
            sizeHost(400, 300);

            const ctx = create();

            renderPass(ctx, () => {
                ctx.globalCompositeOperation = 'multiply';

                const path = ctx.createPath('shape');

                path.rect(0, 0, 10, 10);
                ctx.applyFill(path);
            });

            const node = ctx.element.querySelector('#shape') as SVGElement;

            expect(node.style.mixBlendMode).toBe('multiply');

            ctx.destroy();
        });

        test('Should leave a composite operation with no blend equivalent alone', () => {
            sizeHost(400, 300);

            const ctx = create();

            renderPass(ctx, () => {
                const path = ctx.createPath('shape');

                path.rect(0, 0, 10, 10);
                ctx.applyFill(path);
            });

            const node = ctx.element.querySelector('#shape') as SVGElement;

            expect(node.style.mixBlendMode).toBe('');

            ctx.destroy();
        });

        test('Should isolate the surface so a blend does not reach the page behind it', () => {
            sizeHost(400, 300);

            const ctx = create();

            expect(ctx.element.style.getPropertyValue('isolation')).toBe('isolate');

            ctx.destroy();
        });

    });

    // ── S-14 · restore is a no-op at depth zero ──────────────────────────

    describe('S-14 · unbalanced restore', () => {

        test('Should keep the current transform when restoring at depth zero', () => {
            sizeHost(400, 300);

            const ctx = create();

            ctx.translate(10, 20);
            ctx.restore();

            expect(getInternals(ctx)._currentTransforms).toEqual(['translate(10,20)']);

            ctx.destroy();
        });

    });

    // ── S-15 · applyFill honours the fill rule ───────────────────────────

    describe('S-15 · fill rule', () => {

        test('Should emit the fill rule passed to applyFill', () => {
            sizeHost(400, 300);

            const ctx = create();

            renderPass(ctx, () => {
                const path = ctx.createPath('shape');

                path.rect(0, 0, 10, 10);
                ctx.applyFill(path, 'evenodd');
            });

            const node = ctx.element.querySelector('#shape') as SVGElement;

            expect(node.style.fillRule).toBe('evenodd');

            ctx.destroy();
        });

    });

    // ── S-16 · a clipped multi-path element leaves no stray nodes ────────

    describe('S-16 · clipped multi-path element', () => {

        test('Should remove every run path of a clipped segmented polyline', () => {
            sizeHost(400, 300);

            const ctx = create();
            const scene = createScene(ctx, {
                children: [
                    createPolyline({
                        id: 'PL',
                        clip: true,
                        lineWidth: 3,
                        points: [[0, 0], [10, 20], [20, 10], [30, 30]],
                        segments: [{
                            from: 1,
                            to: 3,
                            lineDash: [6, 4],
                        }],
                    }),
                ],
            });

            scene.render();

            expect(ctx.element.querySelectorAll('path[id^="PL"]')).toHaveLength(0);

            ctx.destroy();
        });

    });

    // ── S-17 · the export carries an intrinsic size ──────────────────────

    describe('S-17 · export', () => {

        test('Should size the exported markup', () => {
            sizeHost(200, 100);

            const ctx = create();
            const markup = ctx.export().toString();

            expect(markup).toContain('width="200"');
            expect(markup).toContain('height="100"');

            ctx.destroy();
        });

        test('Should revoke the object URLs it handed out when released', () => {
            sizeHost(200, 100);

            const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:svg');
            const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

            const ctx = create();
            const contextExport = ctx.export();

            contextExport.toURL();
            contextExport.release?.();
            contextExport.release?.();

            expect(createObjectURL).toHaveBeenCalledTimes(1);
            expect(revokeObjectURL).toHaveBeenCalledTimes(1);
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:svg');

            ctx.destroy();
        });

        test('Should rasterize the export at the surface size', async () => {
            sizeHost(200, 100);

            const stub = mockCanvasContext();

            vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:svg');
            vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
            stubImageDecode(true);

            const ctx = create();

            await ctx.export().toImage();

            expect(stub.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 200, 100);
            expect(stub.getImageData).toHaveBeenCalledWith(0, 0, 200, 100);

            ctx.destroy();
        });

        test('Should reject when the export cannot be decoded', async () => {
            sizeHost(200, 100);

            vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:svg');
            vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
            stubImageDecode(false);

            const ctx = create();

            await expect(ctx.export().toImage()).rejects.toThrow('Failed to rasterize SVG for export');

            ctx.destroy();
        });

    });

    // ── S-21 · alignment-baseline is not written ─────────────────────────

    describe('S-21 · dead baseline config', () => {

        test('Should not write alignment-baseline onto rendered nodes', () => {
            sizeHost(400, 300);

            const ctx = create();

            let shape!: ReturnType<SVGContext['createPath']>;

            renderPass(ctx, () => {
                shape = ctx.createPath('shape');

                shape.rect(0, 0, 10, 10);
                ctx.applyFill(shape);
            });

            // jsdom's CSSOM drops both baseline properties, so the definition is the only observable surface.
            expect(shape.definition.styles).not.toHaveProperty('alignmentBaseline');
            expect(shape.definition.styles).toHaveProperty('dominantBaseline');

            ctx.destroy();
        });

    });

});
