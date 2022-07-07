import {
    EVENTS,
} from './constants';

import {
    Element,
} from './element';

import {
    eventBus,
} from './event-bus';

import {
    Group,
    group,
} from './group';

import {
    continuous,
} from '../math/scale';

import {
    isString,
} from '../utilities/type';

import {
    DOMEventHandler,
    onDOMElementResize,
    onDOMEvent,
} from '../utilities/dom';

import type {
    Disposable,
} from '../global/types';

interface SceneEventMap {
    elementmouseenter(element: Element<any>): void;
    elementmouseleave(element: Element<any>): void;
    elementmousemove(element: Element<any>): void;
    scenemouseenter(event: MouseEvent): void;
    scenemouseleave(event: MouseEvent): void;
    scenemousemove(x: number, y: number, event: MouseEvent): void;
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
    get elements(): Set<Element<any>>;
}

export function scene(target: string | HTMLCanvasElement, els?: Element<any>[]): Scene {
    const canvas = isString(target) ? document.querySelector(target) as HTMLCanvasElement : target;
    const context = canvas?.getContext('2d');

    if (!context) {
        throw new Error('Failed to resolve canvas element');
    }

    const grp = group(els);
    const bus = eventBus();
    const disposals = new Set<Disposable>();

    const eventMap = {
        elementmouseenter: new Set(),
        elementmouseleave: new Set(),
        elementmousemove: new Set(),
        scenemouseenter: new Set(),
        scenemouseleave: new Set(),
        scenemousemove: new Set(),
    } as {
        [P in keyof SceneEventMap]: Set<SceneEventMap[P]>;
    };

    let stack = grp.elements;
    let scaleX = continuous([0, canvas.width], [0, canvas.width]);
    let scaleY = continuous([0, canvas.height], [0, canvas.height]);

    let left = 0;
    let top = 0;
    let activeElement: Element<any> | undefined;

    const updateScaling = (width: number, height: number) => {
        const dpr = window.devicePixelRatio;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        scaleX = continuous([0, width], [0, canvas.width]);
        scaleY = continuous([0, height], [0, canvas.height]);
    };

    const updateStyling = () => {
        const {
            font,
        } = window.getComputedStyle(document.body);

        context.font = font;
    };

    updateStyling();
    onDOMElementResize(canvas, ({ width, height }) => {
        updateScaling(width, height);
    });


    const attachDOMEvent = <TEvent extends keyof HTMLElementEventMap>(event: TEvent, handler: DOMEventHandler<TEvent>) => {
        disposals.add(onDOMEvent(canvas, event, handler));
    };

    const isElementActive = (element: Element<any>, x: number, y: number) => {
        const path = element?.result;

        return path instanceof Path2D
            && (context.isPointInPath(path, x, y)
            || context.isPointInStroke(path, x, y));
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

        const onElMousemove = (element: Element<any>) => eventMap.elementmousemove.forEach(handler => handler(element));
        const onElMouseenter = (element: Element<any>) => eventMap.elementmouseenter.forEach(handler => handler(element));
        const onElMouseleave = (element: Element<any>) => eventMap.elementmouseleave.forEach(handler => handler(element));

        eventMap.scenemousemove.forEach(handler => handler(x, y, event));

        let matchedElement: Element<any> | undefined;

        for (const element of Array.from(stack).reverse()) {
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

    grp.eventBus = bus;
    bus.on(EVENTS.groupUpdated, () => {
        stack = grp.elements;
    });

    return {
        context,
        canvas,
        on,
        off,
        dispose,
        add: grp.add.bind(grp),
        remove: grp.remove.bind(grp),
        render: time => grp.render(context, time),
        get elements() {
            return stack;
        },
    };
}