import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    ArcState,
    Context,
    createArc,
    createGroup,
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

            // Min/max labels
            const minLabel = createText({
                id: 'gauge-min',
                x: cx - radius * 0.7,
                y: cy + radius * 0.5,
                content: min.toString(),
                fillStyle: '#9ca3af',
                font: '10px sans-serif',
                textAlign: 'center',
                textBaseline: 'middle',
            });

            const maxLabel = createText({
                id: 'gauge-max',
                x: cx + radius * 0.7,
                y: cy + radius * 0.5,
                content: max.toString(),
                fillStyle: '#9ca3af',
                font: '10px sans-serif',
                textAlign: 'center',
                textBaseline: 'middle',
            });

            this.group.add([minLabel, maxLabel]);
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
