import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createGroup,
    createRect,
    createScene,
} from '../../src';

function mockCanvasContext() {
    const stub = {
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        measureText: vi.fn(() => ({
            width: 0,
            actualBoundingBoxAscent: 0,
            actualBoundingBoxDescent: 0,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: 0,
        })),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
        drawImage: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
        canvas: document.createElement('canvas'),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(stub as unknown as CanvasRenderingContext2D);

    return stub;
}

describe('Scene', () => {

    let el: HTMLDivElement;

    beforeEach(() => {
        mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        vi.restoreAllMocks();
    });

    test('Should create from an HTMLElement', () => {
        const scene = createScene(el);

        expect(scene).toBeDefined();
        expect(scene.context).toBeDefined();

        scene.destroy();
    });

    test('Should expose width and height from context', () => {
        const scene = createScene(el);

        expect(typeof scene.width).toBe('number');
        expect(typeof scene.height).toBe('number');

        scene.destroy();
    });

    test('Should initialise with empty buffer', () => {
        const scene = createScene(el);

        expect(scene.buffer).toEqual([]);

        scene.destroy();
    });

    test('Should flatten graph into buffer when children added', async () => {
        const scene = createScene(el);

        const rect1 = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const rect2 = createRect({
            x: 20,
            y: 20,
            width: 10,
            height: 10,
        });

        scene.add([rect1, rect2]);

        // Buffer updates via requestAnimationFrame
        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer).toContain(rect1);
        expect(scene.buffer).toContain(rect2);
        expect(scene.buffer.length).toBe(2);

        scene.destroy();
    });

    test('Should flatten nested groups into buffer', async () => {
        const scene = createScene(el);

        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect],
        });

        scene.add(group);

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer).toContain(rect);
        expect(scene.buffer).not.toContain(group);

        scene.destroy();
    });

    test('Should sort buffer by zIndex', async () => {
        const scene = createScene(el);

        const rect1 = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 2,
        });

        const rect2 = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 1,
        });

        scene.add([rect1, rect2]);

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer[0]).toBe(rect2);
        expect(scene.buffer[1]).toBe(rect1);

        scene.destroy();
    });

    test('Should emit resize event when context resizes', () => {
        const scene = createScene(el);

        const resizeSpy = vi.fn();
        scene.on('resize', resizeSpy);

        scene.context.emit('resize', null);

        expect(resizeSpy).toHaveBeenCalledOnce();

        scene.destroy();
    });

    test('Should destroy context on scene destroy', () => {
        const scene = createScene(el);
        const destroySpy = vi.spyOn(scene.context, 'destroy');

        scene.destroy(true);

        expect(destroySpy).toHaveBeenCalledOnce();
    });

    test('Should support children in constructor options', async () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const scene = createScene(el, {
            children: [rect],
        });

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer).toContain(rect);

        scene.destroy();
    });

});
