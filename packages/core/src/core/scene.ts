import {
    createElementEvent,
} from './element';

import {
    createEvent,
} from './event-bus';

import {
    createContext,
    rescaleCanvas,
} from './context';

import {
    createGroup, isGroup,
} from './group';

import {
    arrayDedupe,
    arrayFilter,
    arrayFind,
    arrayForEach,
    arrayJoin,
    arrayReduce,
    Disposable,
    DOMElementEventMap,
    DOMEventHandler,
    functionMemoize,
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
    } = createContext(target);

    const {
        state,
        renderOnResize = true,
    } = options || {};

    const group = createGroup({ state });
    const disposals = new Set<Disposable>();
    const activeElements = [] as Element[];

    let graphHandle: number | undefined;
    let elements = group.graph();

    let left = 0;
    let top = 0;

    const getTrackedElements = functionMemoize((event: keyof ElementEventMap) => {
        const elements = arrayReduce(group.graph(true), (output, element) => {
            if (!element.has(event)) {
                return output;
            }

            return output.concat(isGroup(element)
                ? element.graph()
                : element);
        }, [] as Element[]);

        return arrayDedupe(elements);
    });

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

    function on<TEvent extends keyof SceneEventMap>(event: TEvent, handler: EventHandler<SceneEventMap[TEvent]>) {
        return group.on(event as keyof ElementEventMap, handler as EventHandler<ElementEventMap[keyof ElementEventMap]>);
    }

    function emit<TEvent extends keyof SceneEventMap>(event: TEvent, payload: SceneEventMap[TEvent]) {
        group.emit(event as keyof ElementEventMap, payload as ElementEventMap[keyof ElementEventMap]);
    }

    function render() {
        clear();
        group.render(context);
    }

    function dispose() {
        disposals.forEach(({ dispose }) => dispose);
    }

    attachDOMEvent('mouseenter', event => {
        ({
            left,
            top,
        } = canvas.getBoundingClientRect());

        emit('scene:mouseenter', createEvent(event));
    });

    attachDOMEvent('mouseleave', event => {
        emit('scene:mouseleave', createEvent(event));
    });

    attachDOMEvent('mousemove', event => {
        const x = event.clientX - left;
        const y = event.clientY - top;
        const trueX = xScale(x);
        const trueY = yScale(y);

        emit('scene:mousemove', createEvent({
            x,
            y,
            event,
        }));

        const trackedElements = [
            ...getTrackedElements('element:mousemove'),
            ...getTrackedElements('element:mouseenter'),
            ...getTrackedElements('element:mouseleave'),
        ];

        const baseEvent = createEvent(event);
        const hitElements = arrayFilter(trackedElements, element => element.intersectsWith(trueX, trueY, {
            isPointer: true,
        }));

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(hitElements, activeElements, (hitElement, activeElement) => hitElement === activeElement);

        arrayForEach(entries, element => {
            element.emit('element:mouseenter', {
                element,
                ...baseEvent,
            });

            activeElements.push(element);
        });

        arrayForEach(updates, ([element]) => element.emit('element:mousemove', {
            element,
            ...baseEvent,
        }));

        arrayForEach(exits, element => {
            element.emit('element:mouseleave', {
                element,
                ...baseEvent,
            });

            activeElements.splice(activeElements.indexOf(element), 1);
        });
    });

    attachDOMEvent('click', event => {
        const x = xScale(event.clientX - left);
        const y = yScale(event.clientY - top);

        const element = arrayFind(getTrackedElements('element:click'), element => element.intersectsWith(x, y, {
            isPointer: true,
        }), -1);

        element?.emit('element:click', createElementEvent(element, event));
    });

    updateStyling();

    onDOMElementResize(canvas, ({ width, height }) => {
        updateScaling(width, height);
        emit('scene:resize', createEvent({
            width,
            height,
        }));

        if (renderOnResize && elements.length > 0) {
            render();
        }
    });

    on('scene:graph', () => {
        if (graphHandle) {
            cancelAnimationFrame(graphHandle);
            graphHandle = undefined;
        }

        graphHandle = requestAnimationFrame(() => {
            elements = group.graph();
            getTrackedElements.cache.clear();
        });
    });

    on('scene:track', ({ data }) => data && getTrackedElements.cache.delete(data));
    on('scene:untrack', ({ data }) => data && getTrackedElements.cache.delete(data));

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