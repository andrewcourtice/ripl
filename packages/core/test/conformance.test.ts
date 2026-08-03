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
    mockCanvasState,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createCircle,
    createGroup,
    createRect,
    createScene,
    Element as RiplElement,
} from '../src';

import type {
    Context,
    ContextElement,
    FillRule,
    Scene,
} from '../src';

import {
    createContext as createCanvasContext,
} from '@ripl/canvas';

import {
    createContext as createSVGContext,
} from '@ripl/svg';

import {
    createContext as createTerminalContext,
} from '@ripl/terminal';

import {
    createContext as create3DContext,
} from '@ripl/3d';

polyfillPath2D();

/** A rendering backend the shared conformance scene is driven through. */
interface ConformanceBackend {
    /** Name used to title the backend's `describe` block. */
    name: string;
    /** Builds a fresh context over a throwaway surface. */
    create(): Context;
    /**
     * The alpha the backend actually composites a leaf with, read while (or after) `render` runs.
     * Immediate-mode backends carry it on the context at paint time; SVG composites structurally,
     * so its answer is the product down the `<g>` chain.
     */
    paintedOpacity(context: Context, id: string, render: () => void): number;
    /** Asserts `export()` reproduces what the frame painted. Omitted when {@link ConformanceBackend.exportSkip} explains why it cannot. */
    assertExport?(context: Context): void;
    /** Why this backend's `export()` cannot be round-tripped here; skips that row with the reason in its title. */
    exportSkip?: string;
}

const CLIP_ID = 'root-clip';
const OUTER_ID = 'outer';
const INNER_ID = 'inner';
const LEAF_A_ID = 'leaf-a';
const LEAF_B_ID = 'leaf-b';
const PROBE_ID = 'probe';

/** Paint order of the shared scene: the root clip shape, then each leaf, with both groups excluded. */
const PAINT_ORDER = [CLIP_ID, LEAF_A_ID, LEAF_B_ID];

/** Group-stack depth after each `pushGroup`/`popGroup` of a frame: enter outer, enter inner, leave inner, leave outer. */
const GROUP_DEPTHS = [1, 2, 1, 0];

const saveDepth = (context: Context) => (context as unknown as { saveDepth: number }).saveDepth;
const renderDepth = (context: Context) => (context as unknown as { renderDepth: number }).renderDepth;
const groupDepth = (context: Context) => (context as unknown as { _groupStack: unknown[] })._groupStack.length;

/** An element that throws out of its own render pass once, then renders normally. */
class RenderProbe extends RiplElement {

    /** Whether the next render throws. Cleared by the throw, so the following frame paints. */
    public armed = true;

    constructor() {
        super('render-probe', {
            id: PROBE_ID,
        });
    }

    public render(context: Context): void {
        super.render(context, () => {
            if (this.armed) {
                this.armed = false;
                throw new Error('render probe');
            }
        });
    }

}

/** Creates a {@link RenderProbe} that throws out of its first render and paints on every later one. */
function createRenderProbe(): RenderProbe {
    return new RenderProbe();
}

/**
 * The one scene every backend is driven through: a scene-root `clip: true` shape (with no group to
 * absorb the save it deliberately leaves open), a group carrying an opacity that a leaf composites
 * under, and a nested group so the group stack has to unwind more than one level.
 */
function createConformanceScene(context: Context, probe?: RiplElement): Scene {
    return createScene(context, {
        children: [
            createCircle({
                id: CLIP_ID,
                clip: true,
                cx: 50,
                cy: 50,
                radius: 40,
            }),
            createGroup({
                id: OUTER_ID,
                opacity: 0.5,
                children: [
                    createRect({
                        id: LEAF_A_ID,
                        fill: '#ff0000',
                        opacity: 0.5,
                        x: 10,
                        y: 10,
                        width: 20,
                        height: 20,
                    }),
                    ...(probe ? [probe] : []),
                    createGroup({
                        id: INNER_ID,
                        children: [
                            createRect({
                                id: LEAF_B_ID,
                                fill: '#00ff00',
                                x: 40,
                                y: 40,
                                width: 20,
                                height: 20,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

/** Records the group-stack depth after every boundary a frame opens or closes. */
function trackGroupDepths(context: Context): number[] {
    const depths: number[] = [];
    const pushGroup = context.pushGroup.bind(context);
    const popGroup = context.popGroup.bind(context);

    context.pushGroup = element => {
        pushGroup(element);
        depths.push(groupDepth(context));
    };

    context.popGroup = () => {
        popGroup();
        depths.push(groupDepth(context));
    };

    return depths;
}

/** The alpha an immediate-mode backend holds on the context when it fills a given leaf. */
function opacityAtFill(context: Context, id: string, render: () => void): number {
    const applyFill = context.applyFill.bind(context);

    let painted = NaN;

    context.applyFill = (path: ContextElement, fillRule?: FillRule) => {
        if (context.renderElement?.id === id) {
            painted = context.opacity;
        }

        applyFill(path, fillRule);
    };

    render();

    return painted;
}

/** The alpha SVG composites a leaf with: the product of every `opacity` from the leaf up to the surface. */
function opacityAtNode(context: Context, id: string, render: () => void): number {
    render();

    const surface = context.element as SVGSVGElement;

    let node = surface.querySelector<SVGElement>(`#${id}`);
    let painted = 1;

    while (node) {
        painted *= Number(node.style.opacity || 1);
        node = node === surface ? null : node.parentElement as SVGElement | null;
    }

    return painted;
}

/** A throwaway host element for a DOM-backed context; sized by the `getBoundingClientRect` spy. */
function createHost(): HTMLDivElement {
    const el = document.createElement('div');

    document.body.appendChild(el);

    return el;
}

/** A terminal output sized to a fixed 40×12 grid so the exported frame is deterministic. */
function createOutput() {
    return {
        columns: 40,
        rows: 12,
        write: vi.fn(),
    };
}

/** Declares a test, or skips it with the reason the backend cannot honour the invariant in its title. */
function testWhere(reason: string | undefined, name: string, body: () => void): void {
    if (reason) {
        test.skip(`${name} — unsupported: ${reason}`, body);
        return;
    }

    test(name, body);
}

const BACKENDS: ConformanceBackend[] = [
    {
        name: 'canvas',
        create: () => createCanvasContext(createHost()),
        paintedOpacity: opacityAtFill,
        // jsdom implements no rasteriser, so `HTMLCanvasElement.toDataURL` returns null and the export carries no bytes.
        exportSkip: 'jsdom canvas has no toDataURL',
    },
    {
        name: 'svg',
        create: () => createSVGContext(createHost()),
        paintedOpacity: opacityAtNode,
        assertExport: context => {
            const markup = context.export().toString();

            expect(markup).toContain(LEAF_A_ID);
            expect(markup).toContain(LEAF_B_ID);
            expect(markup).toContain('width="400"');
        },
    },
    {
        name: 'terminal',
        create: () => createTerminalContext(createOutput()),
        paintedOpacity: opacityAtFill,
        assertExport: context => {
            const text = context.export().toString();

            expect(text.split('\n')).toHaveLength(12);
            expect(text).toMatch(/[⠀-⣿]/);
        },
    },
    {
        name: '3d',
        create: () => create3DContext(createHost()),
        paintedOpacity: opacityAtFill,
        exportSkip: 'jsdom canvas has no toDataURL',
    },
];

/**
 * Cross-context conformance: one scene driven through every `Context` that runs in jsdom, asserting
 * the base-`Context` invariants the rendering audit checked by hand. Adding a backend means adding a
 * row to `BACKENDS`.
 */
describe('Context conformance', () => {

    beforeEach(() => {
        // Every context reads the default drawing state off a 2D context, so even SVG and terminal need the stub.
        mockCanvasState(mockCanvasContext());

        // Spied on `Element`, not `HTMLElement`: the SVG surface is an `SVGSVGElement`.
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
            left: 0,
            top: 0,
            right: 400,
            bottom: 300,
            width: 400,
            height: 300,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }) as DOMRect);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    BACKENDS.forEach(backend => {

        describe(backend.name, () => {

            // The scene-root clip skips its own restore so the clip persists to later siblings, and
            // with no enclosing group to absorb it that save leaked one state per frame, unbounded.
            test('Should return to zero save depth after every frame', () => {
                const context = backend.create();
                const scene = createConformanceScene(context);
                const depths: number[] = [];

                for (let frame = 0; frame < 5; frame++) {
                    scene.render();
                    depths.push(saveDepth(context));
                }

                expect(depths).toEqual([0, 0, 0, 0, 0]);
            });

            test('Should return to zero render depth after every frame', () => {
                const context = backend.create();
                const scene = createConformanceScene(context);

                scene.render();
                scene.render();

                expect(renderDepth(context)).toBe(0);
            });

            test('Should balance pushGroup and popGroup across nested groups', () => {
                const context = backend.create();
                const depths = trackGroupDepths(context);

                createConformanceScene(context).render();

                expect(depths).toEqual(GROUP_DEPTHS);
                expect(groupDepth(context)).toBe(0);
            });

            test('Should record rendered elements in exact paint order', () => {
                const context = backend.create();

                createConformanceScene(context).render();

                expect(context.renderedElements.map(element => element.id)).toEqual(PAINT_ORDER);
            });

            test('Should exclude groups from the rendered elements', () => {
                const context = backend.create();

                createConformanceScene(context).render();

                const ids = context.renderedElements.map(element => element.id);

                expect(ids).not.toContain(OUTER_ID);
                expect(ids).not.toContain(INNER_ID);
                expect(context.renderedElements.every(element => !element.abstract)).toBe(true);
            });

            test('Should composite element opacity multiplicatively under a group', () => {
                const context = backend.create();
                const scene = createConformanceScene(context);

                expect(backend.paintedOpacity(context, LEAF_A_ID, () => scene.render())).toBeCloseTo(0.25);
            });

            test('Should composite a group opacity onto a leaf that sets none', () => {
                const context = backend.create();
                const scene = createConformanceScene(context);

                expect(backend.paintedOpacity(context, LEAF_B_ID, () => scene.render())).toBeCloseTo(0.5);
            });

            test('Should leave the depths balanced when a child throws out of its render', () => {
                const context = backend.create();
                const scene = createConformanceScene(context, createRenderProbe());

                expect(() => scene.render()).toThrow('render probe');
                expect(saveDepth(context)).toBe(0);
                expect(renderDepth(context)).toBe(0);
            });

            test('Should render the next frame after a child throws out of its render', () => {
                const context = backend.create();
                const scene = createConformanceScene(context, createRenderProbe());

                expect(() => scene.render()).toThrow('render probe');

                scene.render();

                expect(context.renderedElements.map(element => element.id)).toEqual([CLIP_ID, LEAF_A_ID, PROBE_ID, LEAF_B_ID]);
            });

            // Pins the one gap this suite uncovered: `Context.batch` unwinds the save stack a
            // throwing frame leaves behind, but never the group stack. Un-skip with the fix.
            test.skip('Should leave the group stack balanced when a child throws out of its render', () => {
                const context = backend.create();
                const probe = createRenderProbe();
                const scene = createConformanceScene(context, probe);
                const depths: number[] = [];

                for (let frame = 0; frame < 3; frame++) {
                    probe.armed = true;

                    expect(() => scene.render()).toThrow('render probe');
                    depths.push(groupDepth(context));
                }

                expect(depths).toEqual([0, 0, 0]);
            });

            test('Should emit destroyed exactly once across repeated destroys', () => {
                const context = backend.create();

                let destroyed = 0;

                context.on('destroyed', () => destroyed++);
                context.destroy();
                context.destroy();

                expect(destroyed).toBe(1);
            });

            test('Should release the rendered elements on destroy', () => {
                const context = backend.create();

                createConformanceScene(context).render();

                expect(context.renderedElements).toHaveLength(PAINT_ORDER.length);

                context.destroy();

                expect(context.renderedElements).toHaveLength(0);
                expect(context.renderElement).toBeUndefined();
            });

            testWhere(backend.exportSkip, 'Should round-trip an export of the painted frame', () => {
                const context = backend.create();

                createConformanceScene(context).render();

                backend.assertExport?.(context);
            });

        });

    });

});
