import {
    scaleContinuous,
} from '../scales';

/** A continuous scale mapping normalised values (0–1) to the RGB channel range (0–255) with clamping. */
export const scaleRGB = scaleContinuous([0, 1], [0, 255], {
    clamp: true,
});