import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import type {
    LayoutChangeEvent,
} from 'react-native';

import type {
    ComposedGesture,
} from 'react-native-gesture-handler';

import type {
    SkPicture,
    SkTypeface,
} from '@shopify/react-native-skia';

import {
    ReactNativeSkiaContext,
} from '../context';

import {
    registerTypeface,
} from '../font';

import {
    createRiplGesture,
} from '../gestures';

import {
    SkiaPointerController,
} from '../interaction';

/** Options for {@link useRiplContext}. */
export interface UseRiplContextOptions {
    /** Initial surface width in logical pixels (updated by `onLayout`). */
    width?: number;
    /** Initial surface height in logical pixels (updated by `onLayout`). */
    height?: number;
    /** Whether touch interaction (hover/drag/tap → Ripl pointer events) is enabled. Defaults to `true`. */
    interactive?: boolean;
    /** Minimum pointer travel, in logical pixels, before a press becomes a drag. Defaults to `3`. */
    dragThreshold?: number;
    /** Typefaces to register (keyed by the family name a `font` string references) before the first render, so text measures correctly. */
    fonts?: Record<string, SkTypeface>;
}

/** The value returned by {@link useRiplContext}, wiring a Skia surface to a Ripl context. */
export interface RiplContextHandle {
    /** The React Native Skia rendering context. */
    context: ReactNativeSkiaContext;
    /** The most recently recorded picture to present, or `null` before the first render. */
    picture: SkPicture | null;
    /** Layout handler to pass to the Skia `<Canvas onLayout>` so the context tracks its size. */
    onLayout: (event: LayoutChangeEvent) => void;
    /** The composed gesture to attach via a `GestureDetector`, or `undefined` when interaction is disabled. */
    gesture?: ComposedGesture;
}

/**
 * Creates and owns a {@link ReactNativeSkiaContext} for a component, exposing the picture to present,
 * an `onLayout` sizing handler, and (unless disabled) the touch gesture. The context is created once
 * and destroyed on unmount.
 *
 * @param options - Context and interaction options.
 * @returns The context handle to wire into a Skia surface.
 */
export function useRiplContext(options?: UseRiplContextOptions): RiplContextHandle {
    const [picture, setPicture] = useState<SkPicture | null>(null);

    const {
        context,
        gesture,
    } = useMemo(() => {
        if (options?.fonts) {
            Object.entries(options.fonts).forEach(([family, typeface]) => registerTypeface(family, typeface));
        }

        const instance = new ReactNativeSkiaContext({
            width: options?.width,
            height: options?.height,
            interactive: options?.interactive,
            dragThreshold: options?.dragThreshold,
        });

        const composedGesture = options?.interactive === false
            ? undefined
            : createRiplGesture(new SkiaPointerController(instance, {
                dragThreshold: options?.dragThreshold,
            }));

        return {
            context: instance,
            gesture: composedGesture,
        };
        // The context is intentionally created once; size changes flow through `onLayout`/`resize`.
    }, []);

    useEffect(() => {
        const subscription = context.onPresent(setPicture);

        return () => {
            subscription.dispose();
            context.destroy();
        };
    }, [context]);

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const {
            width,
            height,
        } = event.nativeEvent.layout;

        context.resize(width, height);
    }, [context]);

    return {
        context,
        picture,
        onLayout,
        gesture,
    };
}
