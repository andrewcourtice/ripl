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
    formatNumber,
} from '@ripl/utilities';

/** Orientation of the colour legend bar. */
export type ColorLegendOrientation = 'horizontal' | 'vertical';

/** Visual options for a {@link ColorLegend}. */
export interface ColorLegendOptions {
    /** Whether the colour bar runs horizontally or vertically. Defaults to `horizontal`. */
    orientation?: ColorLegendOrientation;
    /** Thickness of the colour bar in pixels (height when horizontal, width when vertical). */
    thickness?: number;
    /** Number of solid segments used to approximate the gradient. */
    segments?: number;
    /** Number of value labels to render. */
    tickCount?: number;
    /** Formats a domain value into a label (defaults to {@link formatNumber} at 2 dp). */
    format?: (value: number) => string;
    /** CSS font shorthand for the value labels. */
    font?: string;
    /** Colour of the value labels. */
    fontColor?: string;
    /** Gap between the bar and its labels in pixels. */
    labelGap?: number;
}

/** Options for constructing a {@link ColorLegend}. */
export interface ColorLegendComponentOptions extends ChartComponentOptions {
    /** The colour scale the legend visualizes. */
    scale: ColorScale;
    /** Visual options for the legend bar and labels. */
    options?: ColorLegendOptions;
}

const DEFAULT_OPTIONS: Required<ColorLegendOptions> = {
    orientation: 'horizontal',
    thickness: 12,
    segments: 32,
    tickCount: 5,
    format: value => formatNumber(value, {
        precision: 2,
    }),
    font: '12px sans-serif',
    fontColor: '#333333',
    labelGap: 4,
};

const LABEL_ALLOWANCE = 16;

/**
 * A continuous-colour legend: a gradient bar (approximated by solid segments so it works identically
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

    /** Updates the colour scale the legend renders. */
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

    /** The thickness of the band this legend needs (bar plus labels). */
    public measure(): number {
        return this._options.thickness + this._options.labelGap + LABEL_ALLOWANCE;
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
        } = this._options;

        const [
            min,
            max,
        ] = this._domain;

        const span = max - min || 1;
        const vertical = orientation === 'vertical';
        const length = vertical ? region.height : region.width;

        for (let index = 0; index < segments; index++) {
            const position = segments === 1 ? 0 : index / (segments - 1);
            const offset = index / segments * length;
            const size = length / segments + 0.5;
            const color = this._scale(min + position * span);

            group.add(createRect({
                fill: color,
                x: vertical ? region.x : region.x + offset,
                y: vertical ? region.y + (length - offset - size) : region.y,
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
                    ? region.y + (1 - fraction) * length
                    : region.y + thickness + labelGap,
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
