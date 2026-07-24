import {
    StyleSheet,
} from 'react-native';

import type {
    LayoutChangeEvent,
    StyleProp,
    ViewStyle,
} from 'react-native';

import {
    Canvas,
    Picture,
} from '@shopify/react-native-skia';

import type {
    SkPicture,
} from '@shopify/react-native-skia';

import {
    GestureDetector,
} from 'react-native-gesture-handler';

import type {
    ComposedGesture,
} from 'react-native-gesture-handler';

const styles = StyleSheet.create({
    canvas: {
        flex: 1,
    },
});

/** Props for {@link RiplSurface}. */
export interface RiplSurfaceProps {
    /** The Skia picture to present, or `null` before the first render. */
    picture: SkPicture | null;
    /** Layout handler forwarded to the Skia `<Canvas onLayout>`. */
    onLayout: (event: LayoutChangeEvent) => void;
    /** The composed touch gesture to attach, or `undefined` to render without interaction. */
    gesture?: ComposedGesture;
    /** Style applied to the underlying Skia `<Canvas>` (defaults to `{ flex: 1 }`). */
    style?: StyleProp<ViewStyle>;
}

/**
 * The low-level Skia surface: a `<Canvas>` presenting the current {@link SkPicture}, optionally
 * wrapped in a `GestureDetector`. Used internally by {@link RiplCanvas} and the chart components; can
 * also be driven directly with a {@link useRiplScene}/{@link useRiplContext} handle.
 *
 * @param props - The surface props.
 * @returns The rendered Skia surface element.
 */
export function RiplSurface(props: RiplSurfaceProps) {
    const {
        picture,
        onLayout,
        gesture,
        style,
    } = props;

    const canvas = (
        <Canvas style={[styles.canvas, style]} onLayout={onLayout}>
            {picture ? <Picture picture={picture} /> : null}
        </Canvas>
    );

    if (gesture) {
        return (
            <GestureDetector gesture={gesture}>
                {canvas}
            </GestureDetector>
        );
    }

    return canvas;
}
