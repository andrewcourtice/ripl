import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    formatNumber,
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

import {
    Arc,
    ArcState,
    Context,
    createArc,
    createGroup,
    createLine,
    createText,
    easeOutCubic,
    EventMap,
    Group,
    Line,
    LineState,
    setColorAlpha,
    Text,
    TextState,
} from '@ripl/core';

import {
    arrayJoin,
    roundTo,
} from '@ripl/utilities';

/** Options for configuring a {@link GaugeChart}. */
export interface GaugeChartOptions extends BaseChartOptions {
    value: number;
    min?: number;
    max?: number;
    label?: string;
    color?: string;
    trackColor?: string;
    formatValue?: (value: number) => string;
    /** Number of tick marks along the gauge arc. Defaults to 5. Set to 0 to hide. */
    tickCount?: number;
    /** Whether to show value labels at each tick. Defaults to true. */
    showTickLabels?: boolean;
    /** Format function for tick labels */
    formatTickLabel?: (value: number) => string;
}

/** Payload emitted for gauge value interaction events. */
export interface GaugeChartValueEvent {
    x: number;
    y: number;
    value: number;
}

/** Events emitted by a {@link GaugeChart} that consumers can subscribe to via `chart.on(...)`. */
export interface GaugeChartEventMap extends EventMap {
    valueclick: GaugeChartValueEvent;
    valueenter: GaugeChartValueEvent;
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

    private group?: Group;
    private track?: Arc;
    private valueArc?: Arc;
    private valueText?: Text;
    private labelText?: Text;
    private tickLines: Line[] = [];
    private tickLabels: Text[] = [];
    private tooltip: Tooltip;
    /** The last rendered value, so data updates can animate the value text counting up/down. */
    private currentValue?: number;

    constructor(target: string | HTMLElement | Context, options: GaugeChartOptions) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    public async render() {
        return super.render(async (scene, renderer) => {
            const {
                value,
                min = 0,
                max = 100,
                label,
                color = DEFAULT_COLOR,
                trackColor = DEFAULT_TRACK_COLOR,
                formatValue,
            } = this.options;

            const layout = this.createLayout();
            this.reserveTitle(layout);
            const area = layout.area;

            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2 + 20;
            const size = Math.min(area.width, area.height);
            const radius = size * 0.4;
            const innerRadius = radius * 0.7;

            // Gauge spans from -135deg to +135deg (270 degrees total)
            const startAngle = Math.PI * 0.75;
            const endAngle = Math.PI * 2.25;
            const range = max - min;
            const clampedValue = Math.max(min, Math.min(max, value));
            const valueAngle = startAngle + ((clampedValue - min) / range) * (endAngle - startAngle);

            const isEntry = !this.group;

            if (!this.group) {
                this.group = createGroup({
                    id: 'gauge',
                    class: 'gauge-chart',
                });

                scene.add(this.group);
            }

            // --- Track arc (background) --- created once, geometry kept in sync.
            if (!this.track) {
                this.track = createArc({
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

                this.track.autoStroke = false;
                this.group.add(this.track);
            } else {
                this.track.cx = cx;
                this.track.cy = cy;
                this.track.radius = radius;
                this.track.innerRadius = innerRadius;
                this.track.startAngle = startAngle;
                this.track.endAngle = endAngle;
                this.track.fill = trackColor;
            }

            // --- Value arc --- animates its end angle from the current value to the new one.
            if (!this.valueArc) {
                this.valueArc = createArc({
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

                this.valueArc.autoStroke = false;
                this.group.add(this.valueArc);
            } else {
                this.valueArc.cx = cx;
                this.valueArc.cy = cy;
                this.valueArc.radius = radius;
                this.valueArc.innerRadius = innerRadius;
                this.valueArc.startAngle = startAngle;
                this.valueArc.fill = setColorAlpha(color, 0.8);
            }

            this.valueArc.data = {
                endAngle: valueAngle,
            } as Partial<ArcState>;

            // --- Value text ---
            // Format a (possibly fractional, mid-animation) value, capping precision at 2 decimals.
            const formatDisplay = (v: number) => (formatValue ? formatValue(roundTo(v, 2)) : formatNumber(v));
            // The value the text counts up/down *from* on a data update (the previously shown value).
            const displayFrom = this.currentValue ?? clampedValue;
            const displayValue = formatDisplay(clampedValue);

            this.currentValue = clampedValue;

            if (!this.valueText) {
                this.valueText = createText({
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

                this.group.add(this.valueText);
            } else {
                this.valueText.content = displayValue;
                this.valueText.x = cx;
                this.valueText.y = cy - 10;
                this.valueText.font = `bold ${Math.round(size * 0.08)}px sans-serif`;
                this.valueText.opacity = 1;
            }

            // --- Label text --- created/updated/removed depending on the `label` option.
            if (label) {
                if (!this.labelText) {
                    this.labelText = createText({
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

                    this.group.add(this.labelText);
                } else {
                    this.labelText.content = label;
                    this.labelText.x = cx;
                    this.labelText.y = cy + 15;
                    this.labelText.font = `${Math.round(size * 0.04)}px sans-serif`;
                    this.labelText.opacity = 1;
                }
            } else if (this.labelText) {
                this.labelText.destroy();
                this.labelText = undefined;
            }

            // --- Tick marks and labels --- reconciled via arrayJoin so tick count can change.
            const tickCount = this.options.tickCount ?? 5;
            const showTickLabels = this.options.showTickLabels !== false;
            const formatTickLabel = this.options.formatTickLabel;

            const tickIndices = tickCount > 0
                ? Array.from({ length: tickCount + 1 }).map((_, i) => i)
                : [];

            const tickOuterRadius = radius + 4;
            const tickInnerRadius = radius - 4;
            const labelRadius = radius + 16;

            const tickGeometry = (i: number) => {
                const t = i / tickCount;
                const tickAngle = startAngle + t * (endAngle - startAngle);
                const tickValue = min + t * range;

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
            } = arrayJoin(tickIndices, this.tickLines, (i, line) => line.id === `gauge-tick-${i}`);

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

                this.group!.add(line);

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

            this.tickLines = [
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
                    content: formatTickLabel ? formatTickLabel(tickValue) : formatNumber(tickValue),
                };
            };

            const {
                left: tickLabelEntries,
                inner: tickLabelUpdates,
                right: tickLabelExits,
            } = arrayJoin(labelIndices, this.tickLabels, (i, label) => label.id === `gauge-tick-label-${i}`);

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

                this.group!.add(tickLabel);

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

            this.tickLabels = [
                ...newTickLabels,
                ...tickLabelUpdates.map(([, label]) => label),
            ];

            // Hover/click on the value arc: tooltip + valueclick/enter/leave events.
            this.attachValueHover(this.valueArc, clampedValue, color, formatDisplay);

            // Animate: the value arc sweeps to its new angle; text fades in on first render.
            const arcTransition = renderer.transition(this.valueArc, {
                duration: this.getAnimationDuration(1200),
                ease: easeOutCubic,
                state: this.valueArc.data as Partial<ArcState>,
            });

            const entryTexts = [this.valueText, this.labelText].filter(Boolean) as Text[];

            const textTransition = isEntry
                ? renderer.transition(entryTexts, element => ({
                    duration: this.getAnimationDuration(600),
                    delay: this.getAnimationDuration(400),
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Record<string, unknown>,
                }))
                // On a data update the value counts up/down to the new value (only the bar and the
                // number change — the rest of the gauge stays put).
                : renderer.transition(this.valueText, {
                    duration: this.getAnimationDuration(1200),
                    ease: easeOutCubic,
                    state: {
                        content: (time: number) => formatDisplay(displayFrom + (clampedValue - displayFrom) * time),
                    },
                });

            const tickTransition = lineUpdates.length || tickLabelUpdates.length
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

    private attachValueHover(arc: Arc, value: number, color: string, formatDisplay: (value: number) => string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        const payload = (point: { x: number;
            y: number; }): GaugeChartValueEvent => ({
            x: point.x,
            y: point.y,
            value,
        });

        applyHoverHighlight(arc, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
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

/** Factory function that creates a new {@link GaugeChart} instance. */
export function createGaugeChart(target: string | HTMLElement | Context, options: GaugeChartOptions) {
    return new GaugeChart(target, options);
}
