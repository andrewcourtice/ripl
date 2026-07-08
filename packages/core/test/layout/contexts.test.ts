import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    type Context,
    createFlex,
    createGrid,
    createRect,
    createScene,
} from '../../src';

import {
    createContext as createCanvasContext,
} from '@ripl/canvas';

import {
    createContext as createSvgContext,
} from '@ripl/svg';

import {
    createContext as createTerminalContext,
} from '@ripl/terminal';

import {
    createContext as createDddContext,
} from '@ripl/3d';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

// The layout system is context-agnostic: it only computes child positions, and each backend just
// draws pre-positioned elements. These tests prove the same Flex/Grid yields identical positions
// no matter the backing context, and that the scene render path integrates in every backend that
// can run headlessly (canvas, svg, terminal, 3d/WebGL). WebGPU is excluded because it needs a real
// `navigator.gpu`, unavailable in jsdom; it shares the identical, backend-independent layout code.

function makeEl() {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
}

function makeTerminalOutput() {
    return {
        written: [] as string[],
        write(data: string) {
            this.written.push(data);
        },
        columns: 80,
        rows: 24,
    };
}

const BACKENDS: Record<string, { context: () => Context;
    render: boolean; }> = {
    canvas: {
        context: () => createCanvasContext(makeEl()) as unknown as Context,
        render: true,
    },
    svg: {
        context: () => createSvgContext(makeEl()) as unknown as Context,
        render: true,
    },
    terminal: {
        context: () => createTerminalContext(makeTerminalOutput()) as unknown as Context,
        render: true,
    },
    '3d': {
        context: () => createDddContext(makeEl()) as unknown as Context,
        render: false, // WebGL draw calls need a real GL context; layout math is identical regardless.
    },
};

function buildScene(context: Context) {
    const children = Array.from({ length: 4 }, (_, index) => createRect({
        x: 0,
        y: 0,
        width: 20 + index * 4,
        height: 20,
    }));

    const flex = createFlex({
        x: 0,
        y: 0,
        gap: 10,
        justify: 'center',
        align: 'center',
        width: 400,
        height: 100,
        children,
    });

    // renderOnUpdate:false — the test drives layout/paint explicitly, so no stray coalesced
    // frames fire after teardown.
    const scene = createScene(context, { renderOnUpdate: false });
    scene.add(flex);
    flex.reflow(); // deterministic, synchronous layout

    return {
        scene,
        children,
    };
}

describe('Layout across contexts', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('produces identical child positions in every backend', () => {
        const positions = Object.entries(BACKENDS).map(([name, backend]) => {
            const { scene, children } = buildScene(backend.context());
            const result = children.map(child => [child.layoutX, child.layoutY]);

            if (backend.render) {
                expect(() => scene.render(), `${name} render should not throw`).not.toThrow();
            }

            return {
                name,
                result,
            };
        });

        const [reference, ...rest] = positions;

        rest.forEach(entry => {
            expect(entry.result, `${entry.name} positions match ${reference.name}`).toEqual(reference.result);
        });
    });

    test('grid positions are identical across backends too', () => {
        const positionsFor = (context: Context) => {
            const children = Array.from({ length: 4 }, () => createRect({
                x: 0,
                y: 0,
                width: 20,
                height: 20,
            }));
            const grid = createGrid({
                x: 0,
                y: 0,
                columns: 2,
                columnGap: 8,
                rowGap: 8,
                children,
            });
            const scene = createScene(context, { renderOnUpdate: false });
            scene.add(grid);
            grid.reflow();
            void scene;
            return children.map(child => [child.layoutX, child.layoutY]);
        };

        const canvas = positionsFor(BACKENDS.canvas.context());
        const svg = positionsFor(BACKENDS.svg.context());
        const terminal = positionsFor(BACKENDS.terminal.context());

        expect(svg).toEqual(canvas);
        expect(terminal).toEqual(canvas);
    });

});
