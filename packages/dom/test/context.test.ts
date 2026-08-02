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
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createContext,
} from '@ripl/canvas';

polyfillPath2D();

const SURFACE_WIDTH = 400;
const SURFACE_HEIGHT = 300;

describe('DOMContext interaction origin', () => {

    let el: HTMLDivElement;
    let rect: DOMRect;
    let contexts: ReturnType<typeof createContext>[];

    beforeEach(() => {
        mockCanvasContext();

        contexts = [];
        el = document.createElement('div');
        document.body.appendChild(el);

        setOrigin(0, 0);
    });

    afterEach(() => {
        // A surviving context keeps its window listeners, which would fire during later tests.
        contexts.forEach(context => context.destroy());
        el.remove();
        vi.restoreAllMocks();
    });

    // jsdom reports a zero rect for everything, so the surface's position has to be stubbed.
    function setOrigin(left: number, top: number) {
        rect = {
            left,
            top,
            right: left + SURFACE_WIDTH,
            bottom: top + SURFACE_HEIGHT,
            width: SURFACE_WIDTH,
            height: SURFACE_HEIGHT,
            x: left,
            y: top,
            toJSON: () => ({}),
        } as DOMRect;
    }

    function create() {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => rect);

        const context = createContext(el);

        contexts.push(context);

        return context;
    }

    function mouseMove(context: ReturnType<typeof create>, clientX: number, clientY: number) {
        const positions: {
            x: number;
            y: number;
        }[] = [];

        const subscription = context.on('mousemove', event => positions.push(event.data));

        context.element.dispatchEvent(new MouseEvent('mousemove', {
            clientX,
            clientY,
        }));

        subscription.dispose();

        return positions.at(-1);
    }

    // The surface is often mounted under a stationary pointer, and no `mouseenter` follows.
    test('Should resolve pointer coordinates without a preceding mouseenter', () => {
        setOrigin(120, 80);

        const context = create();

        expect(mouseMove(context, 200, 150)).toEqual({
            x: 80,
            y: 70,
        });
    });

    test('Should resolve pointer coordinates after a mouseenter', () => {
        setOrigin(120, 80);

        const context = create();

        context.element.dispatchEvent(new MouseEvent('mouseenter'));

        expect(mouseMove(context, 200, 150)).toEqual({
            x: 80,
            y: 70,
        });
    });

    // Scrolling under a pointer that never leaves used to offset every subsequent event.
    test('Should re-read the origin after a scroll anywhere in the document', () => {
        setOrigin(120, 80);

        const context = create();

        context.element.dispatchEvent(new MouseEvent('mouseenter'));
        setOrigin(120, 20);
        window.dispatchEvent(new Event('scroll'));

        expect(mouseMove(context, 200, 150)).toEqual({
            x: 80,
            y: 130,
        });
    });

    test('Should re-read the origin after a window resize', () => {
        setOrigin(120, 80);

        const context = create();

        context.element.dispatchEvent(new MouseEvent('mouseenter'));
        setOrigin(40, 80);
        window.dispatchEvent(new Event('resize'));

        expect(mouseMove(context, 200, 150)).toEqual({
            x: 160,
            y: 70,
        });
    });

    test('Should re-read the origin after the surface is resized', () => {
        setOrigin(120, 80);

        const context = create();

        context.element.dispatchEvent(new MouseEvent('mouseenter'));
        setOrigin(10, 10);

        context['rescale'](SURFACE_WIDTH, SURFACE_HEIGHT);
        window.dispatchEvent(new Event('resize'));

        expect(mouseMove(context, 200, 150)).toEqual({
            x: 190,
            y: 140,
        });
    });

    // One rect read per invalidation, not per event: this is the hover hot path.
    test('Should not re-measure the surface on every pointer move', () => {
        setOrigin(120, 80);

        const context = create();

        mouseMove(context, 200, 150);

        // `spyOn` returns the already-installed prototype spy, so drop the setup calls it recorded.
        const getBoundingClientRect = vi.spyOn(context.element, 'getBoundingClientRect').mockClear();

        for (let i = 0; i < 10; i++) {
            mouseMove(context, 200 + i, 150);
        }

        expect(getBoundingClientRect).not.toHaveBeenCalled();
    });

    test('Should stop tracking the origin once interaction is disabled', () => {
        setOrigin(120, 80);

        const context = create();

        context.disableInteraction();

        const getBoundingClientRect = vi.spyOn(context.element, 'getBoundingClientRect').mockClear();

        window.dispatchEvent(new Event('scroll'));
        context.element.dispatchEvent(new MouseEvent('mousemove', {
            clientX: 200,
            clientY: 150,
        }));

        expect(getBoundingClientRect).not.toHaveBeenCalled();
    });

});
