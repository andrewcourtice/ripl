import {
    Disposable,
} from '../global/types';

export type DOMEventHandler<TEvent extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[TEvent]) => void;
export type DOMElementResizeHandler = (event: DOMElementResizeEvent) => void;

export interface DOMElementResizeEvent {
    width: number;
    height: number;
}

export function onDOMEvent<TEvent extends keyof HTMLElementEventMap>(element: HTMLElement, event: TEvent, handler: DOMEventHandler<TEvent>): Disposable {
    element.addEventListener(event, handler);

    return {
        dispose: () => element.removeEventListener(event, handler),
    };
}

export function onDOMElementResize(element: HTMLElement, handler: DOMElementResizeHandler): Disposable {
    let disposer = {
        dispose: () => {},
    } as Disposable;

    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === element) {
                    handler({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height,
                    });
                    break;
                }
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