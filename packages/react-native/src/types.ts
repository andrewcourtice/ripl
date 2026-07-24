import type {
    SkPicture,
} from '@shopify/react-native-skia';

import type {
    ContextOptions,
} from '@ripl/core';

/**
 * A listener notified each time the context finishes recording a frame, receiving the freshly
 * recorded {@link SkPicture} to present (typically pushed into React state so a Skia `<Picture>`
 * repaints).
 *
 * @param picture - The picture recorded for the just-completed render pass.
 */
export type PresentListener = (picture: SkPicture) => void;

/**
 * Options for constructing a {@link ReactNativeSkiaContext}.
 *
 * @typeParam TMeta - The shape of arbitrary backend metadata carried on the context.
 */
export interface ReactNativeSkiaContextOptions<TMeta extends Record<string, unknown> = Record<string, unknown>> extends ContextOptions<TMeta> {
    /** Initial surface width in logical pixels. Defaults to `0` until the first layout pass. */
    width?: number;
    /** Initial surface height in logical pixels. Defaults to `0` until the first layout pass. */
    height?: number;
}
