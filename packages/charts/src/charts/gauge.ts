import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    ArcState,
    Context,
    createArc,
    createGroup,
    createLine,
    createText,
    easeOutCubic,
    Group,
    setColorAlpha,
} from '@ripl/core';

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

const DEFAULT_COLOR = '#7cacf8';
const DEFAULT_TRACK_COLOR = '#e5e7eb';

export class GaugeChart extends Chart<GaugeChartOptions> {

    private group?: Group;

    constructor(target: string | HTMLElement | Context, options: GaugeChartOptions) {
        super(target, options);
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

            const padding = this.getPadding();
            const cx = scene.width / 2;
            const cy = scene.height / 2 + 20;
            const size = Math.min(
                scene.width - padding.left - padding.right,
                scene.height - padding.top - padding.bottom
            );
            const radius = size * 0.4;
            const innerRadius = radius * 0.7;

            // Gauge spans from -135deg to +135deg (270 degrees total)
            const startAngle = Math.PI * 0.75;
            const endAngle = Math.PI * 2.25;
            const range = max - min;
            const clampedValue = Math.max(min, Math.min(max, value));
            const valueAngle = startAngle + ((clampedValue - min) / range) * (endAngle - startAngle);

            if (this.group) {
                this.group.clear();
                scene.remove(this.group);
            }

            this.group = createGroup({
                id: 'gauge',
                class: 'gauge-chart',
            });

            // Track arc (background)
            const track = createArc({
                id: 'gauge-track',
                cx,
                cy,
                radius,
                innerRadius,
                startAngle,
                endAngle,
                fillStyle: trackColor,
                padAngle: 0,
            });

            track.autoStroke = false;

            // Value arc
            const valueArc = createArc({
                id: 'gauge-value',
                cx,
                cy,
                radius,
                innerRadius,
                startAngle,
                endAngle: startAngle,
                fillStyle: setColorAlpha(color, 0.8),
                padAngle: 0,
                data: {
                    endAngle: valueAngle,
                } as Partial<ArcState>,
            });

            valueArc.autoStroke = false;

            // Value text
            const displayValue = formatValue ? formatValue(clampedValue) : clampedValue.toString();

            const valueText = createText({
                id: 'gauge-value-text',
                x: cx,
                y: cy - 10,
                content: displayValue,
                fillStyle: '#333',
                font: `bold ${Math.round(size * 0.08)}px sans-serif`,
                textAlign: 'center',
                textBaseline: 'middle',
                globalAlpha: 0,
                data: {
                    globalAlpha: 1,
                },
            });

            this.group.add([track, valueArc, valueText]);

            // Label text
            if (label) {
                const labelText = createText({
                    id: 'gauge-label',
                    x: cx,
                    y: cy + 15,
                    content: label,
                    fillStyle: '#6b7280',
                    font: `${Math.round(size * 0.04)}px sans-serif`,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    globalAlpha: 0,
                    data: {
                        globalAlpha: 1,
                    },
                });

                this.group.add(labelText);
            }

            // Tick marks and labels
            const tickCount = this.options.tickCount ?? 5;
            const showTickLabels = this.options.showTickLabels !== false;
            const formatTickLabel = this.options.formatTickLabel;

            if (tickCount > 0) {
                const tickOuterRadius = radius + 4;
                const tickInnerRadius = radius - 4;
                const labelRadius = radius + 16;

                for (let i = 0; i <= tickCount; i++) {
                    const t = i / tickCount;
                    const tickAngle = startAngle + t * (endAngle - startAngle);
                    const tickValue = min + t * range;

                    const outerX = cx + tickOuterRadius * Math.cos(tickAngle);
                    const outerY = cy + tickOuterRadius * Math.sin(tickAngle);
                    const innerX = cx + tickInnerRadius * Math.cos(tickAngle);
                    const innerY = cy + tickInnerRadius * Math.sin(tickAngle);

                    this.group.add(createLine({
                        id: `gauge-tick-${i}`,
                        x1: innerX,
                        y1: innerY,
                        x2: outerX,
                        y2: outerY,
                        strokeStyle: '#9ca3af',
                        lineWidth: 1.5,
                    }));

                    if (showTickLabels) {
                        const labelX = cx + labelRadius * Math.cos(tickAngle);
                        const labelY = cy + labelRadius * Math.sin(tickAngle);
                        const cosAngle = Math.cos(tickAngle);

                        let textAlign: CanvasTextAlign = 'center';

                        if (cosAngle > 0.1) {
                            textAlign = 'left';
                        } else if (cosAngle < -0.1) {
                            textAlign = 'right';
                        }

                        const tickLabel = formatTickLabel
                            ? formatTickLabel(tickValue)
                            : Math.round(tickValue).toString();

                        this.group.add(createText({
                            id: `gauge-tick-label-${i}`,
                            x: labelX,
                            y: labelY,
                            content: tickLabel,
                            fillStyle: '#9ca3af',
                            font: '10px sans-serif',
                            textAlign,
                            textBaseline: 'middle',
                        }));
                    }
                }
            }
            scene.add(this.group);

            // Animate
            const arcTransition = renderer.transition(valueArc, {
                duration: this.getAnimationDuration(1200),
                ease: easeOutCubic,
                state: valueArc.data as Partial<ArcState>,
            });

            const textElements = this.group.getElementsByType('text');

            const textTransition = renderer.transition(textElements, (element) => ({
                duration: this.getAnimationDuration(600),
                delay: this.getAnimationDuration(400),
                ease: easeOutCubic,
                state: (element.data ?? {}) as Record<string, unknown>,
            }));

            return Promise.all([arcTransition, textTransition]);
        });
    }

}

export function createGaugeChart(target: string | HTMLElement | Context, options: GaugeChartOptions) {
    return new GaugeChart(target, options);
}
