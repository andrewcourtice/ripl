/** A single color stop within a gradient, consisting of a CSS color and an optional offset position. */
export interface GradientColorStop {
    color: string;
    offset?: number;
}

/** A parsed linear gradient with angle, color stops, and optional repeating flag. */
export interface LinearGradient {
    type: 'linear';
    repeating: boolean;
    angle: number;
    stops: GradientColorStop[];
}

/** A parsed radial gradient with shape, position, color stops, and optional repeating flag. */
export interface RadialGradient {
    type: 'radial';
    repeating: boolean;
    shape: string;
    position: [number, number];
    stops: GradientColorStop[];
}

/** A parsed conic gradient with angle, position, color stops, and optional repeating flag. */
export interface ConicGradient {
    type: 'conic';
    repeating: boolean;
    angle: number;
    position: [number, number];
    stops: GradientColorStop[];
}

/** Union of all supported gradient types. */
export type Gradient = LinearGradient | RadialGradient | ConicGradient;
export type GradientType = Gradient['type'];
