import type {
    ConicGradient,
    Gradient,
    GradientColorStop,
    GradientType,
    LinearGradient,
    RadialGradient,
} from './types';


function serializeStop(stop: GradientColorStop): string {
    if (stop.offset !== undefined) {
        return `${stop.color} ${(stop.offset * 100).toFixed(2)}%`;
    }

    return stop.color;
}

function serializeStops(stops: GradientColorStop[]): string {
    return stops.map(serializeStop).join(', ');
}

function serializeLinearGradient(gradient: LinearGradient): string {
    const prefix = gradient.repeating ? 'repeating-' : '';
    const parts: string[] = [];

    if (gradient.angle !== 180) {
        parts.push(`${gradient.angle}deg`);
    }

    parts.push(serializeStops(gradient.stops));

    return `${prefix}linear-gradient(${parts.join(', ')})`;
}

function serializeRadialGradient(gradient: RadialGradient): string {
    const prefix = gradient.repeating ? 'repeating-' : '';
    const parts: string[] = [];

    const hasNonDefaultShape = gradient.shape !== 'ellipse';
    const hasNonDefaultPosition = gradient.position[0] !== 50 || gradient.position[1] !== 50;

    if (hasNonDefaultShape || hasNonDefaultPosition) {
        let descriptor = gradient.shape;

        if (hasNonDefaultPosition) {
            descriptor += ` at ${gradient.position[0]}% ${gradient.position[1]}%`;
        }

        parts.push(descriptor);
    }

    parts.push(serializeStops(gradient.stops));

    return `${prefix}radial-gradient(${parts.join(', ')})`;
}

function serializeConicGradient(gradient: ConicGradient): string {
    const prefix = gradient.repeating ? 'repeating-' : '';
    const parts: string[] = [];

    const hasNonDefaultAngle = gradient.angle !== 0;
    const hasNonDefaultPosition = gradient.position[0] !== 50 || gradient.position[1] !== 50;

    if (hasNonDefaultAngle || hasNonDefaultPosition) {
        let descriptor = '';

        if (hasNonDefaultAngle) {
            descriptor += `from ${gradient.angle}deg`;
        }

        if (hasNonDefaultPosition) {
            descriptor += ` at ${gradient.position[0]}% ${gradient.position[1]}%`;
        }

        parts.push(descriptor.trim());
    }

    parts.push(serializeStops(gradient.stops));

    return `${prefix}conic-gradient(${parts.join(', ')})`;
}

/** Serializer dispatch keyed by gradient type. */
const GRADIENT_SERIALIZERS: Record<GradientType, (gradient: Gradient) => string> = {
    linear: gradient => serializeLinearGradient(gradient as LinearGradient),
    radial: gradient => serializeRadialGradient(gradient as RadialGradient),
    conic: gradient => serializeConicGradient(gradient as ConicGradient),
};

/** Serializes a structured `Gradient` object back into a CSS gradient string. */
export function serializeGradient(gradient: Gradient): string {
    return GRADIENT_SERIALIZERS[gradient.type](gradient);
}
