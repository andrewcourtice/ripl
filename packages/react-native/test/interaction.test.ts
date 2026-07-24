import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    SkiaPointerController,
} from '../src/interaction';

import type {
    ReactNativeSkiaContext,
} from '../src/context';

function fakeElement() {
    return {
        emit: vi.fn(),
    };
}

function fakeContext(hits: unknown[]) {
    return {
        emit: vi.fn(),
        queryHits: vi.fn(() => hits),
    };
}

function controllerFor(context: unknown, dragThreshold = 3) {
    return new SkiaPointerController(context as unknown as ReactNativeSkiaContext, {
        dragThreshold,
    });
}

describe('SkiaPointerController', () => {

    test('Should emit click on the topmost hit element', () => {
        const element = fakeElement();
        const context = fakeContext([element]);

        controllerFor(context).click(5, 5);

        expect(context.queryHits).toHaveBeenCalledWith(['click'], 5, 5);
        expect(element.emit).toHaveBeenCalledWith('click', {
            x: 5,
            y: 5,
        });
    });

    test('Should emit a context mousemove on pointer move', () => {
        const context = fakeContext([]);

        controllerFor(context).pointerMove(3, 4);

        expect(context.emit).toHaveBeenCalledWith('mousemove', {
            x: 3,
            y: 4,
        });
    });

    test('Should start a drag only once the threshold is exceeded', () => {
        const element = fakeElement();
        const context = fakeContext([element]);
        const controller = controllerFor(context, 3);

        controller.pointerDown(0, 0);
        controller.pointerMove(1, 1);

        expect(element.emit).not.toHaveBeenCalledWith('dragstart', expect.anything());

        controller.pointerMove(5, 5);

        expect(context.emit).toHaveBeenCalledWith('dragstart', {
            x: 0,
            y: 0,
        });
        expect(element.emit).toHaveBeenCalledWith('dragstart', {
            x: 0,
            y: 0,
        });
    });

    test('Should emit dragend on pointer up after a drag has started', () => {
        const element = fakeElement();
        const context = fakeContext([element]);
        const controller = controllerFor(context);

        controller.pointerDown(0, 0);
        controller.pointerMove(10, 0);
        controller.pointerUp(20, 0);

        expect(element.emit).toHaveBeenCalledWith('dragend', expect.objectContaining({
            x: 20,
            y: 0,
        }));
    });

    test('Should emit context mouseenter and mouseleave', () => {
        const context = fakeContext([]);
        const controller = controllerFor(context);

        controller.pointerEnter();
        controller.pointerLeave();

        expect(context.emit).toHaveBeenCalledWith('mouseenter', null);
        expect(context.emit).toHaveBeenCalledWith('mouseleave', null);
    });

});
