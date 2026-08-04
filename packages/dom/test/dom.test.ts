import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    hasWindow,
    onDOMElementResize,
    onDOMEvent,
} from '../src/dom';

describe('hasWindow', () => {

    test('Should be true in jsdom environment', () => {
        expect(hasWindow).toBe(true);
    });

});

describe('onDOMEvent', () => {

    test('Should attach an event listener', () => {
        const el = document.createElement('div');
        const handler = vi.fn();

        onDOMEvent(el, 'click', handler);

        el.dispatchEvent(new Event('click'));

        expect(handler).toHaveBeenCalledOnce();
    });

    test('Should return a disposable', () => {
        const el = document.createElement('div');
        const handler = vi.fn();

        const subscription = onDOMEvent(el, 'click', handler);

        subscription.dispose();

        el.dispatchEvent(new Event('click'));

        expect(handler).not.toHaveBeenCalled();
    });

    test('Should pass event object to handler', () => {
        const el = document.createElement('div');
        const handler = vi.fn();

        onDOMEvent(el, 'click', handler);

        const event = new Event('click');
        el.dispatchEvent(event);

        expect(handler).toHaveBeenCalledWith(event);
    });

});

describe('onDOMElementResize', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('Should use ResizeObserver when available', () => {
        const el = document.createElement('div');
        const handler = vi.fn();
        const observeSpy = vi.fn();
        const disconnectSpy = vi.fn();

        vi.stubGlobal('ResizeObserver', class {
            observe = observeSpy;
            unobserve = vi.fn();
            disconnect = disconnectSpy;
        });

        const disposable = onDOMElementResize(el, handler);

        expect(observeSpy).toHaveBeenCalledWith(el, {
            box: 'border-box',
        });

        disposable.dispose();
        expect(disconnectSpy).toHaveBeenCalled();

        vi.unstubAllGlobals();
    });

    // jsdom has no `ResizeObserver`, so leaving it unstubbed is what reaches the fallback branch.
    test('Should report the content box when falling back to window resize', () => {
        const el = document.createElement('div');
        const handler = vi.fn();

        el.style.padding = '10px';
        el.style.border = '2px solid black';
        document.body.appendChild(el);

        vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
            width: 420,
            height: 320,
        } as DOMRect);

        const disposable = onDOMElementResize(el, handler);

        window.dispatchEvent(new Event('resize'));

        expect(handler).toHaveBeenCalledWith({
            width: 396,
            height: 296,
        });

        disposable.dispose();
        el.remove();
    });

    test('Should return a disposable that disconnects the observer', () => {
        const el = document.createElement('div');
        const handler = vi.fn();
        const disconnectSpy = vi.fn();

        vi.stubGlobal('ResizeObserver', class {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = disconnectSpy;
        });

        const disposable = onDOMElementResize(el, handler);
        disposable.dispose();

        expect(disconnectSpy).toHaveBeenCalledTimes(1);

        vi.unstubAllGlobals();
    });

});
