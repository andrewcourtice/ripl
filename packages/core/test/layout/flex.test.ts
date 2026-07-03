import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createFlex,
    createRect,
    createScene,
    elementIsFlex,
    factory,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

function rects(count: number, width = 20, height = 20) {
    return Array.from({ length: count }, () => createRect({
        x: 0,
        y: 0,
        width,
        height,
    }));
}

function nextFrame() {
    return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

describe('Flex', () => {

    test('Should create a flex with type "flex" and be abstract', () => {
        const flex = createFlex();

        expect(flex.type).toBe('flex');
        expect(flex.abstract).toBe(true);
        expect(elementIsFlex(flex)).toBe(true);
    });

    test('Should lay children in a row with a gap', () => {
        const children = rects(3);
        const flex = createFlex({
            x: 0,
            y: 0,
            gap: 10,
            children,
        });

        flex.reflow();

        expect(children.map(child => child.translateX)).toEqual([0, 30, 60]);
        expect(children.map(child => child.translateY)).toEqual([0, 0, 0]);
    });

    test('Should lay children in a column', () => {
        const children = rects(3);
        const flex = createFlex({
            x: 0,
            y: 0,
            flexDirection: 'column',
            gap: 10,
            children,
        });

        flex.reflow();

        expect(children.map(child => child.translateY)).toEqual([0, 30, 60]);
        expect(children.map(child => child.translateX)).toEqual([0, 0, 0]);
    });

    test('Should justify centre within a fixed width', () => {
        const children = rects(3);
        const flex = createFlex({
            x: 0,
            y: 0,
            width: 200,
            gap: 0,
            justify: 'center',
            children,
        });

        flex.reflow();

        expect(children.map(child => child.translateX)).toEqual([70, 90, 110]);
    });

    test('Should justify space-between within a fixed width', () => {
        const children = rects(3);
        const flex = createFlex({
            x: 0,
            y: 0,
            width: 200,
            gap: 0,
            justify: 'space-between',
            children,
        });

        flex.reflow();

        expect(children.map(child => child.translateX)).toEqual([0, 90, 180]);
    });

    test('Should justify space-evenly within a fixed width', () => {
        const children = rects(3);
        const flex = createFlex({
            x: 0,
            y: 0,
            width: 200,
            gap: 0,
            justify: 'space-evenly',
            children,
        });

        flex.reflow();

        expect(children.map(child => child.translateX)).toEqual([35, 90, 145]);
    });

    test('Should align children on the cross axis', () => {
        const children = [
            createRect({
                x: 0,
                y: 0,
                width: 20,
                height: 20,
            }),
            createRect({
                x: 0,
                y: 0,
                width: 20,
                height: 40,
            }),
        ];
        const flex = createFlex({
            x: 0,
            y: 0,
            gap: 0,
            align: 'center',
            children,
        });

        flex.reflow();

        expect(children[0].translateY).toBe(10);
        expect(children[1].translateY).toBe(0);
    });

    test('Should wrap children onto multiple lines', () => {
        const children = rects(3);
        const flex = createFlex({
            x: 0,
            y: 0,
            width: 50,
            gap: 10,
            wrap: true,
            children,
        });

        flex.reflow();

        expect(children.map(child => child.translateX)).toEqual([0, 30, 0]);
        expect(children.map(child => child.translateY)).toEqual([0, 0, 30]);
    });

    test('Should offset children by padding', () => {
        const children = rects(1);
        const flex = createFlex({
            x: 0,
            y: 0,
            padding: 8,
            children,
        });

        flex.reflow();

        expect(children[0].translateX).toBe(8);
        expect(children[0].translateY).toBe(8);
    });

    test('Should report a resolved content bounding box', () => {
        const flex = createFlex({
            x: 0,
            y: 0,
            gap: 10,
            children: rects(3),
        });

        flex.reflow();

        const box = flex.getBoundingBox();

        expect(box.left).toBe(0);
        expect(box.top).toBe(0);
        expect(box.width).toBe(80);
        expect(box.height).toBe(20);
    });

    test('Should honour explicit width and height in the bounding box', () => {
        const flex = createFlex({
            x: 0,
            y: 0,
            width: 300,
            height: 100,
            children: rects(1),
        });

        flex.reflow();

        const box = flex.getBoundingBox();

        expect(box.width).toBe(300);
        expect(box.height).toBe(100);
    });

    test('Should report a padding-only box when empty', () => {
        const flex = createFlex({
            x: 5,
            y: 5,
            padding: 4,
        });

        flex.reflow();

        const box = flex.getBoundingBox();

        expect(box.left).toBe(5);
        expect(box.top).toBe(5);
        expect(box.width).toBe(8);
        expect(box.height).toBe(8);
    });

    test('Should be idempotent across repeated reflows', () => {
        const children = rects(3);
        const flex = createFlex({
            x: 0,
            y: 0,
            gap: 10,
            children,
        });

        flex.reflow();
        flex.reflow();

        expect(children.map(child => child.translateX)).toEqual([0, 30, 60]);
    });

    describe('Reactivity', () => {

        let el: HTMLDivElement;

        beforeEach(() => {
            mockCanvasContext();
            factory.set({ createContext });
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        afterEach(() => {
            el.remove();
            factory.set({ createContext: undefined });
            vi.restoreAllMocks();
        });

        test('Should not emit graph during reflow', () => {
            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children: rects(3),
            });
            const graphSpy = vi.fn();

            flex.on('graph', graphSpy);
            flex.reflow();

            expect(graphSpy).not.toHaveBeenCalled();
        });

        test('Should repaint the owning scene after reflow', () => {
            const scene = createScene(el);
            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children: rects(3),
            });

            scene.add(flex);

            const renderSpy = vi.spyOn(scene, 'render');

            flex.reflow();

            expect(renderSpy).toHaveBeenCalled();

            scene.destroy();
        });

        test('Should auto-reflow when a child size changes', async () => {
            const children = rects(3);
            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children,
            });

            await nextFrame();

            expect(children[1].translateX).toBe(30);

            children[0].width = 40;
            await nextFrame();

            expect(children[1].translateX).toBe(50);
            expect(children[2].translateX).toBe(80);
            expect(flex.getBoundingBox().width).toBe(100);
        });

        test('Should ignore transform-key echoes from children', async () => {
            const children = rects(3);
            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children,
            });

            await nextFrame();

            const relayoutSpy = vi.spyOn(flex as unknown as { relayout: () => void }, 'relayout');

            children[0].translateX = 999;
            await nextFrame();

            expect(relayoutSpy).not.toHaveBeenCalled();

            children[0].width = 40;
            await nextFrame();

            expect(relayoutSpy).toHaveBeenCalled();
        });

    });

});
