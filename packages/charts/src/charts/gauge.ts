import type {
    BaseChartOptions,
} from '../core/chart';

import {
    Chart,
} from '../core/chart';

import type {
    ValueFormatInput,
} from '../core/options';

import {
    areaCenter,
} from '../core/layout';

import {
    resolveValueFormat,
} from '../core/options';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    Arc,
    ArcState,
    Context,
    EventMap,
    Group,
    Line,
    LineState,
    Text,
    TextState,
} from '@ripl/core';

import {
    createArc,
    createGroup,
    createLine,
    createText,
    easeOutCubic,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    numberClamp,
    numberRoundTo,
} from '@ripl/utilities';

/** Options for configuring a {@link GaugeChart}. */
export interface GaugeChartOptions extends BaseChartOptions {
    /** The value displayed by the gauge (clamped to `minValue`–`maxValue`). */
    value: number;
    /** Lower bound of the gauge scale. Defaults to 0. */
    minValue?: number;
    /** Upper bound of the gauge scale. Defaults to 100. */
    maxValue?: number;
    /** Optional descriptive text shown below the value. */
    label?: string;
    /** Colour of the value arc. */
    color?: string;
    /** Colour of the background track arc. */
    trackColor?: string;
    /** How the central value display is formatted — a built-in format type, Intl number-format options, or a custom function. */
    format?: ValueFormatInput;
    /** Number of tick marks along the gauge arc. Defaults to 5. Set to 0 to hide. */
    tickCount?: number;
    /** Whether to show value labels at each tick. Defaults to true. */
    showTickLabels?: boolean;
    /** How tick labels are formatted. Defaults to {@link GaugeChartOptions.format}. */
    formatTick?: ValueFormatInput;
}

/** Payload emitted for gauge value interaction events. */
export interface GaugeChartValueEvent {
    /** The x coordinate (in chart pixels) of the value arc's centroid. */
    x: number;
    /** The y coordinate (in chart pixels) of the value arc's centroid. */
    y: number;
    /** The gauge's current (clamped) value. */
    value: number;
}

/** Events emitted by a {@link GaugeChart} that consumers can subscribe to via `chart.on(...)`. */
export interface GaugeChartEventMap extends EventMap {
    /** Emitted when the value arc is clicked. */
    valueclick: GaugeChartValueEvent;
    /** Emitted when the pointer enters the value arc. */
    valueenter: GaugeChartValueEvent;
    /** Emitted when the pointer leaves the value arc. */
    valueleave: GaugeChartValueEvent;
}

const DEFAULT_COLOR = '#7cacf8';
const DEFAULT_TRACK_COLOR = '#e5e7eb';

/**
 * Gauge chart displaying a single value on a 270-degree arc.
 *
 * Renders a background track arc and an animated value arc spanning from
 * the minimum to the current value. Supports configurable tick marks
 * with labels, a central value display, and an optional descriptive label.
 */
export class GaugeChart extends Chart<GaugeChartOptions, GaugeChartEventMap> {

    private _group?: Group;
    private _track?: Arc;
    private _valueArc?: Arc;
    private _valueText?: Text;
    private _labelText?: Text;
    private _tickLines: Line[] = [];
    private _tickLabels: Text[] = [];
    private _tooltip: Tooltip;
    /** The last rendered value, so data updates can animate the value text counting up/down. */
    private _currentValue?: number;
    /** Signature of the tick geometry (centre/radius/count) so ticks only re-animate when they move. */
    private _tickSignature?: string;

    constructor(target: string | HTMLElement | Context, options: GaugeChartOptions) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    public async render() {
        return super.render(async (scene, renderer) => {
            const {
                value,
                minValue = 0,
                maxValue = 100,
                label,
                color = DEFAULT_COLOR,
                trackColor = DEFAULT_TRACK_COLOR,
                format,
            } = this.options;

            const layout = this.createLayout();
            this.reserveTitle(layout);
            const area = layout.area;

            const { cx, cy: baseCy, size } = areaCenter(area);
            const cy = baseCy + 20;
            const radius = size * 0.4;
            const innerRadius = radius * 0.7;

            // Gauge spans from -135deg to +135deg (270 degrees total)
            const startAngle = Math.PI * 0.75;
            const endAngle = Math.PI * 2.25;
            const range = maxValue - minValue;
            const clampedValue = numberClamp(value, minValue, maxValue);
            const valueAngle = startAngle + ((clampedValue - minValue) / range) * (endAngle - startAngle);

            const isEntry = !this._group;

            if (!this._group) {
                this._group = createGroup({
                    id: 'gauge',
                    class: 'gauge-chart',
                });

                scene.add(this._group);
            }

            // --- Track arc (background) --- created once, geometry kept in sync.
            if (!this._track) {
                this._track = createArc({
                    id: 'gauge-track',
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    fill: trackColor,
                    padAngle: 0,
                });

                this._track.autoStroke = false;
                this._group.add(this._track);
            } else {
                this._track.cx = cx;
                this._track.cy = cy;
                this._track.radius = radius;
                this._track.innerRadius = innerRadius;
                this._track.startAngle = startAngle;
                this._track.endAngle = endAngle;
                this._track.fill = trackColor;
            }

            // --- Value arc --- animates its end angle from the current value to the new one.
            if (!this._valueArc) {
                this._valueArc = createArc({
                    id: 'gauge-value',
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle: startAngle,
                    fill: setColorAlpha(color, 0.8),
                    padAngle: 0,
                });

                this._valueArc.autoStroke = false;
                this._group.add(this._valueArc);
            } else {
                this._valueArc.cx = cx;
                this._valueArc.cy = cy;
                this._valueArc.radius = radius;
                this._valueArc.innerRadius = innerRadius;
                this._valueArc.startAngle = startAngle;
                this._valueArc.fill = setColorAlpha(color, 0.8);
            }

            this._valueArc.data = {
                endAngle: valueAngle,
            } as Partial<ArcState>;

            // --- Value text ---
            // Format a (possibly fractional, mid-animation) value, capping precision at 2 decimals.
            const resolveDisplay = resolveValueFormat(format);
            const formatDisplay = (v: number) => resolveDisplay(numberRoundTo(v, 2));
            // The value the text counts up/down *from* on a data update (the previously shown value).
            const displayFrom = this._currentValue ?? clampedValue;
            const displayValue = formatDisplay(clampedValue);

            this._currentValue = clampedValue;

            // Duration the value arc sweeps and the centre number counts over on a data update.
            const valueDuration = this.getAnimationDuration(1200);

            if (!this._valueText) {
                this._valueText = createText({
                    id: 'gauge-value-text',
                    x: cx,
                    y: cy - 10,
                    content: displayValue,
                    fill: '#333',
                    font: `bold ${Math.round(size * 0.08)}px sans-serif`,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    opacity: isEntry ? 0 : 1,
                    data: {
                        opacity: 1,
                    },
                });

                this._group.add(this._valueText);
            } else {
                this._valueText.x = cx;
                this._valueText.y = cy - 10;
                this._valueText.font = `bold ${Math.round(size * 0.08)}px sans-serif`;
                this._valueText.opacity = 1;
                // Seed the starting number so the counting transition below ticks smoothly from the
                // previously shown value; with animation off, show the final value immediately (rather
                // than flashing the end number for a frame before the count begins).
                this._valueText.content = valueDuration > 0 ? formatDisplay(displayFrom) : displayValue;
            }

            // --- Label text --- created/updated/removed depending on the `label` option.
            if (label) {
                if (!this._labelText) {
                    this._labelText = createText({
                        id: 'gauge-label',
                        x: cx,
                        y: cy + 15,
                        content: label,
                        fill: '#6b7280',
                        font: `${Math.round(size * 0.04)}px sans-serif`,
                        textAlign: 'center',
                        textBaseline: 'middle',
                        opacity: isEntry ? 0 : 1,
                        data: {
                            opacity: 1,
                        },
                    });

                    this._group.add(this._labelText);
                } else {
                    this._labelText.content = label;
                    this._labelText.x = cx;
                    this._labelText.y = cy + 15;
                    this._labelText.font = `${Math.round(size * 0.04)}px sans-serif`;
                    this._labelText.opacity = 1;
                }
            } else if (this._labelText) {
                this._labelText.destroy();
                this._labelText = undefined;
            }

            // --- Tick marks and labels --- reconciled via arrayJoin so tick count can change.
            const tickCount = this.options.tickCount ?? 5;
            const showTickLabels = this.options.showTickLabels !== false;
            const formatTick = resolveValueFormat(this.options.formatTick ?? this.options.format);

            // Ticks only move when the centre/radius/count/label-visibility changes — not on a plain
            // value update — so a value change animates only the arc and the centre number.
            const tickSignature = `${cx}|${cy}|${radius}|${tickCount}|${showTickLabels}`;
            const tickGeometryChanged = tickSignature !== this._tickSignature;
            this._tickSignature = tickSignature;

            const tickIndices = tickCount > 0
                ? Array.from({ length: tickCount + 1 }).map((_, i) => i)
                : [];

            const tickOuterRadius = radius + 4;
            const tickInnerRadius = radius - 4;
            const labelRadius = radius + 16;

            const tickGeometry = (i: number) => {
                const t = i / tickCount;
                const tickAngle = startAngle + t * (endAngle - startAngle);
                const tickValue = minValue + t * range;

                return {
                    tickAngle,
                    tickValue,
                    outerX: cx + tickOuterRadius * Math.cos(tickAngle),
                    outerY: cy + tickOuterRadius * Math.sin(tickAngle),
                    innerX: cx + tickInnerRadius * Math.cos(tickAngle),
                    innerY: cy + tickInnerRadius * Math.sin(tickAngle),
                };
            };

            const {
                left: lineEntries,
                inner: lineUpdates,
                right: lineExits,
            } = arrayJoin(tickIndices, this._tickLines, (i, line) => line.id === `gauge-tick-${i}`);

            lineExits.forEach(el => el.destroy());

            const newTickLines = lineEntries.map(i => {
                const { innerX, innerY, outerX, outerY } = tickGeometry(i);

                const line = createLine({
                    id: `gauge-tick-${i}`,
                    x1: innerX,
                    y1: innerY,
                    x2: outerX,
                    y2: outerY,
                    stroke: '#9ca3af',
                    lineWidth: 1.5,
                });

                this._group!.add(line);

                return line;
            });

            lineUpdates.forEach(([i, line]) => {
                const { innerX, innerY, outerX, outerY } = tickGeometry(i);

                line.data = {
                    x1: innerX,
                    y1: innerY,
                    x2: outerX,
                    y2: outerY,
                } as Partial<LineState>;
            });

            this._tickLines = [
                ...newTickLines,
                ...lineUpdates.map(([, line]) => line),
            ];

            // Tick labels: only present when enabled.
            const labelIndices = showTickLabels ? tickIndices : [];

            const tickLabelProps = (i: number) => {
                const { tickAngle, tickValue } = tickGeometry(i);
                const cosAngle = Math.cos(tickAngle);

                let textAlign: CanvasTextAlign = 'center';

                if (cosAngle > 0.1) {
                    textAlign = 'left';
                } else if (cosAngle < -0.1) {
                    textAlign = 'right';
                }

                return {
                    x: cx + labelRadius * Math.cos(tickAngle),
                    y: cy + labelRadius * Math.sin(tickAngle),
                    textAlign,
                    content: formatTick(tickValue),
                };
            };

            const {
                left: tickLabelEntries,
                inner: tickLabelUpdates,
                right: tickLabelExits,
            } = arrayJoin(labelIndices, this._tickLabels, (i, label) => label.id === `gauge-tick-label-${i}`);

            tickLabelExits.forEach(el => el.destroy());

            const newTickLabels = tickLabelEntries.map(i => {
                const { x, y, textAlign, content } = tickLabelProps(i);

                const tickLabel = createText({
                    id: `gauge-tick-label-${i}`,
                    x,
                    y,
                    content,
                    fill: '#9ca3af',
                    font: '10px sans-serif',
                    textAlign,
                    textBaseline: 'middle',
                });

                this._group!.add(tickLabel);

                return tickLabel;
            });

            tickLabelUpdates.forEach(([i, label]) => {
                const { x, y, textAlign, content } = tickLabelProps(i);

                label.content = content;
                label.textAlign = textAlign;
                label.data = {
                    x,
                    y,
                } as Partial<TextState>;
            });

            this._tickLabels = [
                ...newTickLabels,
                ...tickLabelUpdates.map(([, label]) => label),
            ];

            // Hover/click on the value arc: tooltip + valueclick/enter/leave events.
            this._attachValueHover(this._valueArc, clampedValue, color, formatDisplay);

            // Animate: the value arc sweeps to its new angle; text fades in on first render.
            const arcTransition = renderer.transition(this._valueArc, {
                duration: valueDuration,
                ease: easeOutCubic,
                state: this._valueArc.data as Partial<ArcState>,
            });

            const entryTexts = [this._valueText, this._labelText].filter(Boolean) as Text[];

            const textTransition = isEntry
                ? renderer.transition(entryTexts, element => ({
                    duration: this.getAnimationDuration(600),
                    delay: this.getAnimationDuration(400),
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Record<string, unknown>,
                }))
                // On a data update the value counts up/down to the new value (only the bar and the
                // number change — the rest of the gauge stays put).
                : renderer.transition(this._valueText, {
                    duration: valueDuration,
                    ease: easeOutCubic,
                    state: {
                        content: (time: number) => formatDisplay(displayFrom + (clampedValue - displayFrom) * time),
                    },
                });

            const tickTransition = tickGeometryChanged && (lineUpdates.length || tickLabelUpdates.length)
                ? renderer.transition([
                    ...lineUpdates.map(([, line]) => line),
                    ...tickLabelUpdates.map(([, label]) => label),
                ], element => ({
                    duration: this.getAnimationDuration(600),
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Record<string, unknown>,
                }))
                : Promise.resolve();

            return Promise.all([arcTransition, textTransition, tickTransition]);
        });
    }

    private _attachValueHover(arc: Arc, value: number, color: string, formatDisplay: (value: number) => string) {

        const payload = (point: { x: number;
            y: number; }): GaugeChartValueEvent => ({
            x: point.x,
            y: point.y,
            value,
        });

        applyHoverHighlight(arc, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => {
                const [x, y] = arc.getCentroid(arc.data as Partial<ArcState>);
                return {
                    x,
                    y,
                };
            },
            content: () => formatDisplay(value),
            highlight: { fill: color },
            restore: { fill: setColorAlpha(color, 0.8) },
            onEnter: point => this.emit('valueenter', payload(point)),
            onLeave: point => this.emit('valueleave', payload(point)),
            onClick: point => this.emit('valueclick', payload(point)),
        });
    }

}

/**
 * Factory function that creates a new {@link GaugeChart} instance.
 *
 * @example
 * ```ts
 * createGaugeChart(target, {
 *     value: 68,
 *     minValue: 0,
 *     maxValue: 100,
 *     label: 'CPU',
 * });
 * ```
 */
export function createGaugeChart(target: string | HTMLElement | Context, options: GaugeChartOptions) {
    return new GaugeChart(target, options);
}
