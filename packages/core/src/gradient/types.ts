/** A single color stop within a gradient, consisting of a CSS color and an optional offset position. */
export interface GradientColorStop {
    /** The CSS color of the stop. */
    color: string;
    /** The stop's position along the gradient (0–1). Inferred from neighbouring stops when omitted. */
    offset?: number;
}

/** A parsed linear gradient with angle, color stops, and optional repeating flag. */
export interface LinearGradient {
    /** Discriminant identifying the gradient as linear. */
    type: 'linear';
    /** Whether the gradient repeats to fill the paint area (`repeating-linear-gradient`). */
    repeating: boolean;
    /** The gradient line's angle in degrees (0 points up, 90 to the right). */
    angle: number;
    /** The color stops along the gradient line. */
    stops: GradientColorStop[];
}

/** A parsed radial gradient with shape, position, color stops, and optional repeating flag. */
export interface RadialGradient {
    /** Discriminant identifying the gradient as radial. */
    type: 'radial';
    /** Whether the gradient repeats to fill the paint area (`repeating-radial-gradient`). */
    repeating: boolean;
    /** The gradient shape, e.g. `'circle'` or `'ellipse'`. */
    shape: string;
    /** The centre position as `[x, y]` percentages of the paint area. */
    position: [number, number];
    /** The color stops from the centre outward. */
    stops: GradientColorStop[];
}

/** A parsed conic gradient with angle, position, color stops, and optional repeating flag. */
export interface ConicGradient {
    /** Discriminant identifying the gradient as conic. */
    type: 'conic';
    /** Whether the gradient repeats to fill the paint area (`repeating-conic-gradient`). */
    repeating: boolean;
    /** The starting angle in degrees, measured clockwise from the top. */
    angle: number;
    /** The centre position as `[x, y]` percentages of the paint area. */
    position: [number, number];
    /** The color stops swept around the centre. */
    stops: GradientColorStop[];
}

/** Union of all supported gradient types. */
export type Gradient = LinearGradient | RadialGradient | ConicGradient;
/** The discriminant string identifying a gradient's kind (`'linear'`, `'radial'`, or `'conic'`). */
export type GradientType = Gradient['type'];
