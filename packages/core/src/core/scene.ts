import {
    Element,
    ElementEventMap,
} from './element';

import {
    Context,
    ContextType,
    createContext,
} from '../context';

import {
    Group,
    GroupOptions,
    isGroup,
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
    onDOMEvent,
} from '@ripl/utilities';

export interface SceneEventMap extends ElementEventMap {
    'scene:resize': null;
    'scene:mouseenter': MouseEvent;
    'scene:mouseleave': MouseEvent;
    'scene:mousemove': {
        x: number;
        y: number;
        event: MouseEvent;
    };
}

export interface SceneOptions extends GroupOptions {
    type?: ContextType;
    renderOnResize?: boolean;
}

export class Scene extends Group<SceneEventMap> {

    readonly context: Context;
    public buffer: Element[];
    private disposals = new Set<Disposable>();

    public get width() {
        return this.context.width;
    }

    public get height() {
        return this.context.height;
    }

    constructor(target: string | HTMLElement, options?: SceneOptions) {
        const {
            type,
            renderOnResize = true,
            ...groupOptions
        } = options || {};

        const context = createContext(target, {
            type,
        });

        super({
            font: window.getComputedStyle(context.element).font,
            ...groupOptions,
        });

        this.context = context;
        this.buffer = this.graph();

        let graphHandle: number | undefined;
        let left = 0;
        let top = 0;

        const activeElements = [] as Element[];
        const getTrackedElements = functionMemoize((event: keyof ElementEventMap) => {
            const elements = arrayReduce(this.graph(true), (output, element) => {
                if (!element.has(event)) {
                    return output;
                }

                return output.concat(isGroup(element)
                    ? element.graph()
                    : element);
            }, [] as Element[]);

            return arrayDedupe(elements);
        });

        this.attachDOMEvent('mouseenter', event => {
            ({
                left,
                top,
            } = this.context.element.getBoundingClientRect());

            this.emit('scene:mouseenter', event);
        });

        this.attachDOMEvent('mouseleave', event => {
            this.emit('scene:mouseleave', event);
        });

        this.attachDOMEvent('mousemove', event => {
            const x = event.clientX - left;
            const y = event.clientY - top;
            const trueX = this.context.xScale(x);
            const trueY = this.context.yScale(y);

            this.emit('scene:mousemove', {
                x,
                y,
                event,
            });

            const trackedElements = [
                ...getTrackedElements('element:mousemove'),
                ...getTrackedElements('element:mouseenter'),
                ...getTrackedElements('element:mouseleave'),
            ];

            const hitElements = arrayFilter(trackedElements, element => element.intersectsWith(trueX, trueY, {
                isPointer: true,
            }));

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(hitElements, activeElements, (hitElement, activeElement) => hitElement === activeElement);

            arrayForEach(entries, element => {
                element.emit('element:mouseenter', event);
                activeElements.push(element);
            });

            arrayForEach(updates, ([element]) => element.emit('element:mousemove', event));

            arrayForEach(exits, element => {
                element.emit('element:mouseleave', event);
                activeElements.splice(activeElements.indexOf(element), 1);
            });
        });

        this.attachDOMEvent('click', event => {
            const x = this.context.xScale(event.clientX - left);
            const y = this.context.yScale(event.clientY - top);

            const element = arrayFind(getTrackedElements('element:click'), element => element.intersectsWith(x, y, {
                isPointer: true,
            }), -1);

            element?.emit('element:click', event);
        });

        context.on('context:resize', () => {
            this.emit('scene:resize', null);
            if (renderOnResize && !!this.buffer.length) {
                this.render();
            }
        });

        this.on('scene:graph', () => {
            if (graphHandle) {
                cancelAnimationFrame(graphHandle);
                graphHandle = undefined;
            }

            graphHandle = requestAnimationFrame(() => {
                this.buffer = this.graph().sort((ea, eb) => ea.zIndex - eb.zIndex);
                getTrackedElements.cache.clear();
            });
        });

        this.on('scene:track', ({ data }) => getTrackedElements.cache.delete(data));
        this.on('scene:untrack', ({ data }) => getTrackedElements.cache.delete(data));
    }

    private attachDOMEvent<TEvent extends keyof DOMElementEventMap<HTMLElement>>(event: TEvent, handler: DOMEventHandler<HTMLElement, TEvent>) {
        this.disposals.add(onDOMEvent(this.context.element, event, handler));
    }

    public destroy(): void {
        this.disposals.forEach(disposal => disposal.dispose());
        super.destroy();
    }

    public render(): void {
        this.context.clear();
        arrayForEach(this.buffer, element => element.render(this.context));
    }

}

export function createScene(...options: ConstructorParameters<typeof Scene>) {
    return new Scene(...options);
}