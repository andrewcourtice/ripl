import {
    createGroup,
    createPolyline,
    Scene,
} from '@ripl/core';

export interface AxisOptions {
    color: string;
    padding: number;
    x: {
        enabled: boolean;
    };
    y: {
        enabled: boolean;
    };
}

const OPTIONS = {
    color: '#CCCCCC',
    padding: 10,
} as AxisOptions;

export function axis(scene: Scene, options?: Partial<AxisOptions>) {
    const {
        color,
        padding,
        x,
        y,
    } = {
        ...OPTIONS,
        ...options,
    } as AxisOptions;

    const {
        canvas,
    } = scene;

    const axisGroup = createGroup({
        strokeStyle: color,
    });

    if (x.enabled) {
        const xAxisLine = createPolyline({
            points: () => [
                [padding, canvas.width - padding],
                [],
            ],
        });
    }

    if (y.enabled) {
        const yAxisGroup = createGroup();

        const yAxisLine = createPolyline({
            points: () => [
                [padding, padding],
                [padding, canvas.height - padding],
            ],
        });
    }

    return axisGroup;
}