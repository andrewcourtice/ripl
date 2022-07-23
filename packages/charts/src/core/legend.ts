import {
    createGroup, createRect, Scene,
} from '@ripl/core';
import {
    arrayMap,
} from '@ripl/utilities';

export type ChartLegendPosition = 'left'
| 'top'
| 'right'
| 'bottom';

export interface ChartLegendValue {
    color: string;
    label: string;
}

export interface ChartLegendOptions {
    values: ChartLegendValue[];
    position?: ChartLegendPosition;
    margin?: number;
}

export function createLegend(scene: Scene, options: ChartLegendOptions) {
    const {
        values,
        position = 'bottom',
        margin = 10,
    } = options;

    const {
        context,
        canvas,
    } = scene;

    const group = createGroup();
    const wrapConstraint = ['top', 'bottom'].includes(position)
        ? scene.width
        : scene.height;

    const refLabel = context.measureText(values[0].label);
    const lineHeight = (refLabel.actualBoundingBoxAscent + refLabel.actualBoundingBoxDescent) * 1.5;

    const offsetX = 0;
    let offsetY = 0;

    arrayMap(values, ({ color, label }) => {
        const {
            width,
            actualBoundingBoxAscent,
            actualBoundingBoxDescent,
        } = context.measureText(label);

        const height = actualBoundingBoxAscent + actualBoundingBoxDescent;

        const itemWidth = lineHeight + 5 + width;

        if (offsetX + itemWidth > wrapConstraint) {
            offsetY += height;
        }


    });
}