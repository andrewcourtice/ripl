import {
    Gesture,
} from 'react-native-gesture-handler';

import type {
    ComposedGesture,
} from 'react-native-gesture-handler';

import type {
    SkiaPointerController,
} from './interaction';

/**
 * Composes the `react-native-gesture-handler` gestures that drive a {@link SkiaPointerController}: a
 * pan (for hover/move and drag) raced with a tap (for click). The resulting gesture is attached to
 * the canvas via a `GestureDetector`.
 *
 * @param controller - The pointer controller the gestures forward coordinates to.
 * @returns A composed gesture to hand to a `GestureDetector`.
 */
export function createRiplGesture(controller: SkiaPointerController): ComposedGesture {
    const pan = Gesture.Pan()
        .onBegin(event => {
            controller.pointerEnter();
            controller.pointerDown(event.x, event.y);
        })
        .onUpdate(event => controller.pointerMove(event.x, event.y))
        .onEnd(event => {
            controller.pointerUp(event.x, event.y);
            controller.pointerLeave();
        });

    const tap = Gesture.Tap().onEnd((event, success) => {
        if (success) {
            controller.click(event.x, event.y);
        }
    });

    return Gesture.Race(pan, tap);
}
