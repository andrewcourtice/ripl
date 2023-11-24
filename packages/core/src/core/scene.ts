import {
    createElementEvent,
} from './element';

import {
    createEvent,
} from './event-bus';

import {
    getContext,
    rescaleCanvas,
} from './context';

import {
    createGroup,
} from './group';

import {
    arrayFind,
    Disposable,
    DOMElementEventMap,
    DOMEventHandler,
    onDOMElementResize,
    onDOMEvent,
} from '@ripl/utilities';

import {
    Element,
    ElementEventMap,
    EventHandler,
    Scene,
    SceneEventMap,
    SceneOptions,
} from './types';

export function createScene(target: string | HTMLCanvasElement, options?: SceneOptions): Scene {
    let {
        canvas,
        context,
        clear,
        width,
        height,
        xScale,
        yScale,
    } = getContext(target);

    const {
        properties,
        renderOnResize = true,
    } = options || {};

    const group = createGroup(properties);
    const disposals = new Set<Disposable>();

    let graphHandle: number | undefined;
    let elements = group.graph();

    let left = 0;
    let top = 0;
    let activeElement: Element | undefined;

    function updateScaling(_width: number, _height: number) {
        width = _width;
        height = _height;

        ({
            xScale,
            yScale,
        } = rescaleCanvas(canvas, width, height));
    }

    function updateStyling() {
        const {
            font,
        } = window.getComputedStyle(document.body);

        context.font = font;
    }

    function attachDOMEvent<TEvent extends keyof DOMElementEventMap<typeof canvas>>(event: TEvent, handler: DOMEventHandler<typeof canvas, TEvent>) {
        disposals.add(onDOMEvent(canvas, event, handler));
    }

    function isElementActive(element: Element, x: number, y: number) {
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
    }

    function on<TEvent extends keyof SceneEventMap>(event: TEvent, handler: EventHandler<SceneEventMap[TEvent]>) {
        return group.on(event as keyof ElementEventMap, handler as EventHandler<ElementEventMap[keyof ElementEventMap]>);
    }

    function emit<TEvent extends keyof SceneEventMap>(event: TEvent, payload: SceneEventMap[TEvent]) {
        group.emit(event as keyof ElementEventMap, payload as ElementEventMap[keyof ElementEventMap]);
    }

    function render(time?: number) {
        clear();
        group.render(context, time);
    }

    function dispose() {
        disposals.forEach(({ dispose }) => dispose);
    }

    attachDOMEvent('mouseenter', event => {
        ({
            left,
            top,
        } = canvas.getBoundingClientRect());

        emit('scenemouseenter', createEvent(event));
    });

    attachDOMEvent('mouseleave', event => {
        emit('scenemouseleave', createEvent(event));
    });

    attachDOMEvent('mousemove', event => {
        const x = event.clientX - left;
        const y = event.clientY - top;

        emit('scenemousemove', createEvent({
            x,
            y,
            event,
        }));

        const matchedElement = arrayFind(elements, element => isElementActive(element, xScale(x), yScale(y)), -1);
        const baseEvent = createEvent(event);

        if (matchedElement && matchedElement === activeElement) {
            return matchedElement.emit('elementmousemove', {
                element: matchedElement,
                ...baseEvent,
            });
        }

        if (matchedElement) {
            matchedElement.emit('elementmouseenter', {
                element: matchedElement,
                ...baseEvent,
            });
        }

        if (activeElement) {
            activeElement.emit('elementmouseleave', {
                element: activeElement,
                ...baseEvent,
            });
        }

        activeElement = matchedElement;
    });

    attachDOMEvent('click', event => {
        const x = xScale(event.clientX - left);
        const y = yScale(event.clientY - top);

        const element = arrayFind(elements, element => isElementActive(element, x, y), -1);

        element?.emit('elementclick', createElementEvent(element, event));
    });

    updateStyling();

    onDOMElementResize(canvas, ({ width, height }) => {
        updateScaling(width, height);
        emit('resize', createEvent({
            width,
            height,
        }));

        if (renderOnResize && elements.length > 0) {
            render();
        }
    });

    group.on('scenegraph', () => {
        if (graphHandle) {
            cancelAnimationFrame(graphHandle);
            graphHandle = undefined;
        }

        graphHandle = requestAnimationFrame(() => {
            elements = group.graph();
        });
    });

    return {
        context,
        canvas,
        on,
        emit,
        render,
        dispose,
        add: group.add,
        remove: group.remove,
        clear: group.clear,
        find: group.find,
        findAll: group.findAll,
        graph: group.graph,

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