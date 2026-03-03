import type {
    Ease,
} from '@ripl/core';

import {
    easeInCubic,
    easeInOutCubic,
    easeInOutQuad,
    easeInOutQuart,
    easeInOutQuint,
    easeInQuad,
    easeInQuart,
    easeInQuint,
    easeLinear,
    easeOutCubic,
    easeOutQuad,
    easeOutQuart,
    easeOutQuint,
} from '@ripl/core';

import {
    typeIsBoolean,
    typeIsString,
} from '@ripl/utilities';

// ---------------------------------------------------------------------------
// Ease
// ---------------------------------------------------------------------------

export type EaseName =
    | 'easeLinear'
    | 'easeInQuad'
    | 'easeOutQuad'
    | 'easeInOutQuad'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic'
    | 'easeInQuart'
    | 'easeOutQuart'
    | 'easeInOutQuart'
    | 'easeInQuint'
    | 'easeOutQuint'
    | 'easeInOutQuint';

const EASE_MAP: Record<EaseName, Ease> = {
    easeLinear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuart,
    easeOutQuart,
    easeInOutQuart,
    easeInQuint,
    easeOutQuint,
    easeInOutQuint,
};

export function resolveEase(value?: EaseName | Ease): Ease {
    if (!value) {
        return easeOutCubic;
    }

    if (typeIsString(value)) {
        return EASE_MAP[value as EaseName] ?? easeOutCubic;
    }

    return value;
}

// ---------------------------------------------------------------------------
// Padding helper
// ---------------------------------------------------------------------------

export type PaddingInput = number | [number, number, number, number];

export interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export function normalizePadding(value?: PaddingInput): Padding | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === 'number') {
        return {
            top: value,
            right: value,
            bottom: value,
            left: value,
        };
    }

    return {
        top: value[0],
        right: value[1],
        bottom: value[2],
        left: value[3],
    };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

export type TitlePosition = 'top' | 'bottom' | 'left' | 'right';

export interface ChartTitleOptions {
    visible: boolean;
    text: string;
    padding: PaddingInput;
    font: string;
    fontColor: string;
    position: TitlePosition;
}

export type ChartTitleInput = string | Partial<ChartTitleOptions>;

const TITLE_DEFAULTS: ChartTitleOptions = {
    visible: true,
    text: '',
    padding: 10,
    font: '16px sans-serif',
    fontColor: '#333333',
    position: 'top',
};

export function normalizeTitle(input?: ChartTitleInput): ChartTitleOptions | undefined {
    if (input === undefined) {
        return undefined;
    }

    if (typeIsString(input)) {
        return {
            ...TITLE_DEFAULTS,
            text: input,
        };
    }

    return {
        ...TITLE_DEFAULTS,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export interface ChartAnimationOptions {
    enabled: boolean;
    duration: number;
    ease: EaseName | Ease;
}

export type ChartAnimationInput = boolean | Partial<ChartAnimationOptions>;

const ANIMATION_DEFAULTS: ChartAnimationOptions = {
    enabled: true,
    duration: 1000,
    ease: 'easeOutCubic',
};

export function normalizeAnimation(input?: ChartAnimationInput, defaults?: Partial<ChartAnimationOptions>): ChartAnimationOptions {
    const base = { ...ANIMATION_DEFAULTS, ...defaults };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            enabled: input,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export interface ChartGridOptions {
    visible: boolean;
    lineColor: string;
    lineWidth: number;
    lineDash: number[];
}

export type ChartGridInput = boolean | Partial<ChartGridOptions>;

const GRID_DEFAULTS: ChartGridOptions = {
    visible: true,
    lineColor: '#e5e7eb',
    lineWidth: 1,
    lineDash: [4, 4],
};

export function normalizeGrid(input?: ChartGridInput, defaults?: Partial<ChartGridOptions>): ChartGridOptions {
    const base = { ...GRID_DEFAULTS, ...defaults };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Crosshair
// ---------------------------------------------------------------------------

export type CrosshairAxis = 'x' | 'y' | 'both';

export interface ChartCrosshairOptions {
    visible: boolean;
    axis: CrosshairAxis;
    lineColor: string;
    lineWidth: number;
}

export type ChartCrosshairInput = boolean | Partial<ChartCrosshairOptions>;

const CROSSHAIR_DEFAULTS: ChartCrosshairOptions = {
    visible: true,
    axis: 'x',
    lineColor: '#94a3b8',
    lineWidth: 1,
};

export function normalizeCrosshair(input?: ChartCrosshairInput, defaults?: Partial<ChartCrosshairOptions>): ChartCrosshairOptions {
    const base = { ...CROSSHAIR_DEFAULTS, ...defaults };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

export type BorderRadiusInput = number | [number, number, number, number];

export interface ChartTooltipOptions {
    visible: boolean;
    padding: PaddingInput;
    font: string;
    fontColor: string;
    backgroundColor: string;
    borderRadius: BorderRadiusInput;
    maxWidth: number;
    wrap: boolean;
}

export type ChartTooltipInput = boolean | Partial<ChartTooltipOptions>;

const TOOLTIP_DEFAULTS: ChartTooltipOptions = {
    visible: true,
    padding: 8,
    font: '12px sans-serif',
    fontColor: '#FFFFFF',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    maxWidth: 200,
    wrap: false,
};

export function normalizeTooltip(input?: ChartTooltipInput, defaults?: Partial<ChartTooltipOptions>): ChartTooltipOptions {
    const base = { ...TOOLTIP_DEFAULTS, ...defaults };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';

export interface ChartLegendOptions {
    visible: boolean;
    position: LegendPosition;
    padding: PaddingInput;
    font: string;
    fontColor: string;
    highlight: boolean;
}

export type ChartLegendInput = boolean | LegendPosition | Partial<ChartLegendOptions>;

const LEGEND_DEFAULTS: ChartLegendOptions = {
    visible: true,
    position: 'top',
    padding: 16,
    font: '11px sans-serif',
    fontColor: '#333333',
    highlight: true,
};

export function normalizeLegend(input?: ChartLegendInput, defaults?: Partial<ChartLegendOptions>): ChartLegendOptions {
    const base = { ...LEGEND_DEFAULTS, ...defaults };

    if (input === undefined) {
        return {
            ...base,
            visible: false,
        };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    if (typeIsString(input)) {
        return {
            ...base,
            position: input as LegendPosition,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Axis
// ---------------------------------------------------------------------------

export type AxisFormatType = 'number' | 'percentage' | 'date' | 'string';

export interface ChartAxisItemOptions<TData = unknown> {
    visible: boolean;
    font: string;
    fontColor: string;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: keyof TData | ((item: TData) => any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format?: AxisFormatType | ((value: any) => string);
}

export interface ChartYAxisItemOptions<TData = unknown> extends ChartAxisItemOptions<TData> {
    position: 'left' | 'right';
}

export interface ChartAxisOptions<TData = unknown> {
    x?: boolean | Partial<ChartAxisItemOptions<TData>>;
    y?: boolean | Partial<ChartYAxisItemOptions<TData>> | Partial<ChartYAxisItemOptions<TData>>[];
}

export type ChartAxisInput<TData = unknown> = boolean | ChartAxisOptions<TData>;

const AXIS_ITEM_DEFAULTS: ChartAxisItemOptions = {
    visible: true,
    font: '12px sans-serif',
    fontColor: '#777777',
};

const Y_AXIS_ITEM_DEFAULTS: ChartYAxisItemOptions = {
    ...AXIS_ITEM_DEFAULTS,
    position: 'left',
};

export function normalizeAxisItem<TData = unknown>(
    input?: boolean | Partial<ChartAxisItemOptions<TData>>,
    defaults?: Partial<ChartAxisItemOptions<TData>>
): ChartAxisItemOptions<TData> {
    const base = { ...AXIS_ITEM_DEFAULTS, ...defaults };

    if (input === undefined) {
        return { ...base } as ChartAxisItemOptions<TData>;
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        } as ChartAxisItemOptions<TData>;
    }

    return {
        ...base,
        ...input,
    } as ChartAxisItemOptions<TData>;
}

export function normalizeYAxisItem<TData = unknown>(
    input?: boolean | Partial<ChartYAxisItemOptions<TData>>,
    defaults?: Partial<ChartYAxisItemOptions<TData>>
): ChartYAxisItemOptions<TData> {
    const base = { ...Y_AXIS_ITEM_DEFAULTS, ...defaults };

    if (input === undefined) {
        return { ...base } as ChartYAxisItemOptions<TData>;
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        } as ChartYAxisItemOptions<TData>;
    }

    return {
        ...base,
        ...input,
    } as ChartYAxisItemOptions<TData>;
}

export function normalizeAxis<TData = unknown>(input?: ChartAxisInput<TData>): ChartAxisOptions<TData> {
    if (input === undefined) {
        return {
            x: { ...AXIS_ITEM_DEFAULTS } as ChartAxisItemOptions<TData>,
            y: { ...Y_AXIS_ITEM_DEFAULTS } as ChartYAxisItemOptions<TData>,
        };
    }

    if (typeIsBoolean(input)) {
        return {
            x: {
                ...AXIS_ITEM_DEFAULTS,
                visible: input,
            } as ChartAxisItemOptions<TData>,
            y: {
                ...Y_AXIS_ITEM_DEFAULTS,
                visible: input,
            } as ChartYAxisItemOptions<TData>,
        };
    }

    return input;
}

// ---------------------------------------------------------------------------
// Format helper
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveFormatLabel(format?: AxisFormatType | ((value: any) => string)): ((value: any) => string) | undefined {
    if (!format) {
        return undefined;
    }

    if (typeof format === 'function') {
        return format;
    }

    switch (format) {
        case 'number':
            return (v: number) => v.toLocaleString();
        case 'percentage':
            return (v: number) => `${(v * 100).toFixed(1)}%`;
        case 'date':
            return (v: Date | number) => new Date(v).toLocaleDateString();
        case 'string':
            return (v: unknown) => String(v);
        default:
            return undefined;
    }
}
