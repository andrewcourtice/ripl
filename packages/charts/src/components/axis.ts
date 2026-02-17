import {
    ChartComponent,
    ChartComponentOptions,
} from './_base';

import {
    Box,
    createGroup,
    createLine,
    createText,
    Group,
    Line,
    Scale,
    Text,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
    arrayReduce,
} from '@ripl/utilities';

export type ChartXAxisAlignment = 'top' | 'bottom';
export type ChartYAxisAlignment = 'left' | 'right';
export type LabelDimension = 'width' | 'height';

export interface ChartAxisOptions extends ChartComponentOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scale: Scale<any, number>;
    bounds: Box;
    padding?: number;
    tickCount?: number;
    tickSize?: number;
    maxWidth?: number;
    maxHeight?: number;
    gridLines?: boolean;
    labelDimension: LabelDimension;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

export interface ChartXAxisOptions extends Omit<ChartAxisOptions, 'labelDimension'> {
    alignment?: ChartXAxisAlignment;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

export interface ChartYAxisOptions extends Omit<ChartAxisOptions, 'labelDimension'> {
    alignment?: ChartYAxisAlignment;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

const LABEL_DIMENSION_MAP = {
    width: metrics => metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
    height: metrics => metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
} as Record<LabelDimension, (metrics: TextMetrics) => number>;

export class ChartAxis extends ChartComponent {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public scale: Scale<any, number>;
    public bounds: Box;
    public padding: number;
    public tickSize: number;
    public tickCount: number;
    public title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public formatLabel?: (value: any) => string;

    protected group: Group;

    private labelDimension: LabelDimension;

    protected get ticks() {
        const ticks = this.scale.ticks(this.tickCount);

        const [
            rangeMin,
            rangeMax,
        ] = this.scale.range;

        const rangeSize = Math.abs(rangeMax - rangeMin);
        const maxSize = this.measureLabels(ticks, LABEL_DIMENSION_MAP[this.labelDimension]);
        const tickRatio = rangeSize / (ticks.length * maxSize);
        const dropCount = Math.ceil(1 / tickRatio);
        const shouldDrop = tickRatio < 1;

        return ticks.filter((_, index) => !shouldDrop || index % dropCount === 0);
    }

    protected get maxLabelWidth() {
        return this.measureLabels(this.ticks, LABEL_DIMENSION_MAP.width);
    }

    protected get maxLabelHeight() {
        return this.measureLabels(this.ticks, LABEL_DIMENSION_MAP.height);
    }

    constructor(options: ChartAxisOptions) {
        const {
            scene,
            renderer,
            scale,
            bounds,
            labelDimension,
            padding = 5,
            tickSize = 5,
            tickCount = 10,
        } = options;

        super({
            scene,
            renderer,
        });

        this.bounds = bounds;
        this.scale = scale;
        this.padding = padding;
        this.tickSize = tickSize;
        this.tickCount = tickCount;
        this.labelDimension = labelDimension;
        this.title = options.title;
        this.formatLabel = options.formatLabel;

        this.group = createGroup({
            class: 'chart-axis',
            children: [
                createLine({
                    class: 'chart-axis__line',
                    strokeStyle: '#777777',
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 0,
                }),
            ],
        });

        scene.add(this.group);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected measureLabels(values: any[], producer: (metrics: TextMetrics) => number) {
        return arrayReduce(values, (output, value) => {
            const metrics = this.context.measureText(value.toString());
            return Math.max(output, producer(metrics));
        }, 0);
    }

    public getBoundingBox(): Box {
        return this.bounds;
    }

    public render() {

    }

}

export class ChartXAxis extends ChartAxis {

    public alignment: ChartXAxisAlignment;

    constructor(options: ChartXAxisOptions) {
        const {
            alignment = 'bottom',
        } = options;

        super({
            ...options,
            labelDimension: 'width',
        });

        this.alignment = alignment;
    }

    public getBoundingBox(): Box {
        const isBottomAligned = this.alignment === 'bottom';
        const clearance = this.maxLabelHeight
            + this.padding
            + this.tickSize
            + 1; // 1 for line width

        const {
            top,
            left,
            bottom,
            right,
        } = this.bounds;

        return new Box(
            isBottomAligned ? bottom - clearance : top,
            left,
            isBottomAligned ? bottom : top + clearance,
            right
        );
    }

    public async render() {
        const ticks = this.ticks;
        const boundingBox = this.getBoundingBox();
        const line = this.group.query<Line>('.chart-axis__line');

        if (line) {
            line.x1 = boundingBox.left;
            line.y1 = boundingBox.top;
            line.x2 = boundingBox.right;
            line.y2 = boundingBox.top;
        }

        const groups = this.group.queryAll<Group>('.chart-axis__tick-group');

        const {
            left: groupEntries,
            inner: groupUpdates,
            right: groupExits,
        } = arrayJoin(ticks, groups, (value, group) => ticks.indexOf(value) === groups.indexOf(group));

        const labelEntryTexts = arrayMap(groupEntries, value => {
            const x = this.scale(value);

            return createGroup({
                class: 'chart-axis__tick-group',
                zIndex: 1000,
                children: [
                    createText({
                        content: this.formatLabel ? this.formatLabel(value) : value,
                        x,
                        y: boundingBox.top + this.padding + this.tickSize + 1,
                        textAlign: 'center',
                        textBaseline: 'top',
                        fillStyle: '#777777',
                        font: '12px sans-serif',
                    }),
                    createLine({
                        x1: x,
                        y1: boundingBox.top,
                        x2: x,
                        y2: boundingBox.top + this.tickSize,
                        strokeStyle: '#777777',
                    }),
                ],
            });
        });

        this.group.add(labelEntryTexts);
        this.group.remove(groupExits);

        arrayForEach(groupUpdates, ([value, group]) => {
            const line = group.query<Line>('line');
            const label = group.query<Text>('text');
            const x = this.scale(value);

            if (line) {
                line.x1 = x;
                line.y1 = boundingBox.top;
                line.x2 = x;
                line.y2 = boundingBox.top + this.tickSize;
            }

            if (label) {
                label.content = this.formatLabel ? this.formatLabel(value) : value.toString();
                label.x = x;
                label.y = boundingBox.top + this.padding + this.tickSize + 1;
            }
        });

        return Promise.resolve();
    }

}

export class ChartYAxis extends ChartAxis {

    public alignment: ChartYAxisAlignment;

    constructor(options: ChartYAxisOptions) {
        const {
            alignment = 'left',
        } = options;

        super({
            ...options,
            labelDimension: 'height',
        });

        this.alignment = alignment;
    }

    public getBoundingBox(): Box {
        const isLeftAligned = this.alignment === 'left';
        const clearance = this.maxLabelWidth
            + this.padding
            + this.tickSize
            + 1; // 1 for line width

        const {
            top,
            left,
            bottom,
            right,
        } = this.bounds;

        return new Box(
            top,
            isLeftAligned ? left : right - clearance,
            bottom,
            isLeftAligned ? left + clearance : right
        );
    }

    public async render() {
        const ticks = this.ticks;
        const boundingBox = this.getBoundingBox();
        const line = this.group.query<Line>('.chart-axis__line');

        if (line) {
            line.x1 = boundingBox.right;
            line.x2 = boundingBox.right;
            line.y1 = boundingBox.top;
            line.y2 = boundingBox.bottom;
        }

        const groups = this.group.queryAll<Group>('.chart-axis__tick-group');

        const {
            left: groupEntries,
            inner: groupUpdates,
            right: groupExits,
        } = arrayJoin(ticks, groups, (value, group) => ticks.indexOf(value) === groups.indexOf(group));

        const labelEntryTexts = arrayMap(groupEntries, value => {
            const y = this.scale(value);

            return createGroup({
                class: 'chart-axis__tick-group',
                zIndex: 1000,
                children: [
                    createText({
                        content: this.formatLabel ? this.formatLabel(value) : value,
                        x: boundingBox.right - this.padding - this.tickSize - 1,
                        y,
                        textAlign: 'right',
                        textBaseline: 'middle',
                        fillStyle: '#777777',
                        font: '12px sans-serif',
                    }),
                    createLine({
                        x1: boundingBox.right,
                        y1: y,
                        x2: boundingBox.right - this.tickSize,
                        y2: y,
                        strokeStyle: '#777777',
                    }),
                ],
            });
        });

        this.group.add(labelEntryTexts);
        this.group.remove(groupExits);

        arrayForEach(groupUpdates, ([value, group]) => {
            const line = group.query<Line>('line');
            const label = group.query<Text>('text');
            const y = this.scale(value);

            if (line) {
                line.y1 = y;
                line.y2 = y;
            }

            if (label) {
                label.content = this.formatLabel ? this.formatLabel(value) : value.toString();
                label.y = y;
            }
        });

        return Promise.resolve();
    }

}
