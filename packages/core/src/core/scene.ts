import {
    Element,
    ElementEventMap,
} from './element';

import {
    Context,
    ContextType,
    createContext,
    typeIsContext,
} from '../context';

import {
    createFrameBuffer,
} from '../animation';

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
    resize: null;
}

export interface SceneOptions extends GroupOptions {
    renderOnResize?: boolean;
}

export class Scene extends Group<SceneEventMap> {

    public context: Context;

    public buffer: Element[];
    private disposals = new Set<Disposable>();

    public get width() {
        return this.context.width;
    }

    public get height() {
        return this.context.height;
    }

    constructor(target: Context | string | HTMLElement, options?: SceneOptions) {
        const {
            renderOnResize = true,
            ...groupOptions
        } = options || {};

        const context = typeIsContext(target)
            ? target
            : createContext(target, {
                buffer: false,
            });

        super({
            font: window.getComputedStyle(context.element).font,
            ...groupOptions,
        });

        this.context = context;
        this.buffer = this.graph();

        let left = 0;
        let top = 0;

        const requestFrame = createFrameBuffer();
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

        this.attachDOMEvent('mouseenter', () => {
            ({
                left,
                top,
            } = this.context.element.getBoundingClientRect());

            this.emit('mouseenter', null);
        });

        this.attachDOMEvent('mouseleave', () => {
            this.emit('mouseleave', null);
        });

        this.attachDOMEvent('mousemove', event => {
            const x = event.clientX - left;
            const y = event.clientY - top;
            const trueX = this.context.xScale(x);
            const trueY = this.context.yScale(y);

            this.emit('mousemove', {
                x,
                y,
            });

            const trackedElements = [
                ...getTrackedElements('mousemove'),
                ...getTrackedElements('mouseenter'),
                ...getTrackedElements('mouseleave'),
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
                activeElements.push(element);
                element.emit('mouseenter', null);
            });

            arrayForEach(updates, ([element]) => element.emit('mousemove', {
                x,
                y,
            }));

            arrayForEach(exits, element => {
                activeElements.splice(activeElements.indexOf(element), 1);
                element.emit('mouseleave', null);
            });
        });

        this.attachDOMEvent('click', event => {
            const x = this.context.xScale(event.clientX - left);
            const y = this.context.yScale(event.clientY - top);

            const element = arrayFind(getTrackedElements('click'), element => element.intersectsWith(x, y, {
                isPointer: true,
            }), -1);

            element?.emit('click', {
                x,
                y,
            });
        });

        context.on('resize', () => {
            this.emit('resize', null);
            if (renderOnResize && !!this.buffer.length) {
                this.render();
            }
        });

        this.on('graph', () => requestFrame(() => {
            this.buffer = this.graph().sort((ea, eb) => ea.zIndex - eb.zIndex);
            getTrackedElements.cache.clear();
        }));

        this.on('track', ({ data }) => getTrackedElements.cache.delete(data));
        this.on('untrack', ({ data }) => getTrackedElements.cache.delete(data));
    }

    private attachDOMEvent<TEvent extends keyof DOMElementEventMap<HTMLElement>>(event: TEvent, handler: DOMEventHandler<HTMLElement, TEvent>) {
        this.disposals.add(onDOMEvent(this.context.element, event, handler));
    }

    public destroy(): void {
        this.disposals.forEach(disposal => disposal.dispose());
        this.context.destroy();
        super.destroy();
    }

    public render(): void {
        this.context.clear();
        this.context.markRenderStart();
        arrayForEach(this.buffer, element => element.render(this.context));
        this.context.markRenderEnd();
    }

}

export function createScene(...options: ConstructorParameters<typeof Scene>) {
    return new Scene(...options);
}