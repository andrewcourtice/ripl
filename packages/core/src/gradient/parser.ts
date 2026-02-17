import type {
    ConicGradient,
    Gradient,
    GradientColorStop,
    LinearGradient,
    RadialGradient,
} from './types';

const GRADIENT_PATTERN = /^(repeating-)?(linear|radial|conic)-gradient\((.+)\)$/is;

const DIRECTION_MAP: Record<string, number> = {
    'to top': 0,
    'to top right': 45,
    'to right': 90,
    'to bottom right': 135,
    'to bottom': 180,
    'to bottom left': 225,
    'to left': 270,
    'to top left': 315,
};

function splitGradientArgs(input: string): string[] {
    const args: string[] = [];
    let depth = 0;
    let current = '';

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === '(') {
            depth++;
            current += char;
        } else if (char === ')') {
            depth--;
            current += char;
        } else if (char === ',' && depth === 0) {
            args.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        args.push(current.trim());
    }

    return args;
}

function parsePosition(value: string): [number, number] {
    const atMatch = value.match(/at\s+(.+)/i);

    if (!atMatch) {
        return [50, 50];
    }

    const parts = atMatch[1].trim().split(/\s+/);
    const parsedX = parseFloat(parts[0]);
    const parsedY = parts.length > 1 ? parseFloat(parts[1]) : NaN;
    const x = Number.isNaN(parsedX) ? 50 : parsedX;
    const y = Number.isNaN(parsedY) ? 50 : parsedY;

    return [x, y];
}

function parseColorStop(value: string): GradientColorStop {
    const trimmed = value.trim();
    const lastSpaceIndex = trimmed.lastIndexOf(' ');

    if (lastSpaceIndex === -1) {
        return { color: trimmed };
    }

    const possibleOffset = trimmed.slice(lastSpaceIndex + 1);
    const percentMatch = possibleOffset.match(/^([\d.]+)%$/);

    if (percentMatch) {
        return {
            color: trimmed.slice(0, lastSpaceIndex).trim(),
            offset: parseFloat(percentMatch[1]) / 100,
        };
    }

    // Check if the last token is a number (e.g. for turn/deg values that are part of color)
    // If it doesn't look like an offset, treat the whole thing as a color
    return { color: trimmed };
}

function parseColorStops(args: string[]): GradientColorStop[] {
    return args.map(parseColorStop);
}

function normaliseStopOffsets(stops: GradientColorStop[]): GradientColorStop[] {
    if (stops.length === 0) {
        return stops;
    }

    // First and last default to 0 and 1
    if (stops[0].offset === undefined) {
        stops[0].offset = 0;
    }

    if (stops[stops.length - 1].offset === undefined) {
        stops[stops.length - 1].offset = 1;
    }

    // Fill in undefined offsets by linear interpolation
    let lastDefinedIndex = 0;

    for (let i = 1; i < stops.length; i++) {
        if (stops[i].offset !== undefined) {
            if (i - lastDefinedIndex > 1) {
                const startOffset = stops[lastDefinedIndex].offset!;
                const endOffset = stops[i].offset!;
                const count = i - lastDefinedIndex;

                for (let idx = 1; idx < count; idx++) {
                    stops[lastDefinedIndex + idx].offset = startOffset + (endOffset - startOffset) * (idx / count);
                }
            }

            lastDefinedIndex = i;
        }
    }

    return stops;
}

function parseLinearGradient(args: string[], repeating: boolean): LinearGradient {
    let angle = 180; // default: to bottom
    let stopArgs = args;

    if (args.length > 0) {
        const first = args[0].trim();

        // Check for angle
        const degMatch = first.match(/^([\d.]+)deg$/i);
        const turnMatch = first.match(/^([\d.]+)turn$/i);

        if (degMatch) {
            angle = parseFloat(degMatch[1]);
            stopArgs = args.slice(1);
        } else if (turnMatch) {
            angle = parseFloat(turnMatch[1]) * 360;
            stopArgs = args.slice(1);
        } else if (DIRECTION_MAP[first.toLowerCase()] !== undefined) {
            angle = DIRECTION_MAP[first.toLowerCase()];
            stopArgs = args.slice(1);
        }
    }

    return {
        type: 'linear',
        repeating,
        angle,
        stops: normaliseStopOffsets(parseColorStops(stopArgs)),
    };
}

function parseRadialGradient(args: string[], repeating: boolean): RadialGradient {
    let shape = 'ellipse';
    let position: [number, number] = [50, 50];
    let stopArgs = args;

    if (args.length > 0) {
        const first = args[0].trim().toLowerCase();

        // Check if first arg contains shape/position info
        const hasShape = first.startsWith('circle') || first.startsWith('ellipse');
        const hasAt = first.includes(' at ');

        if (hasShape || hasAt) {
            if (first.startsWith('circle')) {
                shape = 'circle';
            } else if (first.startsWith('ellipse')) {
                shape = 'ellipse';
            }

            if (hasAt) {
                position = parsePosition(first);
            }

            stopArgs = args.slice(1);
        }
    }

    return {
        type: 'radial',
        repeating,
        shape,
        position,
        stops: normaliseStopOffsets(parseColorStops(stopArgs)),
    };
}

function parseConicGradient(args: string[], repeating: boolean): ConicGradient {
    let angle = 0;
    let position: [number, number] = [50, 50];
    let stopArgs = args;

    if (args.length > 0) {
        const first = args[0].trim();
        const fromMatch = first.match(/^from\s+([\d.]+)(deg|turn)/i);
        const hasAt = first.toLowerCase().includes(' at ');

        if (fromMatch || hasAt) {
            if (fromMatch) {
                angle = fromMatch[2].toLowerCase() === 'turn'
                    ? parseFloat(fromMatch[1]) * 360
                    : parseFloat(fromMatch[1]);
            }

            if (hasAt) {
                position = parsePosition(first);
            }

            stopArgs = args.slice(1);
        }
    }

    return {
        type: 'conic',
        repeating,
        angle,
        position,
        stops: normaliseStopOffsets(parseColorStops(stopArgs)),
    };
}

export function parseGradient(value: string): Gradient | undefined {
    const match = GRADIENT_PATTERN.exec(value.trim());

    if (!match) {
        return undefined;
    }

    const repeating = !!match[1];
    const type = match[2].toLowerCase();
    const args = splitGradientArgs(match[3]);

    switch (type) {
        case 'linear': return parseLinearGradient(args, repeating);
        case 'radial': return parseRadialGradient(args, repeating);
        case 'conic': return parseConicGradient(args, repeating);
        default: return undefined;
    }
}

export function isGradientString(value: string): boolean {
    return GRADIENT_PATTERN.test(value.trim());
}
