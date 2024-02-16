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

export interface ChartAxisOptions extends ChartComponentOptions {
    scale: Scale;
    bounds: Box;
    padding?: number;
    tickSize?: number;
    maxWidth?: number;
    maxHeight?: number;
    grid?: boolean;
}

export interface ChartXAxisOptions extends ChartAxisOptions {
    alignment?: ChartXAxisAlignment;
}

export interface ChartYAxisOptions extends ChartAxisOptions {
    alignment?: ChartYAxisAlignment;
}

export class ChartAxis extends ChartComponent {

    public scale: Scale;
    public bounds: Box;
    public padding: number;
    public tickSize: number;

    protected group: Group;

    constructor(options: ChartAxisOptions) {
        const {
            scene,
            renderer,
            scale,
            bounds,
            padding = 5,
            tickSize = 5,
        } = options;

        super({
            scene,
            renderer,
        });

        this.bounds = bounds;
        this.scale = scale;
        this.padding = padding;
        this.tickSize = tickSize;

        this.group = createGroup({
            class: 'chart-axis',
            children: [
                createLine({
                    class: 'chart-axis__line',
                    strokeStyle: '#000000',
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 0,
                }),
            ],
        });

        scene.add(this.group);
    }

    public getBoundingBox(): Box {
        return this.bounds;
    }

    public render() {

    }

}

export class ChartYAxis extends ChartAxis {

    public alignment: ChartYAxisAlignment;

    constructor(options: ChartYAxisOptions) {
        const {
            alignment = 'left',
        } = options;

        super(options);

        this.alignment = alignment;
    }

    private get maxLabelWidth() {
        const ticks = this.scale.ticks();

        return arrayReduce(ticks, (output, value) => {
            const metrics = this.context.measureText(value.toString());
            const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;

            return Math.max(output, width);
        }, 0);
    }

    public getBoundingBox(): Box {
        const clearance = this.maxLabelWidth + this.padding + this.tickSize + 1; // 1 for line width

        return new Box(
            this.bounds.top,
            this.alignment === 'left' ? this.bounds.left : this.bounds.right - clearance,
            this.bounds.bottom,
            this.alignment === 'left' ? this.bounds.left + clearance : this.bounds.right
        );
    }

    public async render() {
        const tickValues = this.scale.ticks();
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
        } = arrayJoin(tickValues, groups, (value, group) => tickValues.indexOf(value) === groups.indexOf(group));

        const labelEntryTexts = arrayMap(groupEntries, value => {
            const y = this.scale(value);

            return createGroup({
                class: 'chart-axis__tick-group',
                zIndex: 1000,
                children: [
                    createText({
                        content: value,
                        x: boundingBox.right - this.padding - this.tickSize - 1,
                        y,
                        textAlign: 'right',
                        textBaseline: 'middle',
                        fillStyle: '#000000',
                        font: '12px sans-serif',
                    }),
                    createLine({
                        x1: boundingBox.right,
                        y1: y,
                        x2: boundingBox.right - this.tickSize,
                        y2: y,
                        strokeStyle: '#000000',
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
                label.content = value.toString();
                label.y = y;
            }
        });

        return Promise.resolve();
    }

}