import {
    scaleContinuous,
} from '../scales';

export const scaleRGB = scaleContinuous([0, 1], [0, 255], {
    clamp: true,
});