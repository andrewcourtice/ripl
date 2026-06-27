import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import type {
    ChartLegendInput,
} from '../core/options';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    resolveAccessor,
} from '../core/data';

import {
    Tooltip,
} from '../components/tooltip';

import {
    LegendItem,
} from '../components/legend';

import {
    Arc,
    ArcState,
    BaseElementState,
    Context,
    createArc,
    createGroup,
    createText,
    elementIsArc,
    elementIsText,
    getTotal,
    Group,
    scaleContinuous,
    setColorAlpha,
    TAU,
    Text,
    TextState,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** The opacity applied to a segment's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.55;

/** Options for configuring a {@link PieChart}. */
export interface PieChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    innerRadius?: number;
    legend?: ChartLegendInput;
}

/**
 * Pie chart rendering proportional arc segments with optional inner radius (donut).
 *
 * Supports a chart title, interactive tooltips, a legend in any position, and animated
 * entry/update/exit transitions. Segments grow outward from the centre with staggered delays,
 * and labels fade in after the arcs have settled.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class PieChart<TData = unknown> extends Chart<PieChartOptions<TData>> {

    private groups: Group[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: PieChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    public async render() {
        return super.render((scene, renderer) => {
            const { data, key, value, label, color } = this.options;

            const getKey = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const getLabel = resolveAccessor<TData, string>(label);
            const getColor = (item: TData): string | undefined => (color ? resolveAccessor<TData, string>(color)(item) : undefined);

            const colorFor = (item: TData) => getColor(item) ?? this.getSeriesColor(getKey(item));

            // Shared layout pass: reserve title and legend bands first.
            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = data.map(item => ({
                id: getKey(item),
                label: getLabel(item),
                color: colorFor(item),
                active: true,
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const size = Math.min(area.width, area.height);
            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;

            const total = getTotal(data, getValue);
            const scale = scaleContinuous([0, total], [0, TAU], { clamp: true });
            const offset = TAU / 4;
            const padAngle = data.length === 1 ? 0 : 0.1 / data.length;

            let startAngle = -offset;

            const calculations = data.map(item => {
                const itemKey = getKey(item);
                const itemValue = getValue(item);
                const itemColor = colorFor(item);
                const itemLabel = getLabel(item);
                const endAngle = startAngle + scale(itemValue);
                const radius = size * 0.45;
                const innerRadiusOption = this.options.innerRadius;
                let innerRadius = size * 0.25;

                if (innerRadiusOption !== undefined) {
                    innerRadius = innerRadiusOption <= 1 ? size * innerRadiusOption : innerRadiusOption;
                }

                const output = {
                    key: itemKey,
                    value: itemValue,
                    color: itemColor,
                    label: itemLabel,
                    cx,
                    cy,
                    startAngle,
                    endAngle,
                    padAngle,
                    radius,
                    innerRadius,
                    item,
                };

                startAngle = endAngle;

                return output;
            });

            const {
                left: entryData,
                inner: updateData,
                right: exitData,
            } = arrayJoin(calculations, this.groups, (item, group) => item.key === group.id);

            const entries = entryData.map(item => {
                const {
                    key: segmentKey,
                    value: segmentValue,
                    color: segmentColor,
                    label: segmentLabel,
                    cx: segmentCx,
                    cy: segmentCy,
                    startAngle: segmentStart,
                    endAngle: segmentEnd,
                    padAngle: segmentPad,
                    radius,
                    innerRadius,
                } = item;

                const segmentArc = createArc({
                    class: 'segment__arc',
                    cx: segmentCx,
                    cy: segmentCy,
                    startAngle: segmentStart,
                    padAngle: segmentPad,
                    stroke: segmentColor,
                    fill: setColorAlpha(segmentColor, REST_ALPHA),
                    lineWidth: 2,
                    endAngle: segmentStart,
                    radius: 0,
                    innerRadius: 0,
                    data: {
                        endAngle: segmentEnd,
                        radius,
                        innerRadius,
                    } as Partial<ArcState>,
                });

                this.attachSegmentHover(segmentArc, segmentColor, segmentValue);

                const [centroidX, centroidY] = segmentArc.getCentroid(segmentArc.data as Partial<ArcState>);

                const labelText = createText({
                    class: 'segment__label',
                    fill: '#000000',
                    x: centroidX,
                    y: centroidY,
                    content: segmentLabel,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    opacity: 0,
                    zIndex: 1,
                });

                return createGroup({
                    id: segmentKey,
                    class: 'segment',
                    children: [
                        segmentArc,
                        labelText,
                    ],
                });
            });

            const updates = updateData.map(([item, group]) => {
                const {
                    cx: segmentCx,
                    cy: segmentCy,
                    radius,
                    innerRadius,
                    startAngle: segmentStart,
                    endAngle: segmentEnd,
                    padAngle: segmentPad,
                } = item;

                const arc = group.query('arc') as Arc;
                const labelText = group.query('text') as Text;

                const resolvedColor = item.color ?? (arc.stroke as string);

                const arcData = {
                    cx: segmentCx,
                    cy: segmentCy,
                    radius,
                    innerRadius,
                    startAngle: segmentStart,
                    endAngle: segmentEnd,
                    padAngle: segmentPad,
                    stroke: resolvedColor,
                    fill: setColorAlpha(resolvedColor, REST_ALPHA),
                } as Partial<ArcState>;

                const [centroidX, centroidY] = arc.getCentroid(arcData);

                arc.data = arcData;
                this.attachSegmentHover(arc, resolvedColor, item.value);

                labelText.data = {
                    x: centroidX,
                    y: centroidY,
                };

                return group;
            });

            const exits = exitData.map(group => {
                const arc = group.query('arc') as Arc;
                const labelText = group.query('text') as Text;

                const midAngle = (arc.startAngle + arc.endAngle) / 2;

                arc.data = {
                    startAngle: midAngle,
                    endAngle: midAngle,
                    radius: 0,
                    innerRadius: 0,
                } as Partial<ArcState>;

                labelText.data = {
                    opacity: 0,
                } as Partial<TextState>;

                return group;
            });

            this.groups = [
                ...entries,
                ...updates,
            ];

            scene.add(entries);

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
            const update = this.resolveAnimation(ANIMATION_REFERENCE.update);
            const exit = this.resolveAnimation(ANIMATION_REFERENCE.exit);

            const transitionEntries = async () => {
                const elements = entries.flatMap(group => group.children);

                await renderer.transition(elements.filter(elementIsArc), (element, index, length) => ({
                    duration: enter.duration,
                    ease: enter.ease,
                    delay: length <= 1 ? 0 : (index / length) * enter.duration,
                    state: element.data as Partial<ArcState>,
                }));

                return renderer.transition(elements.filter(elementIsText), {
                    duration: enter.duration,
                    ease: enter.ease,
                    state: { opacity: 1 },
                });
            };

            const transitionUpdates = async () => renderer.transition(updates, element => ({
                duration: update.duration,
                ease: update.ease,
                state: element.data as Partial<BaseElementState>,
            }));

            const transitionExits = async () => renderer.transition(exits, element => ({
                duration: exit.duration,
                ease: exit.ease,
                state: element.data as Partial<BaseElementState>,
                onComplete: el => el.destroy(),
            }));

            return Promise.all([
                transitionEntries(),
                transitionUpdates(),
                transitionExits(),
            ]);
        });
    }

    private attachSegmentHover(arc: Arc, color: string, value: number) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        applyHoverHighlight(arc, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => {
                const [x, y] = arc.getCentroid(arc.data as Partial<ArcState>);
                return { x, y };
            },
            content: () => value.toString(),
            highlight: { fill: color },
            restore: { fill: setColorAlpha(color, REST_ALPHA) },
        });
    }

}

/** Factory function that creates a new {@link PieChart} instance. */
export function createPieChart<TData = unknown>(target: string | HTMLElement | Context, options: PieChartOptions<TData>) {
    return new PieChart<TData>(target, options);
}
