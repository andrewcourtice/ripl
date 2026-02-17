export interface GradientColorStop {
    color: string;
    offset?: number;
}

export interface LinearGradient {
    type: 'linear';
    repeating: boolean;
    angle: number;
    stops: GradientColorStop[];
}

export interface RadialGradient {
    type: 'radial';
    repeating: boolean;
    shape: string;
    position: [number, number];
    stops: GradientColorStop[];
}

export interface ConicGradient {
    type: 'conic';
    repeating: boolean;
    angle: number;
    position: [number, number];
    stops: GradientColorStop[];
}

export type Gradient = LinearGradient | RadialGradient | ConicGradient;
export type GradientType = Gradient['type'];
