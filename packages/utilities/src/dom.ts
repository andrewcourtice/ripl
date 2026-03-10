import type {
    Disposable,
} from './types';

/** A strongly-typed DOM event handler bound to a specific element and event type. */
export type DOMEventHandler<TElement, TEvent extends keyof DOMElementEventMap<TElement>> = (this: TElement, event: DOMElementEventMap<TElement>[TEvent]) => void;

/** Callback invoked when an observed element is resized. */
export type DOMElementResizeHandler = (event: DOMElementResizeEvent) => void;

/** Resolves the correct event map for a given DOM element type. */
export type DOMElementEventMap<TElement> = TElement extends MediaQueryList ? MediaQueryListEventMap
    : TElement extends HTMLElement ? HTMLElementEventMap
        : TElement extends Window ? WindowEventMap
            : TElement extends Document ? DocumentEventMap
                : Record<string, Event>;

/** Simplified resize event containing the new dimensions of the observed element. */
export interface DOMElementResizeEvent {
    width: number;
    height: number;
}

/** Whether the current environment has a `window` object (i.e. is a browser context). */
export const hasWindow = typeof window !== 'undefined';

/** Attaches a strongly-typed event listener to a DOM element and returns a disposable for cleanup. */
export function onDOMEvent<TElement extends EventTarget, TEvent extends string & keyof DOMElementEventMap<TElement>>(element: TElement, event: TEvent, handler: DOMEventHandler<TElement, TEvent>): Disposable {
    element.addEventListener(event, handler as EventListener);

    return {
        dispose: () => element.removeEventListener(event, handler as EventListener),
    };
}

/** Observes an element for size changes using `ResizeObserver` (with a `window.resize` fallback) and returns a disposable. */
export function onDOMElementResize(element: HTMLElement, handler: DOMElementResizeHandler): Disposable {
    let disposer: Disposable;

    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(entries => {
            const entry = entries.find(({ target }) => target === element);

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