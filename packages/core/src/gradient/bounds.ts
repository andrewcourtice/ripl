import type {
    Box,
} from '../math';

/** Bounding rectangle a gradient's coordinates are resolved against. */
export type GradientBounds = {
    /** X coordinate of the rectangle's top-left corner. */
    x: number;
    /** Y coordinate of the rectangle's top-left corner. */
    y: number;
    /** Width of the bounding rectangle, in pixels. */
    width: number;
    /** Height of the bounding rectangle, in pixels. */
    height: number;
};

/**
 * Resolves the rectangle a gradient's coordinates map onto: the given bounding box, falling back to
 * the full surface when no box is supplied or it has no area.
 *
 * Every backend resolves gradients through this, so a gradient painted onto the same element renders
 * identically whichever context draws it — including elements that paint as several paths, where
 * each path's own box would otherwise restart the ramp.
 *
 * @param box - The element's local bounding box, when it has one.
 * @param width - Width of the rendering surface, used as the fallback.
 * @param height - Height of the rendering surface, used as the fallback.
 * @returns The rectangle to resolve gradient coordinates against.
 */
export function getGradientBounds(box: Box | undefined, width: number, height: number): GradientBounds {
    if (box && box.width > 0 && box.height > 0) {
        return {
            x: box.left,
            y: box.top,
            width: box.width,
            height: box.height,
        };
    }

    return {
        x: 0,
        y: 0,
        width,
        height,
    };
}
