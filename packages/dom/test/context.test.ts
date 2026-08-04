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

import {
    factory,
} from '@ripl/core';

import type {
    RenderElement,
} from '@ripl/core';

polyfillPath2D();

const SURFACE_WIDTH = 400;
const SURFACE_HEIGHT = 300;

let el: HTMLDivElement;
let rect: DOMRect;
let contexts: ReturnType<typeof createContext>[];

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

describe('DOMContext interaction origin', () => {

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

describe('DOMContext pointer state machine', () => {

    const HOVER_EVENTS = [
        'mouseenter',
        'mouseleave',
        'mousemove',
    ];

    const DRAG_EVENTS = [
        'dragstart',
        'drag',
        'dragend',
    ];

    interface MockElement extends RenderElement {
        hits: boolean;
        events: {
            type: string;
            data: unknown;
        }[];
    }

    let frames: FrameRequestCallback[];

    const nativeRequestAnimationFrame = factory.requestAnimationFrame;
    const nativeCancelAnimationFrame = factory.cancelAnimationFrame;
    const nativeDevicePixelRatio = factory.devicePixelRatio;

    beforeEach(() => {
        frames = [];

        factory.set({
            requestAnimationFrame: callback => frames.push(callback),
            cancelAnimationFrame: handle => frames[handle - 1] = () => undefined,
        });
    });

    afterEach(() => {
        factory.set({
            requestAnimationFrame: nativeRequestAnimationFrame,
            cancelAnimationFrame: nativeCancelAnimationFrame,
            devicePixelRatio: nativeDevicePixelRatio,
        });
    });

    function flushFrames(): void {
        const pending = frames;

        frames = [];
        pending.forEach(callback => callback(0));
    }

    function createMockElement(id: string, events: string[]): MockElement {
        const eventSet = new Set(events);

        const element: MockElement = {
            id,
            hits: true,
            events: [],
            abstract: false,
            pointerEvents: 'all',
            zIndex: 0,
            has: event => eventSet.has(event),
            intersectsWith: () => element.hits,
            emit: (type, data) => element.events.push({
                type,
                data,
            }),
        };

        return element;
    }

    function register(context: ReturnType<typeof create>, elements: MockElement[]): void {
        context.markRenderStart();

        elements.forEach(element => context.currentRenderElement = element);

        context.markRenderEnd();
        context.invalidateTrackedElements();
    }

    function typesOf(element: MockElement): string[] {
        return element.events.map(({ type }) => type);
    }

    function mouse(context: ReturnType<typeof create>, type: string, clientX: number, clientY: number, button = 0): void {
        context.element.dispatchEvent(new MouseEvent(type, {
            clientX,
            clientY,
            button,
            bubbles: true,
        }));
    }

    function hover(context: ReturnType<typeof create>, clientX: number, clientY: number): void {
        mouse(context, 'mousemove', clientX, clientY);
        flushFrames();
    }

    test('Should emit mouseleave on the hovered element when the pointer leaves the surface', () => {
        const context = create();
        const element = createMockElement('a', HOVER_EVENTS);

        register(context, [element]);
        hover(context, 50, 50);

        expect(typesOf(element)).toEqual(['mouseenter']);

        context.element.dispatchEvent(new MouseEvent('mouseleave'));

        expect(typesOf(element)).toEqual(['mouseenter', 'mouseleave']);
    });

    test('Should re-enter an element hovered again after the pointer left the surface', () => {
        const context = create();
        const element = createMockElement('a', HOVER_EVENTS);

        register(context, [element]);
        hover(context, 50, 50);

        context.element.dispatchEvent(new MouseEvent('mouseleave'));
        context.element.dispatchEvent(new MouseEvent('mouseenter'));

        hover(context, 50, 50);

        expect(typesOf(element)).toEqual(['mouseenter', 'mouseleave', 'mouseenter']);
    });

    test('Should emit mouseleave on the hovered element when interaction is disabled', () => {
        const context = create();
        const element = createMockElement('a', HOVER_EVENTS);

        register(context, [element]);
        hover(context, 50, 50);

        context.disableInteraction();

        expect(typesOf(element)).toEqual(['mouseenter', 'mouseleave']);
    });

    // Teardown has to be complete when `destroy()` returns, not a frame later.
    test('Should unwind a hover synchronously on destroy', () => {
        const context = create();
        const element = createMockElement('a', HOVER_EVENTS);

        register(context, [element]);
        hover(context, 50, 50);

        mouse(context, 'mousemove', 60, 60);
        context.destroy();

        expect(typesOf(element)).toEqual(['mouseenter', 'mouseleave']);

        flushFrames();

        expect(typesOf(element)).toEqual(['mouseenter', 'mouseleave']);
    });

    test('Should not re-enter a flushed element on the frame after interaction is disabled', () => {
        const context = create();
        const element = createMockElement('a', HOVER_EVENTS);

        register(context, [element]);
        hover(context, 50, 50);

        mouse(context, 'mousemove', 60, 60);
        context.disableInteraction();
        flushFrames();

        expect(typesOf(element)).toEqual(['mouseenter', 'mouseleave']);
    });

    test('Should end a drag released outside the surface', () => {
        const context = create();
        const element = createMockElement('a', DRAG_EVENTS);

        register(context, [element]);

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);
        mouse(context, 'mousemove', 140, 140);

        window.dispatchEvent(new MouseEvent('mouseup', {
            clientX: 900,
            clientY: 900,
        }));

        expect(typesOf(element)).toEqual(['dragstart', 'drag', 'dragend']);
    });

    test('Should not resume a stranded drag once the button is released', () => {
        const context = create();
        const element = createMockElement('a', DRAG_EVENTS);

        register(context, [element]);

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);

        window.dispatchEvent(new MouseEvent('mouseup', {
            clientX: 900,
            clientY: 900,
        }));

        element.events.length = 0;

        mouse(context, 'mousemove', 140, 140);

        expect(typesOf(element)).toEqual([]);
    });

    test('Should not resume the previous drag after a press that hits nothing', () => {
        const context = create();
        const element = createMockElement('a', DRAG_EVENTS);

        register(context, [element]);

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);

        element.hits = false;
        element.events.length = 0;

        mouse(context, 'mousedown', 300, 300);
        mouse(context, 'mousemove', 340, 340);

        expect(typesOf(element)).toEqual([]);
    });

    test('Should not emit click on the gesture that ended a drag', () => {
        const context = create();
        const element = createMockElement('a', [...DRAG_EVENTS, 'click']);

        register(context, [element]);

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);
        mouse(context, 'mouseup', 100, 100);
        mouse(context, 'click', 100, 100);

        expect(typesOf(element)).not.toContain('click');
    });

    test('Should emit click for a press and release under the drag threshold', () => {
        const context = create();
        const element = createMockElement('a', [...DRAG_EVENTS, 'click']);

        register(context, [element]);

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 11, 11);
        mouse(context, 'mouseup', 11, 11);
        mouse(context, 'click', 11, 11);

        expect(typesOf(element)).toEqual(['click']);
    });

    test('Should emit click on the gesture after a drag', () => {
        const context = create();
        const element = createMockElement('a', [...DRAG_EVENTS, 'click']);

        register(context, [element]);

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);
        mouse(context, 'mouseup', 100, 100);
        mouse(context, 'click', 100, 100);

        element.events.length = 0;

        mouse(context, 'mousedown', 100, 100);
        mouse(context, 'mouseup', 100, 100);
        mouse(context, 'click', 100, 100);

        expect(typesOf(element)).toEqual(['click']);
    });

    test('Should emit press, release and click on the context in logical coordinates', () => {
        setOrigin(120, 80);

        const context = create();
        const events: {
            type: string;
            data: unknown;
        }[] = [];

        (['mousedown', 'mouseup', 'click'] as const).forEach(type => {
            context.on(type, event => events.push({
                type,
                data: event.data,
            }));
        });

        mouse(context, 'mousedown', 200, 150);
        mouse(context, 'mouseup', 200, 150);
        mouse(context, 'click', 200, 150);

        expect(events).toEqual([
            {
                type: 'mousedown',
                data: {
                    x: 80,
                    y: 70,
                },
            },
            {
                type: 'mouseup',
                data: {
                    x: 80,
                    y: 70,
                },
            },
            {
                type: 'click',
                data: {
                    x: 80,
                    y: 70,
                },
            },
        ]);
    });

    // The handler is bound to the surface and to the window, and both see an in-surface release.
    test('Should emit exactly one mouseup per in-surface release', () => {
        const context = create();
        const releases: unknown[] = [];

        context.on('mouseup', event => releases.push(event.data));

        mouse(context, 'mousedown', 50, 50);
        mouse(context, 'mouseup', 50, 50);

        expect(releases).toHaveLength(1);
    });

    // A boolean press flag lost the second release, leaving the gesture one mouseup short.
    test('Should emit one mouseup per button across an overlapping press', () => {
        const context = create();
        const events: string[] = [];

        context.on('mousedown', () => events.push('mousedown'));
        context.on('mouseup', () => events.push('mouseup'));

        mouse(context, 'mousedown', 50, 50);
        mouse(context, 'mousedown', 50, 50, 2);
        mouse(context, 'mouseup', 50, 50, 2);
        mouse(context, 'mouseup', 50, 50);

        expect(events).toEqual(['mousedown', 'mousedown', 'mouseup', 'mouseup']);
    });

    test('Should not emit mouseup for a release that began outside the surface', () => {
        const context = create();
        const releases: unknown[] = [];

        context.on('mouseup', event => releases.push(event.data));

        window.dispatchEvent(new MouseEvent('mouseup', {
            clientX: 900,
            clientY: 900,
        }));

        expect(releases).toHaveLength(0);
    });

    test('Should emit mouseup on the context for a release outside the surface that ended a drag', () => {
        const context = create();
        const element = createMockElement('a', DRAG_EVENTS);
        const events: string[] = [];

        register(context, [element]);

        context.on('mouseup', () => events.push('mouseup'));
        context.on('dragend', () => events.push('dragend'));

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);

        window.dispatchEvent(new MouseEvent('mouseup', {
            clientX: 900,
            clientY: 900,
        }));

        expect(events).toEqual(['mouseup', 'dragend']);
        expect(typesOf(element)).toEqual(['dragstart', 'dragend']);
    });

    test('Should suppress element and context click on the gesture that ended a drag, but still release', () => {
        const context = create();
        const element = createMockElement('a', [...DRAG_EVENTS, 'click', 'mouseup']);
        const contextEvents: string[] = [];

        register(context, [element]);

        context.on('click', () => contextEvents.push('click'));
        context.on('mouseup', () => contextEvents.push('mouseup'));

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);
        mouse(context, 'mouseup', 100, 100);
        mouse(context, 'click', 100, 100);

        expect(contextEvents).toEqual(['mouseup']);
        expect(typesOf(element)).toEqual(['dragstart', 'mouseup', 'dragend']);
    });

    // No `click` follows a release outside the surface, so the flag stranded and swallowed the next one.
    test('Should not suppress a later click after a drag released outside the surface', () => {
        const context = create();
        const element = createMockElement('a', [...DRAG_EVENTS, 'click']);
        const contextEvents: string[] = [];

        register(context, [element]);

        context.on('click', () => contextEvents.push('click'));

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);

        window.dispatchEvent(new MouseEvent('mouseup', {
            clientX: 900,
            clientY: 900,
        }));

        mouse(context, 'click', 100, 100);

        expect(contextEvents).toEqual(['click']);
        expect(typesOf(element)).toContain('click');
    });

    test('Should emit mousedown and mouseup on the topmost hit element', () => {
        const context = create();
        const under = createMockElement('under', ['mousedown', 'mouseup']);
        const over = createMockElement('over', ['mousedown', 'mouseup']);

        register(context, [under, over]);

        mouse(context, 'mousedown', 50, 50);
        mouse(context, 'mouseup', 50, 50);

        expect(typesOf(over)).toEqual(['mousedown', 'mouseup']);
        expect(typesOf(under)).toEqual([]);
    });

    test('Should not let a press-only listener capture a drag from the element beneath it', () => {
        const context = create();
        const dragger = createMockElement('dragger', DRAG_EVENTS);
        const presser = createMockElement('presser', ['mousedown']);

        register(context, [dragger, presser]);

        mouse(context, 'mousedown', 10, 10);
        mouse(context, 'mousemove', 100, 100);
        mouse(context, 'mousemove', 140, 140);

        expect(typesOf(presser)).toEqual(['mousedown']);
        expect(typesOf(dragger)).toEqual(['dragstart', 'drag']);
    });

    // `InteractionPoint` is documented as chart pixels, but click/drag used to report device pixels.
    test('Should report click and drag payloads in the same space as mousemove', () => {
        factory.set({
            devicePixelRatio: 2,
        });

        const context = create();
        const element = createMockElement('a', [...HOVER_EVENTS, ...DRAG_EVENTS, 'click']);

        register(context, [element]);

        expect(context.scaleX(50)).toBe(100);

        hover(context, 50, 50);
        hover(context, 50, 50);

        mouse(context, 'click', 50, 50);
        mouse(context, 'mousedown', 50, 50);
        mouse(context, 'mousemove', 100, 100);

        const payloads = new Map(element.events.map(({ type, data }) => [type, data]));

        expect(payloads.get('mousemove')).toEqual({
            x: 50,
            y: 50,
        });
        expect(payloads.get('click')).toEqual({
            x: 50,
            y: 50,
        });
        expect(payloads.get('dragstart')).toEqual({
            x: 50,
            y: 50,
        });
    });

});
