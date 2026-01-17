import {
    arrayFind,
} from './collection';

import type {
    Disposable,
} from './types';

export type DOMEventHandler<TElement, TEvent extends keyof DOMElementEventMap<TElement>> = (this: TElement, event: DOMElementEventMap<TElement>[TEvent]) => void;
export type DOMElementResizeHandler = (event: DOMElementResizeEvent) => void;

export type DOMElementEventMap<TElement> = TElement extends MediaQueryList ? MediaQueryListEventMap
    : TElement extends HTMLElement ? HTMLElementEventMap
        : TElement extends Window ? WindowEventMap
            : TElement extends Document ? DocumentEventMap
                : Record<string, Event>;

export interface DOMElementResizeEvent {
    width: number;
    height: number;
}

export function onDOMEvent<TElement extends EventTarget, TEvent extends keyof DOMElementEventMap<TElement> & string>(element: TElement, event: TEvent, handler: DOMEventHandler<TElement, TEvent>): Disposable {
    element.addEventListener(event, handler as EventListener);

    return {
        dispose: () => element.removeEventListener(event, handler as EventListener),
    };
}

export function onDOMElementResize(element: HTMLElement, handler: DOMElementResizeHandler): Disposable {
    let disposer = {
        dispose: () => {},
    } as Disposable;

    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(entries => {
            const entry = arrayFind(entries, ({ target }) => target === element);

            if (entry) {
                handler({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        observer.observe(element, {
            box: 'border-box',
        });

        disposer = {
            dispose: () => observer.disconnect(),
        };
    } else {
        disposer = onDOMEvent(window, 'resize', () => {
            const {
                width,
                height,
            } = element.getBoundingClientRect();

            handler({
                width,
                height,
            });
        });
    }

    return disposer;
}
