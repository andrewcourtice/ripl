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
    group,
} from './group';

import {
    isString,
} from '../utilities/type';

export interface Scene {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    elements: Set<Element<any>>;
    render: (time?: number) => void;
    add: (element: Element<any> | Element<any>[]) => void;
    //remove: (element: Element<any> | Element<any>[]) => void;
}

export function scene(target: string | HTMLCanvasElement, els?: Element<any>[]): Scene {
    const canvas = isString(target) ? document.querySelector(target) as HTMLCanvasElement : target;
    const context = canvas?.getContext('2d');

    if (!context) {
        throw new Error('Failed to resolve canvas element');
    }

    const dpr = window.devicePixelRatio;
    const grp = group(els);
    const bus = eventBus();

    const {
        width,
        height,
    } = canvas.getBoundingClientRect();

    grp.eventBus = bus;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const {
        font,
    } = window.getComputedStyle(document.body);

    context.font = font;

    let stack = grp.elements;

    bus.on(EVENTS.groupUpdated, () => {
        stack = grp.elements;
    });

    return {
        context,
        canvas,
        add: grp.add.bind(grp),
        remove: grp.remove.bind(grp),
        render: time => grp.render(context, time),
        get elements() {
            return stack;
        },
    };
}