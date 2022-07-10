import {
    EVENTS,
} from './constants';

import {
    BaseElement,
    Element,
    ElementProperties,
} from './element';

import {
    eventBus,
} from './event-bus';

import {
    getContext,
    rescaleCanvas,
} from './context';

import {
    Group,
    group,
} from './group';

import {
    continuous,
} from '../math/scale';

import {
    DOMEventHandler,
    onDOMElementResize,
    onDOMEvent,
} from '../utilities/dom';

import type {
    Disposable,
} from '../global/types';

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
    on<TEvent extends keyof SceneEventMap>(event: TEvent, handler: SceneEventMap[TEvent]): void;
    off<TEvent extends keyof SceneEventMap>(event: TEvent, handler: SceneEventMap[TEvent]): void;
    render(time?: number): void;
    dispose(): void;
    get elements(): Set<Element>;
}

export function scene(target: string | HTMLCanvasElement, options?: SceneOptions): Scene {
    const {
        canvas,
        context,
        clear,
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

    const sceneGroup = group(properties);
    const sceneEventBus = eventBus();
    const disposals = new Set<Disposable>();

    let elements = sceneGroup.elements;
    let scaleX = continuous([0, canvas.width], [0, canvas.width]);
    let scaleY = continuous([0, canvas.height], [0, canvas.height]);

    let left = 0;
    let top = 0;
    let activeElement: Element | undefined;

    const updateScaling = (width: number, height: number) => {
        rescaleCanvas(canvas, width, height);
        scaleX = continuous([0, width], [0, canvas.width]);
        scaleY = continuous([0, height], [0, canvas.height]);
    };

    const updateStyling = () => {
        const {
            font,
        } = window.getComputedStyle(document.body);

        context.font = font;
    };

    const attachDOMEvent = <TEvent extends keyof HTMLElementEventMap>(event: TEvent, handler: DOMEventHandler<TEvent>) => {
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
        const x = scaleX(event.clientX - left, true);
        const y = scaleY(event.clientY - top, true);

        const onElMousemove = (element: Element) => eventMap.elementmousemove.forEach(handler => handler(element));
        const onElMouseenter = (element: Element) => eventMap.elementmouseenter.forEach(handler => handler(element));
        const onElMouseleave = (element: Element) => eventMap.elementmouseleave.forEach(handler => handler(element));

        eventMap.scenemousemove.forEach(handler => handler(x, y, event));

        let matchedElement: Element | undefined;

        for (const element of Array.from(elements).reverse()) {
            if (isElementActive(element, x, y)) {
                matchedElement = element;
                break;
            }
        }

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
        sceneGroup.render(context, time);
    };

    updateStyling();
    onDOMElementResize(canvas, ({ width, height }) => {
        updateScaling(width, height);
        eventMap.resize.forEach(handler => handler(width, height));

        if (renderOnResize && elements.size > 0) {
            render();
        }
    });

    sceneGroup.eventBus = sceneEventBus;
    sceneEventBus.on(EVENTS.groupUpdated, () => {
        elements = sceneGroup.elements;
    });

    return {
        context,
        canvas,
        on,
        off,
        render,
        dispose,
        add: sceneGroup.add.bind(sceneGroup),
        remove: sceneGroup.remove.bind(sceneGroup),
        get elements() {
            return elements;
        },
    };
}