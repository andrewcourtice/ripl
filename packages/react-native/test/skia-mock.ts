import {
    vi,
} from 'vitest';

/* A lightweight, spyable stand-in for `@shopify/react-native-skia` so the backend can be unit-tested
 * under Vitest (jsdom/node) without the native module. Every factory returns fresh spy-backed
 * objects so tests can assert the exact Skia calls each Ripl primitive makes. */

/** Builds a fake `SkPath` whose methods are spies. */
export function makeFakePath() {
    const path = {
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        cubicTo: vi.fn(),
        quadTo: vi.fn(),
        addCircle: vi.fn(),
        addRect: vi.fn(),
        addOval: vi.fn(),
        addRRect: vi.fn(),
        arcToOval: vi.fn(),
        arcToTangent: vi.fn(),
        addPath: vi.fn(),
        close: vi.fn(),
        setFillType: vi.fn(),
        contains: vi.fn(() => true),
        isEmpty: vi.fn(() => true),
        transform: vi.fn(),
        copy: vi.fn(() => makeFakePath()),
        stroke: vi.fn(() => null),
    };

    return path;
}

/** Builds a fake `SkPaint` whose setters are spies. */
export function makeFakePaint() {
    return {
        setAntiAlias: vi.fn(),
        setColor: vi.fn(),
        setAlphaf: vi.fn(),
        getColor: vi.fn(() => new Float32Array([0, 0, 0, 1])),
        setStyle: vi.fn(),
        setStrokeWidth: vi.fn(),
        setStrokeCap: vi.fn(),
        setStrokeJoin: vi.fn(),
        setStrokeMiter: vi.fn(),
        setPathEffect: vi.fn(),
        setImageFilter: vi.fn(),
        setShader: vi.fn(),
    };
}

/** Builds a fake `SkCanvas` whose draw/transform methods are spies. */
export function makeFakeCanvas() {
    return {
        save: vi.fn(),
        restore: vi.fn(),
        clear: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        concat: vi.fn(),
        clipPath: vi.fn(),
        drawPath: vi.fn(),
        drawText: vi.fn(),
        drawRect: vi.fn(),
        drawCircle: vi.fn(),
        drawLine: vi.fn(),
        drawImageRect: vi.fn(),
        drawPicture: vi.fn(),
    };
}

/** Builds a fake `SkFont` returning deterministic glyph widths and metrics. */
export function makeFakeFont() {
    return {
        getGlyphIDs: vi.fn((text: string) => Array.from(text, (_char, index) => index + 1)),
        getGlyphWidths: vi.fn((ids: number[]) => ids.map(() => 7)),
        getMetrics: vi.fn(() => ({
            ascent: -8,
            descent: 2,
            leading: 0,
        })),
        getSize: vi.fn(() => 12),
    };
}

function makeFakeImage() {
    return {
        width: vi.fn(() => 1),
        height: vi.fn(() => 1),
        makeShaderOptions: vi.fn(() => ({
            __shader: 'image',
        })),
        encodeToBase64: vi.fn(() => 'AAAA'),
        readPixels: vi.fn(() => new Uint8Array([0, 0, 0, 255])),
    };
}

function makeFakeSurface() {
    return {
        getCanvas: vi.fn(() => makeFakeCanvas()),
        makeImageSnapshot: vi.fn(() => makeFakeImage()),
    };
}

export const Skia = {
    Path: {
        Make: vi.fn(() => makeFakePath()),
    },
    Paint: vi.fn(() => makeFakePaint()),
    Color: vi.fn(() => new Float32Array([0, 0, 0, 1])),
    PictureRecorder: vi.fn(() => {
        const canvas = makeFakeCanvas();

        return {
            beginRecording: vi.fn(() => canvas),
            finishRecordingAsPicture: vi.fn(() => ({
                __picture: true,
            })),
        };
    }),
    XYWHRect: vi.fn((x: number, y: number, width: number, height: number) => ({
        x,
        y,
        width,
        height,
    })),
    RRectXY: vi.fn((rect: unknown, rx: number, ry: number) => ({
        rect,
        rx,
        ry,
    })),
    Point: vi.fn((x: number, y: number) => ({
        x,
        y,
    })),
    Matrix: vi.fn(() => ({})),
    Shader: {
        MakeLinearGradient: vi.fn(() => ({
            __shader: 'linear',
        })),
        MakeRadialGradient: vi.fn(() => ({
            __shader: 'radial',
        })),
        MakeSweepGradient: vi.fn(() => ({
            __shader: 'sweep',
        })),
    },
    Surface: {
        MakeOffscreen: vi.fn(() => makeFakeSurface()),
    },
    FontMgr: {
        System: vi.fn(() => ({
            matchFamilyStyle: vi.fn(() => ({
                __typeface: true,
            })),
        })),
    },
    Font: vi.fn(() => makeFakeFont()),
    PathEffect: {
        MakeDash: vi.fn(() => ({
            __dash: true,
        })),
    },
    ImageFilter: {
        MakeDropShadow: vi.fn(() => ({
            __shadow: true,
        })),
    },
};

export const PaintStyle = {
    Fill: 0,
    Stroke: 1,
};

export const StrokeCap = {
    Butt: 0,
    Round: 1,
    Square: 2,
};

export const StrokeJoin = {
    Miter: 0,
    Round: 1,
    Bevel: 2,
};

export const TileMode = {
    Clamp: 0,
    Repeat: 1,
    Mirror: 2,
    Decal: 3,
};

export const ClipOp = {
    Difference: 0,
    Intersect: 1,
};

export const FillType = {
    Winding: 0,
    EvenOdd: 1,
    InverseWinding: 2,
    InverseEvenOdd: 3,
};

export const FilterMode = {
    Nearest: 0,
    Linear: 1,
};

export const MipmapMode = {
    None: 0,
    Nearest: 1,
    Linear: 2,
};

export const FontSlant = {
    Upright: 0,
    Italic: 1,
    Oblique: 2,
};

export const FontWeight = {
    Invisible: 0,
    Thin: 100,
    ExtraLight: 200,
    Light: 300,
    Normal: 400,
    Medium: 500,
    SemiBold: 600,
    Bold: 700,
    ExtraBold: 800,
    Black: 900,
    ExtraBlack: 1000,
};
