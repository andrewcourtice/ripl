import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    hasWindow,
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
