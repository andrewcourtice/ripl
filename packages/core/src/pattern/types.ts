/** The built-in pattern tile motifs available to `pattern(...)` paint strings. */
export type PatternType = 'diagonal' | 'cross-hatch' | 'dots' | 'horizontal' | 'vertical';

/** A parsed repeating pattern (decal) fill, used to keep series distinguishable without relying on color alone. */
export interface Pattern {
    /** The built-in tile motif drawn by the pattern. */
    type: PatternType;
    /** The CSS color used to draw the pattern's lines or dots. */
    foreground: string;
    /** The CSS color painted behind the motif; `'transparent'` leaves the tile see-through. */
    background: string;
    /** The width and height of the square repeating tile, in user-space pixels. */
    size: number;
}

/** A straight line segment within a pattern tile, stroked with the pattern's foreground color. */
export interface PatternTileLine {
    /** Discriminant identifying the shape as a line segment. */
    kind: 'line';
    /** The x coordinate of the line's start point, in tile space. */
    x1: number;
    /** The y coordinate of the line's start point, in tile space. */
    y1: number;
    /** The x coordinate of the line's end point, in tile space. */
    x2: number;
    /** The y coordinate of the line's end point, in tile space. */
    y2: number;
    /** The stroke width of the line, in tile-space pixels. */
    width: number;
}

/** A filled circular dot within a pattern tile, filled with the pattern's foreground color. */
export interface PatternTileDot {
    /** Discriminant identifying the shape as a dot. */
    kind: 'dot';
    /** The x coordinate of the dot's centre, in tile space. */
    cx: number;
    /** The y coordinate of the dot's centre, in tile space. */
    cy: number;
    /** The radius of the dot, in tile-space pixels. */
    radius: number;
}

/** Union of the primitive shapes a pattern tile is composed of. */
export type PatternTileShape = PatternTileLine | PatternTileDot;

/** The renderer-agnostic geometry of a single repeating pattern tile. */
export interface PatternTileGeometry {
    /** The width and height of the square tile, in user-space pixels. */
    size: number;
    /** The primitive shapes to draw within the tile, in paint order. Shapes may extend beyond the tile bounds so the motif tiles seamlessly once clipped and repeated. */
    shapes: PatternTileShape[];
}
