import type {
    Pattern,
    PatternTileGeometry,
    PatternTileShape,
} from './types';

/**
 * Resolves the renderer-agnostic tile geometry for a pattern. Both the canvas and SVG backends
 * draw the same primitive shapes, so a pattern renders identically across contexts. Diagonal
 * lines extend beyond the tile bounds so the motif tiles seamlessly once clipped and repeated.
 *
 * @param pattern - The parsed pattern to lay out.
 * @returns The tile size and the primitive shapes to draw within it.
 */
export function getPatternTileGeometry(pattern: Pattern): PatternTileGeometry {
    const { size, type } = pattern;
    const width = Math.max(1, size / 8);
    const mid = size / 2;

    let shapes: PatternTileShape[];

    switch (type) {
        case 'diagonal':
            shapes = [
                {
                    kind: 'line',
                    x1: 0,
                    y1: size,
                    x2: size,
                    y2: 0,
                    width,
                },
                {
                    kind: 'line',
                    x1: -mid,
                    y1: mid,
                    x2: mid,
                    y2: -mid,
                    width,
                },
                {
                    kind: 'line',
                    x1: mid,
                    y1: size + mid,
                    x2: size + mid,
                    y2: mid,
                    width,
                },
            ];
            break;
        case 'horizontal':
            shapes = [{
                kind: 'line',
                x1: 0,
                y1: mid,
                x2: size,
                y2: mid,
                width,
            }];
            break;
        case 'vertical':
            shapes = [{
                kind: 'line',
                x1: mid,
                y1: 0,
                x2: mid,
                y2: size,
                width,
            }];
            break;
        case 'cross-hatch':
            shapes = [
                {
                    kind: 'line',
                    x1: 0,
                    y1: mid,
                    x2: size,
                    y2: mid,
                    width,
                },
                {
                    kind: 'line',
                    x1: mid,
                    y1: 0,
                    x2: mid,
                    y2: size,
                    width,
                },
            ];
            break;
        case 'dots':
            shapes = [{
                kind: 'dot',
                cx: mid,
                cy: mid,
                radius: Math.max(1, size / 6),
            }];
            break;
    }

    return {
        size,
        shapes,
    };
}
