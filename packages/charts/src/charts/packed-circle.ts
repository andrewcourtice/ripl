import type {
    NumericAccessor,
} from '../core/data';

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
    resolveValueFormat,
} from '../core/options';

import {
    createSegmentLabel,
} from '../core/labels';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
    stagger,
} from '../core/animation';

import {
    resolveAccessor,
} from '../core/data';

import type {
    PackCircle,
} from '../core/pack';

import {
    enclosingCircle,
    packSiblings,
} from '../core/pack';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    Circle,
    CircleState,
    Context,
    EventMap,
    Group,
    Text,
} from '@ripl/core';

import {
    createCircle,
    createGroup,
    easeOutCubic,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** Opacity applied to a circle's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.7;

/** Options for configuring a {@link PackedCircleChart}. */
export interface PackedCircleChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: NumericAccessor<TData>;
    label?: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    /** Format applied to values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for packed circle interaction events. */
export interface PackedCircleChartCellEvent {
    x: number;
    y: number;
    value: number;
    label: string;
    key: string;
}

/** Events emitted by a {@link PackedCircleChart} that consumers can subscribe to via `chart.on(...)`. */
export interface PackedCircleChartEventMap extends EventMap {
    cellclick: PackedCircleChartCellEvent;
    cellenter: PackedCircleChartCellEvent;
    cellleave: PackedCircleChartCellEvent;
}

interface PackedNode {
    key: string;
    value: number;
    label: string;
    color: string;
    x: number;
    y: number;
    r: number;
}

/**
 * Packed circle chart rendering each datum as a circle whose area encodes its value, arranged in a
 * tight, non-overlapping cluster. Great for showing many parts of a whole without the rigid grid of
 * a treemap. Supports labels on sufficiently large circles, tooltips, and animated transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class PackedCircleChart<TData = unknown> extends Chart<PackedCircleChartOptions<TData>, PackedCircleChartEventMap> {

    private _groups: Group[] = [];
    private _enclosing?: Circle;
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: PackedCircleChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private _attachCellHover(circle: Circle, node: PackedNode, content: string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        const payload = (point: { x: number;
            y: number; }): PackedCircleChartCellEvent => ({
            x: point.x,
            y: point.y,
            value: node.value,
            label: node.label,
            key: node.key,
        });

        applyHoverHighlight(circle, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this._tooltip,
            anchor: () => ({
                x: node.x,
                y: node.y - node.r,
            }),
            content: () => content,
            highlight: { fill: node.color },
            restore: { fill: setColorAlpha(node.color, REST_ALPHA) },
            onEnter: point => this.emit('cellenter', payload(point)),
            onLeave: point => this.emit('cellleave', payload(point)),
            onClick: point => this.emit('cellclick', payload(point)),
        });
    }

    public async render() {
        return super.render(async () => {
            const {
                data,
                key,
                value,
                label,
                color,
            } = this.options;

            const getKey = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const getLabel = label !== undefined ? resolveAccessor<TData, string>(label) : getKey;
            const getColor = (item: TData): string | undefined => (color ? resolveAccessor<TData, string>(color)(item) : undefined);

            this.resolveSeriesColors(data.map(item => ({
                id: getKey(item),
                color: getColor(item),
            })));

            const colorFor = (item: TData) => getColor(item) ?? this.getSeriesColor(getKey(item));
            const formatValue = resolveValueFormat(this.options.format);

            const layout = this.createLayout();
            this.reserveTitle(layout);
            const area = layout.area;

            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;
            const fitRadius = (Math.min(area.width, area.height) / 2) * 0.96;

            // A single visible circle that contains the whole pack, drawn behind the cells. The pack
            // is scaled so its enclosing circle has radius `fitRadius`, so this exactly bounds it.
            const enclosingIsNew = !this._enclosing;

            if (!this._enclosing) {
                this._enclosing = createCircle({
                    id: 'packed-circle__enclosing',
                    class: 'packed-circle__enclosing',
                    cx,
                    cy,
                    radius: 0,
                    fill: setColorAlpha('#94a3b8', 0.06),
                    stroke: setColorAlpha('#94a3b8', 0.35),
                    lineWidth: 1.5,
                    pointerEvents: 'none',
                    zIndex: -1,
                    data: {
                        cx,
                        cy,
                        radius: fitRadius,
                    } as CircleState,
                });

                this.scene.add(this._enclosing);
            } else {
                this._enclosing.data = {
                    cx,
                    cy,
                    radius: fitRadius,
                } as CircleState;
            }

            // Pack circles with relative radii (area ∝ value), then centre + scale to fit the area.
            const packInput: PackCircle[] = data.map(item => ({
                x: 0,
                y: 0,
                r: Math.sqrt(Math.max(0, getValue(item))) || 0.001,
            }));

            packSiblings(packInput);
            const bounds = enclosingCircle(packInput);
            const scale = bounds.r > 0 ? fitRadius / bounds.r : 1;

            const nodes: PackedNode[] = data.map((item, index) => {
                const packed = packInput[index];
                return {
                    key: getKey(item),
                    value: getValue(item),
                    label: getLabel(item),
                    color: colorFor(item),
                    x: cx + (packed.x - bounds.x) * scale,
                    y: cy + (packed.y - bounds.y) * scale,
                    r: packed.r * scale,
                };
            });

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(nodes, this._groups, (node, group) => node.key === group.id);

            exits.forEach(group => group.destroy());

            const showLabel = (node: PackedNode) => node.r > 16;
            const labelFont = (r: number) => `600 ${Math.min(14, Math.max(9, r / 3))}px sans-serif`;

            const entryGroups = entries.map(node => {
                const restFill = setColorAlpha(node.color, REST_ALPHA);

                const circle = createCircle({
                    id: `${node.key}-circle`,
                    cx: node.x,
                    cy: node.y,
                    radius: 0,
                    fill: restFill,
                    stroke: node.color,
                    lineWidth: 1.5,
                    data: {
                        cx: node.x,
                        cy: node.y,
                        radius: node.r,
                        fill: restFill,
                    } as CircleState,
                });

                this._attachCellHover(circle, node, `${node.label}: ${formatValue(node.value)}`);

                const children: (Circle | Text)[] = [circle];

                if (showLabel(node)) {
                    const text = createSegmentLabel({
                        id: `${node.key}-label`,
                        x: node.x,
                        y: node.y,
                        content: node.label,
                        font: labelFont(node.r),
                    });

                    text.data = { opacity: 1 };
                    children.push(text);
                }

                return createGroup({
                    id: node.key,
                    class: 'packed-circle__node',
                    children,
                });
            });

            const updateTexts: Text[] = [];

            updates.forEach(([node, group]) => {
                const restFill = setColorAlpha(node.color, REST_ALPHA);
                const circle = group.getElementsByType('circle')[0] as Circle;

                if (circle) {
                    circle.data = {
                        cx: node.x,
                        cy: node.y,
                        radius: node.r,
                        fill: restFill,
                    } as CircleState;

                    this._attachCellHover(circle, node, `${node.label}: ${formatValue(node.value)}`);
                }

                let text = group.getElementsByType('text')[0] as Text | undefined;

                if (!text && showLabel(node)) {
                    text = createSegmentLabel({
                        id: `${node.key}-label`,
                        x: node.x,
                        y: node.y,
                        content: node.label,
                        font: labelFont(node.r),
                    });

                    group.add(text);
                }

                if (text) {
                    text.content = node.label;
                    text.font = labelFont(node.r);
                    text.data = {
                        x: node.x,
                        y: node.y,
                        opacity: showLabel(node) ? 1 : 0,
                    };

                    updateTexts.push(text);
                }
            });

            this.scene.add(entryGroups);

            this._groups = [
                ...entryGroups,
                ...updates.map(([, group]) => group),
            ];

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
            const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

            const entryCircles = entryGroups.flatMap(group => group.getElementsByType('circle') as Circle[]);
            const entryLabels = entryGroups.flatMap(group => group.getElementsByType('text') as Text[]);
            const updateCircles = updates.flatMap(([, group]) => group.getElementsByType('circle') as Circle[]);

            return Promise.all([
                this.renderer.transition(this._enclosing, {
                    duration: (enclosingIsNew ? enter : update).duration,
                    ease: easeOutCubic,
                    state: this._enclosing.data as CircleState,
                }),
                this.renderer.transition(entryCircles, (element, index, length) => ({
                    duration: enter.duration,
                    delay: stagger(index, length, enter.duration),
                    ease: easeOutCubic,
                    state: element.data as CircleState,
                })),
                entryLabels.length ? this.renderer.transition(entryLabels, {
                    duration: enter.duration,
                    ease: easeOutCubic,
                    state: { opacity: 1 },
                }) : Promise.resolve(),
                this.renderer.transition(updateCircles, element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as CircleState,
                })),
                updateTexts.length ? this.renderer.transition(updateTexts, element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Record<string, unknown>,
                })) : Promise.resolve(),
            ]);
        });
    }

}

/** Factory function that creates a new {@link PackedCircleChart} instance. */
export function createPackedCircleChart<TData = unknown>(target: string | HTMLElement | Context, options: PackedCircleChartOptions<TData>) {
    return new PackedCircleChart<TData>(target, options);
}
