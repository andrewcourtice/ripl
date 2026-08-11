import {
    textureSourceHeight,
    textureSourceWidth,
} from './texture';

import type {
    Texture,
    TextureSource,
    TextureWrap,
} from './texture';

/**
 * The tile geometry and repetition a {@link Texture} maps onto, and the pattern built from it.
 *
 * The tile is the texture's own image unless a wrap mode needs a derived one — a mirrored axis
 * doubles the tile so the browser's plain repetition reproduces the flip, and an `ImageData` source
 * is materialised into a canvas because `createPattern` will not accept it.
 */
export interface TexturePattern {
    /** The repeating pattern to fill with, or `null` when the texture has no pixels yet. */
    pattern: CanvasPattern | null;
    /** The repetition mode the pattern was created with. */
    repetition: TexturePatternRepetition;
}

/** The `createPattern` repetition modes a texture's wrap modes resolve to. */
export type TexturePatternRepetition = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';

interface CachedTexturePattern extends TexturePattern {
    version: number;
}

// Keyed by context for the same reason `@ripl/canvas` keys its paint cache that way: a
// `CanvasPattern` belongs to the context that created it and must not outlive it.
const patternCaches = new WeakMap<CanvasRenderingContext2D, Map<string, CachedTexturePattern>>();

// A mirrored axis has no `createPattern` repetition of its own, so it is baked into a double-width
// tile that plain repetition then reproduces.
function axisRepeats(wrap: TextureWrap): boolean {
    return wrap !== 'clamp';
}

/**
 * Maps a texture's wrap modes onto the `createPattern` repetition that reproduces them.
 *
 * `'mirror'` has no repetition of its own and is carried by the tile instead, so it resolves the
 * same way `'repeat'` does.
 *
 * @param wrapS - How horizontal coordinates outside the unit range are resolved.
 * @param wrapT - How vertical coordinates outside the unit range are resolved.
 * @returns The repetition mode to create the pattern with.
 */
export function texturePatternRepetition(wrapS: TextureWrap, wrapT: TextureWrap): TexturePatternRepetition {
    if (axisRepeats(wrapS)) {
        return axisRepeats(wrapT) ? 'repeat' : 'repeat-x';
    }

    return axisRepeats(wrapT) ? 'repeat-y' : 'no-repeat';
}

function createTileCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    return canvas;
}

// `createPattern` and `drawImage` both reject `ImageData`, so it is painted into a canvas once.
function materializeSource(source: TextureSource, width: number, height: number): CanvasImageSource | null {
    if (typeof ImageData === 'undefined' || !(source instanceof ImageData)) {
        return source as CanvasImageSource;
    }

    const canvas = createTileCanvas(width, height);
    const context = canvas.getContext('2d');

    if (!context) {
        return null;
    }

    context.putImageData(source, 0, 0);

    return canvas;
}

function createMirroredTile(
    source: CanvasImageSource,
    width: number,
    height: number,
    mirrorX: boolean,
    mirrorY: boolean
): CanvasImageSource | null {
    const canvas = createTileCanvas(mirrorX ? width * 2 : width, mirrorY ? height * 2 : height);
    const context = canvas.getContext('2d');

    if (!context) {
        return null;
    }

    const columns = mirrorX ? [false, true] : [false];
    const rows = mirrorY ? [false, true] : [false];

    for (const flipX of columns) {
        for (const flipY of rows) {
            context.save();
            context.translate(flipX ? width * 2 : 0, flipY ? height * 2 : 0);
            context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            context.drawImage(source, 0, 0, width, height);
            context.restore();
        }
    }

    return canvas;
}

function createTexturePattern(ctx: CanvasRenderingContext2D, texture: Texture): TexturePattern {
    const repetition = texturePatternRepetition(texture.wrapS, texture.wrapT);
    const mirrorX = texture.wrapS === 'mirror';
    const mirrorY = texture.wrapT === 'mirror';
    const width = textureSourceWidth(texture.source);
    const height = textureSourceHeight(texture.source);

    const empty: TexturePattern = {
        pattern: null,
        repetition,
    };

    if (width <= 0 || height <= 0) {
        return empty;
    }

    const materialized = materializeSource(texture.source, width, height);

    if (!materialized) {
        return empty;
    }

    const tile = mirrorX || mirrorY
        ? createMirroredTile(materialized, width, height, mirrorX, mirrorY)
        : materialized;

    if (!tile) {
        return empty;
    }

    return {
        ...empty,
        pattern: ctx.createPattern(tile, repetition),
    };
}

/**
 * Builds the repeating `CanvasPattern` that maps a texture across a surface, caching it per context
 * and texture version.
 *
 * A pattern tiles infinitely, which is what makes a `repeat` above `1` cover the whole surface — a
 * single `drawImage` paints one tile and leaves the rest bare. It is also one fill per triangle
 * rather than one image draw, and it is where a texture's wrap modes finally reach the Canvas
 * backend. Release it with {@link releaseTexturePatternCache} when the context is torn down.
 *
 * @param ctx - The native context the pattern will paint into.
 * @param texture - The texture to tile.
 * @returns The pattern and the tile scale the UV transform must account for.
 */
export function resolveTexturePattern(ctx: CanvasRenderingContext2D, texture: Texture): TexturePattern {
    const cache = patternCaches.get(ctx) ?? new Map<string, CachedTexturePattern>();

    patternCaches.set(ctx, cache);

    const cached = cache.get(texture.id);

    if (cached && cached.version === texture.version) {
        return cached;
    }

    const resolved = {
        ...createTexturePattern(ctx, texture),
        version: texture.version,
    };

    cache.set(texture.id, resolved);

    return resolved;
}

/**
 * Drops every texture pattern cached against a context, together with the offscreen tile canvases
 * the mirrored and `ImageData`-backed ones hold. Call it when the context is torn down.
 *
 * @param ctx - The native context whose cached patterns are released.
 */
export function releaseTexturePatternCache(ctx: CanvasRenderingContext2D): void {
    patternCaches.delete(ctx);
}
