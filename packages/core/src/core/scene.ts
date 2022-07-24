import {
    EVENTS,
} from './constants';

import {
    BaseElement,
    Element,
    ElementProperties,
} from './element';

import {
    createEventBus,
} from './event-bus';

import {
    getContext,
    rescaleCanvas,
} from './context';

import {
    createGroup,
    Group,
} from './group';

import {
    arrayFind,
    Disposable,
    DOMElementEventMap,
    DOMEventHandler,
    onDOMElementResize,
    onDOMEvent,
} from '@ripl/utilities';

interface SceneEventMap {
    resize(width: number, height: number): void;
    elementmouseenter(element: Element): void;
    elementmouseleave(element: Element): void;
    elementmousemove(element: Element): void;
    scenemouseenter(event: MouseEvent): void;
    scenemouseleave(event: MouseEvent): void;
    scenemousemove(x: number, y: number, event: MouseEvent): void;
}

export interface SceneOptions {
    properties?: ElementProperties<BaseElement>;
    renderOnResize: boolean;
}

export interface Scene {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    add: Group['add'];
    remove: Group['remove'];
    clear: Group['clear'];
    on<TEvent extends keyof SceneEventMap>(event: TEvent, handler: SceneEventMap[TEvent]): void;
    off<TEvent extends keyof SceneEventMap>(event: TEvent, handler: SceneEventMap[TEvent]): void;
    render(time?: number): void;
    dispose(): void;
    get width(): number;
    get height(): number;
    get elements(): Element[];
}

export function createScene(target: string | HTMLCanvasElement, options?: SceneOptions): Scene {
    let {
        canvas,
        context,
        clear,
        width,
        height,
    } = getContext(target);

    const {
        properties,
        renderOnResize = true,
    } = options || {};

    const eventMap = {
        resize: new Set(),
        elementmouseenter: new Set(),
        elementmouseleave: new Set(),
        elementmousemove: new Set(),
        scenemouseenter: new Set(),
        scenemouseleave: new Set(),
        scenemousemove: new Set(),
    } as {
        [P in keyof SceneEventMap]: Set<SceneEventMap[P]>;
    };

    const group = createGroup(properties);
    const eventBus = createEventBus();
    const disposals = new Set<Disposable>();

    let elements = group.elements;

    let left = 0;
    let top = 0;
    let activeElement: Element | undefined;

    const updateScaling = (_width: number, _height: number) => {
        width = _width;
        height = _height;

        rescaleCanvas(canvas, width, height);
    };

    const updateStyling = () => {
        const {
            font,
        } = window.getComputedStyle(document.body);

        context.font = font;
    };

    const attachDOMEvent = <TEvent extends keyof DOMElementEventMap<typeof canvas>>(event: TEvent, handler: DOMEventHandler<typeof canvas, TEvent>) => {
        disposals.add(onDOMEvent(canvas, event, handler));
    };

    const isElementActive = (element: Element, x: number, y: number) => {
        const pointerEvents = element.pointerEvents;
        const path = element?.result;


        if (pointerEvents === 'none' || !(path instanceof Path2D)) {
            return false;
        }

        switch (pointerEvents) {
            case 'fill':
                return context.isPointInPath(path, x, y);
            case 'stroke':
                return context.isPointInStroke(path, x, y);
        }

        return context.isPointInPath(path, x, y) || context.isPointInStroke(path, x, y);
    };

    const on = <TEvent extends keyof SceneEventMap>(event: TEvent, handler: SceneEventMap[TEvent]) => {
        eventMap[event]?.add(handler);
    };

    const off = <TEvent extends keyof SceneEventMap>(event: TEvent, handler: SceneEventMap[TEvent]) => {
        eventMap[event]?.delete(handler);
    };

    const dispose = () => {
        disposals.forEach(({ dispose }) => dispose);
    };

    attachDOMEvent('mouseenter', event => {
        ({
            left,
            top,
        } = canvas.getBoundingClientRect());

        eventMap.scenemouseenter.forEach(handler => handler(event));
    });

    attachDOMEvent('mouseleave', event => {
        eventMap.scenemouseleave.forEach(handler => handler(event));
    });

    attachDOMEvent('mousemove', event => {
        const x = event.clientX - left;
        const y = event.clientY - top;

        const onElMousemove = (element: Element) => eventMap.elementmousemove.forEach(handler => handler(element));
        const onElMouseenter = (element: Element) => eventMap.elementmouseenter.forEach(handler => handler(element));
        const onElMouseleave = (element: Element) => eventMap.elementmouseleave.forEach(handler => handler(element));

        eventMap.scenemousemove.forEach(handler => handler(x, y, event));

        const matchedElement = arrayFind(elements, element => isElementActive(element, x, y), -1);

        if (matchedElement && matchedElement === activeElement) {
            return onElMousemove(matchedElement);
        }

        if (matchedElement) {
            onElMouseenter(matchedElement);
        }

        if (activeElement) {
            onElMouseleave(activeElement);
        }

        activeElement = matchedElement;
    });

    const render = (time?: number) => {
        clear();
        group.render(context, time);
    };

    updateStyling();

    onDOMElementResize(canvas, ({ width, height }) => {
        updateScaling(width, height);
        eventMap.resize.forEach(handler => handler(width, height));

        if (renderOnResize && elements.length > 0) {
            render();
        }
    });

    group.eventBus = eventBus;
    eventBus.on(EVENTS.groupUpdated, () => {
        elements = group.elements;
    });

    return {
        context,
        canvas,
        on,
        off,
        render,
        dispose,
        add: group.add.bind(group),
        remove: group.remove.bind(group),
        clear: group.clear.bind(group),

        get width() {
            return width;
        },
        get height() {
            return height;
        },

        get elements() {
            return elements;
        },
    };
}