import type {
    ChartComponentOptions,
} from './_base';

import {
    ChartComponent,
} from './_base';

import type {
    ChartArea,
} from '../core/layout';

import type {
    ColorScale,
    Group,
} from '@ripl/core';

import {
    createGroup,
    createRect,
    createText,
} from '@ripl/core';

import {
    numberFormat,
} from '@ripl/utilities';

/** Orientation of the color legend bar. */
export type ColorLegendOrientation = 'horizontal' | 'vertical';

/** Visual options for a {@link ColorLegend}. */
export interface ColorLegendOptions {
    /** Whether the color bar runs horizontally or vertically. Defaults to `horizontal`. */
    orientation?: ColorLegendOrientation;
    /** Thickness of the color bar in pixels (height when horizontal, width when vertical). */
    thickness?: number;
    /** Number of solid segments used to approximate the gradient. */
    segments?: number;
    /** Number of value labels to render. */
    tickCount?: number;
    /** Formats a domain value into a label (defaults to {@link numberFormat} at 2 dp). */
    format?: (value: number) => string;
    /** CSS font shorthand for the value labels. */
    font?: string;
    /** Color of the value labels. */
    fontColor?: string;
    /** Gap between the bar and its labels in pixels. */
    labelGap?: number;
    /** Padding inset (px) between the reserved band's leading edge and the bar, so the legend
     * doesn't sit flush against the adjacent axis. Defaults to `8`. */
    padding?: number;
}

/** Options for constructing a {@link ColorLegend}. */
export interface ColorLegendComponentOptions extends ChartComponentOptions {
    /** The color scale the legend visualizes. */
    scale: ColorScale;
    /** Visual options for the legend bar and labels. */
    options?: ColorLegendOptions;
}

const DEFAULT_OPTIONS: Required<ColorLegendOptions> = {
    orientation: 'horizontal',
    thickness: 12,
    segments: 32,
    tickCount: 5,
    format: value => numberFormat(value, {
        precision: 2,
    }),
    font: '12px sans-serif',
    fontColor: '#333333',
    labelGap: 4,
    padding: 8,
};

const LABEL_ALLOWANCE = 16;

/**
 * A continuous-color legend: a gradient bar (approximated by solid segments so it works identically
 * on Canvas and SVG) annotated with formatted value labels drawn from a {@link ColorScale}. Renders
 * into a reserved region like the other chart components; formatting is supplied explicitly, keeping
 * the scale and the formatter decoupled.
 */
export class ColorLegend extends ChartComponent {

    private _scale: ColorScale;
    private _options: Required<ColorLegendOptions>;
    private _group?: Group;

    constructor({
        scene,
        renderer,
        scale,
        options,
    }: ColorLegendComponentOptions) {
        super({
            scene,
            renderer,
        });

        this._scale = scale;
        this._options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }

    private get _domain(): [number, number] {
        const domain = this._scale.domain;

        return [
            domain[0],
            domain[domain.length - 1],
        ];
    }

    private _ensureGroup(): Group {
        if (!this._group) {
            this._group = createGroup({
                id: 'chart-color-legend',
                class: 'chart-color-legend',
                zIndex: 400,
            });

            this.scene.add(this._group);
        }

        return this._group;
    }

    /** Updates the color scale the legend renders. */
    public setScale(scale: ColorScale): void {
        this._scale = scale;
    }

    /** Updates the legend's visual options. */
    public setOptions(options: ColorLegendOptions): void {
        this._options = {
            ...this._options,
            ...options,
        };
    }

    /** The thickness of the band this legend needs (padding inset plus bar plus labels). */
    public measure(): number {
        return this._options.padding + this._options.thickness + this._options.labelGap + LABEL_ALLOWANCE;
    }

    /** Draws (or redraws) the legend within the reserved region. */
    public render(region: ChartArea): void {
        const group = this._ensureGroup();
        group.clear();

        const {
            orientation,
            thickness,
            segments,
            tickCount,
            format,
            font,
            fontColor,
            labelGap,
            padding,
        } = this._options;

        const [
            min,
            max,
        ] = this._domain;

        const span = max - min || 1;
        const vertical = orientation === 'vertical';
        // Inset the content by `padding` from the band's leading edge so the bar doesn't sit flush
        // against the adjacent axis (the standard Legend does the same via itemPadding).
        const top = region.y + padding;
        const length = vertical ? region.height - padding : region.width;

        for (let index = 0; index < segments; index++) {
            const position = segments === 1 ? 0 : index / (segments - 1);
            const offset = index / segments * length;
            const size = length / segments + 0.5;
            const color = this._scale(min + position * span);

            group.add(createRect({
                fill: color,
                x: vertical ? region.x : region.x + offset,
                y: vertical ? top + (length - offset - size) : top,
                width: vertical ? thickness : size,
                height: vertical ? size : thickness,
            }));
        }

        this._scale.ticks(tickCount).forEach(value => {
            const fraction = (value - min) / span;

            group.add(createText({
                content: format(value),
                fill: fontColor,
                font,
                x: vertical
                    ? region.x + thickness + labelGap
                    : region.x + fraction * length,
                y: vertical
                    ? top + (1 - fraction) * length
                    : top + thickness + labelGap,
                textAlign: vertical ? 'left' : 'center',
                textBaseline: vertical ? 'middle' : 'top',
            }));
        });
    }

    /** Removes the legend's elements from the scene. */
    public destroy(): void {
        this._group?.destroy();
        this._group = undefined;
        super.destroy();
    }

}

/** Factory function that creates a new {@link ColorLegend}. */
export function createColorLegend(options: ColorLegendComponentOptions): ColorLegend {
    return new ColorLegend(options);
}
