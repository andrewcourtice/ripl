import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    Arc,
    ArcState,
    BaseElementState,
    Circle,
    CircleState,
    Context,
    createArc,
    createCircle,
    createGroup,
    createLine,
    createText,
    easeOutQuint,
    elementIsArc,
    elementIsText,
    Group,
    Line,
    LineState,
    maxOf,
    scaleContinuous,
    setColorAlpha,
    TAU,
    Text,
    TextState,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

export interface PolarAreaChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    /** Inner radius ratio (0 - 1). Defaults to 0.15 */
    innerRadiusRatio?: number;
    /** Maximum radius ratio (0 - 0.5). Defaults to 0.45 (similar to pie chart). */
    maxRadiusRatio?: number;
    /** Padding angle between segments in radians. Defaults to 0.02 */
    padAngle?: number;
    /** Number of concentric grid rings. Defaults to 4 */
    levels?: number;
}

/**
 * PolarAreaChart renders equal angle segments whose radius encodes the value.
 * Transitions follow the same pattern as `PieChart` (enter/update/exit with staged animation).
 */
export class PolarAreaChart<TData = unknown> extends Chart<PolarAreaChartOptions<TData>> {

    private groups: Group[] = [];
    private gridGroup?: Group;
    private gridRings: Circle[] = [];
    private gridLabels: Text[] = [];
    private gridLines: Line[] = [];

    constructor(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>) {
        super(target, options);
        this.init();
    }

    private drawGrid(
        cx: number,
        cy: number,
        innerRadius: number,
        maxRadius: number,
        maxValue: number,
        levels: number,
        angleStep: number,
        startOffset: number,
        segmentCount: number
    ) {
        const isEntry = !this.gridGroup;
        const animDuration = this.getAnimationDuration(800);
        const radiusStep = (maxRadius - innerRadius) / levels;

        if (isEntry) {
            this.gridGroup = createGroup({
                id: 'polar-grid',
                class: 'polar-grid',
                zIndex: 0,
            });

            this.scene.add(this.gridGroup);
        }

        // --- Concentric rings ---
        const levelIndices = Array.from({ length: levels }).map((_, i) => i + 1);

        const {
            left: ringEntries,
            inner: ringUpdates,
            right: ringExits,
        } = arrayJoin(levelIndices, this.gridRings, (level, ring) => ring.id === `polar-ring-${level}`);

        ringExits.forEach(el => el.destroy());

        const newRings = ringEntries.map(level => {
            const levelRadius = innerRadius + radiusStep * level;

            const ring = createCircle({
                id: `polar-ring-${level}`,
                cx,
                cy,
                radius: isEntry ? innerRadius : levelRadius,
                strokeStyle: '#e5e7eb',
                lineWidth: 1,
                data: {
                    radius: levelRadius,
                },
            });

            ring.autoFill = false;
            this.gridGroup!.add(ring);

            return ring;
        });

        ringUpdates.forEach(([level, ring]) => {
            const levelRadius = innerRadius + radiusStep * level;

            ring.data = {
                cx,
                cy,
                radius: levelRadius,
            } as Partial<CircleState>;
        });

        this.gridRings = [
            ...newRings,
            ...ringUpdates.map(([, ring]) => ring),
        ];

        // --- Ring value labels ---
        const {
            left: labelEntries,
            inner: labelUpdates,
            right: labelExits,
        } = arrayJoin(levelIndices, this.gridLabels, (level, label) => label.id === `polar-ring-label-${level}`);

        labelExits.forEach(el => el.destroy());

        const newLabels = labelEntries.map(level => {
            const levelRadius = innerRadius + radiusStep * level;
            const levelValue = Math.round((maxValue / levels) * level);

            const label = createText({
                id: `polar-ring-label-${level}`,
                x: cx + 4,
                y: cy - levelRadius - 2,
                content: levelValue.toString(),
                fillStyle: '#9ca3af',
                font: '10px sans-serif',
                textAlign: 'left',
                textBaseline: 'bottom',
                globalAlpha: isEntry ? 0 : 1,
                data: {
                    globalAlpha: 1,
                },
            });

            this.gridGroup!.add(label);

            return label;
        });

        labelUpdates.forEach(([level, label]) => {
            const levelRadius = innerRadius + radiusStep * level;
            const levelValue = Math.round((maxValue / levels) * level);

            label.content = levelValue.toString();
            label.data = {
                x: cx + 4,
                y: cy - levelRadius - 2,
            } as Partial<TextState>;
        });

        this.gridLabels = [
            ...newLabels,
            ...labelUpdates.map(([, label]) => label),
        ];

        // --- Radial axis lines ---
        const lineIndices = Array.from({ length: segmentCount }).map((_, i) => i);

        const {
            left: lineEntries,
            inner: lineUpdates,
            right: lineExits,
        } = arrayJoin(lineIndices, this.gridLines, (idx, line) => line.id === `polar-axis-${idx}`);

        lineExits.forEach(el => el.destroy());

        const newLines = lineEntries.map(idx => {
            const angle = startOffset + idx * angleStep;
            const x2 = cx + maxRadius * Math.cos(angle);
            const y2 = cy + maxRadius * Math.sin(angle);
            const x1 = cx + innerRadius * Math.cos(angle);
            const y1 = cy + innerRadius * Math.sin(angle);

            const line = createLine({
                id: `polar-axis-${idx}`,
                x1,
                y1,
                x2: isEntry ? x1 : x2,
                y2: isEntry ? y1 : y2,
                strokeStyle: '#e5e7eb',
                lineWidth: 1,
                data: {
                    x2,
                    y2,
                },
            });

            this.gridGroup!.add(line);

            return line;
        });

        lineUpdates.forEach(([idx, line]) => {
            const angle = startOffset + idx * angleStep;
            const x2 = cx + maxRadius * Math.cos(angle);
            const y2 = cy + maxRadius * Math.sin(angle);
            const x1 = cx + innerRadius * Math.cos(angle);
            const y1 = cy + innerRadius * Math.sin(angle);

            line.data = {
                x1,
                y1,
                x2,
                y2,
            } as Partial<LineState>;
        });

        this.gridLines = [
            ...newLines,
            ...lineUpdates.map(([, line]) => line),
        ];

        // Animate: staggered entry for new elements, smooth transition for updates
        const allElements = this.gridGroup!.children;

        if (isEntry) {
            return this.renderer.transition(allElements, (element, index, length) => ({
                duration: animDuration,
                delay: index * (animDuration / length) * 0.3,
                ease: easeOutQuint,
                state: element.data as Partial<BaseElementState>,
            }));
        }

        return this.renderer.transition(allElements, element => ({
            duration: animDuration,
            ease: easeOutQuint,
            state: element.data as Partial<BaseElementState>,
        }));
    }

    public async render() {
        return super.render((scene, renderer) => {
            const {
                data,
                key,
                value,
                label,
                color,
                innerRadiusRatio = 0.15,
                maxRadiusRatio = 0.45,
                padAngle = 0.02,
                levels = 4,
            } = this.options;

            if (!data.length) {
                return Promise.resolve();
            }

            const colorGenerator = this.colorGenerator;
            const size = Math.min(scene.width, scene.height);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(value) ? value : (item: any) => item[value] as number;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getLabel = typeIsFunction(label) ? label : (item: any) => item[label] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getColor = typeIsFunction(color) ? color : (item: any) => item[color] as string;

            const maxValue = maxOf(data, getValue) ?? 0;
            const valueScale = scaleContinuous([0, maxValue], [size * innerRadiusRatio, size * maxRadiusRatio], { clamp: true });

            const angleStep = TAU / data.length;
            const startOffset = -TAU / 4; // Start at 12 o'clock similar to PieChart

            const gridTransition = this.drawGrid(
                scene.width / 2,
                scene.height / 2,
                size * innerRadiusRatio,
                size * maxRadiusRatio,
                maxValue,
                levels,
                angleStep,
                startOffset,
                data.length
            );

            const calculations = data.map((item, index) => {
                const key = getKey(item);
                const v = getValue(item);
                const color = getColor(item);
                const label = getLabel(item);
                const cx = scene.width / 2;
                const cy = scene.height / 2;
                const startAngle = startOffset + index * angleStep;
                const endAngle = startAngle + angleStep;
                const innerRadius = size * innerRadiusRatio;
                const radius = valueScale(v);

                return {
                    key,
                    value: v,
                    color,
                    label,
                    cx,
                    cy,
                    startAngle,
                    endAngle,
                    padAngle,
                    radius,
                    innerRadius,
                    item,
                };
            });

            const {
                left: entryData,
                inner: updateData,
                right: exitData,
            } = arrayJoin(calculations, this.groups, (item, group) => item.key === group.id);

            const entries = entryData.map(item => {
                const {
                    key,
                    color = colorGenerator.next().value,
                    label,
                    cx,
                    cy,
                    startAngle,
                    endAngle,
                    padAngle,
                    radius,
                    innerRadius,
                } = item;

                const segmentArc = createArc({
                    class: 'segment__arc',
                    cx,
                    cy,
                    startAngle,
                    endAngle: startAngle, // animate angle grow subtly
                    padAngle,
                    strokeStyle: color,
                    fillStyle: setColorAlpha(color, 0.55),
                    lineWidth: 2,
                    radius: innerRadius, // animate radial growth
                    innerRadius,
                    data: {
                        endAngle,
                        radius,
                    } as Partial<ArcState>,
                });

                segmentArc.on('mouseenter', () => {
                    renderer.transition(segmentArc, {
                        duration: this.getAnimationDuration(400),
                        ease: easeOutQuint,
                        state: {
                            fillStyle: color,
                        },
                    });

                    segmentArc.on('mouseleave', () => {
                        renderer.transition(segmentArc, {
                            duration: this.getAnimationDuration(400),
                            ease: easeOutQuint,
                            state: {
                                fillStyle: setColorAlpha(color, 0.55),
                            },
                        });
                    });
                });

                const [centroidX, centroidY] = segmentArc.getCentroid(segmentArc.data as Partial<ArcState>);

                const segmentLabel = createText({
                    class: 'segment__label',
                    fillStyle: '#000000',
                    x: centroidX,
                    y: centroidY,
                    content: label,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    globalAlpha: 0,
                    zIndex: 1,
                });

                return createGroup({
                    id: key,
                    class: 'segment',
                    children: [
                        segmentArc,
                        segmentLabel,
                    ],
                });
            });

            const updates = updateData.map(([item, group]) => {
                const {
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    padAngle,
                } = item;

                const arc = group.query('arc') as Arc;
                const label = group.query('text') as Text;

                const resolvedColor = item.color ?? arc.strokeStyle;

                const arcData = {
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    padAngle,
                    strokeStyle: resolvedColor,
                    fillStyle: setColorAlpha(resolvedColor, 0.55),
                } as Partial<ArcState>;

                const [centroidx, centroidY] = arc.getCentroid(arcData);

                arc.data = arcData;
                label.data = {
                    x: centroidx,
                    y: centroidY,
                };

                return group;
            });

            const exits = exitData.map(group => {
                const arc = group.query('arc') as Arc;
                const label = group.query('text') as Text;

                const midAngle = (arc.startAngle + arc.endAngle) / 2;

                arc.data = {
                    startAngle: midAngle,
                    endAngle: midAngle,
                    radius: arc.innerRadius,
                } as Partial<ArcState>;

                label.data = {
                    globalAlpha: 0,
                } as Partial<TextState>;

                return group;
            });

            this.groups = [
                ...entries,
                ...updates,
            ];

            scene.add(entries);

            const animDuration = this.getAnimationDuration(1000);

            async function transitionEntries() {
                const elements = entries.flatMap(group => group.children);

                await renderer.transition(elements.filter(elementIsArc), (element, index, length) => ({
                    duration: animDuration,
                    ease: easeOutQuint,
                    delay: index * (animDuration / length),
                    state: element.data as Partial<ArcState>,
                }));

                return renderer.transition(elements.filter(elementIsText), {
                    duration: animDuration * 1.5,
                    ease: easeOutQuint,
                    state: {
                        globalAlpha: 1,
                    },
                });
            }

            async function transitionUpdates() {
                return renderer.transition(updates, element => ({
                    duration: animDuration * 0.8,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));
            }

            async function transitionExits() {
                return renderer.transition(exits, element => ({
                    duration: animDuration * 0.8,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                    onComplete: element => element.destroy(),
                }));
            }

            return Promise.all([
                gridTransition,
                transitionEntries(),
                transitionUpdates(),
                transitionExits(),
            ]);
        });
    }
}

export function createPolarAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>) {
    return new PolarAreaChart<TData>(target, options);
}
