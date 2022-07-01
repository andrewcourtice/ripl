import {
    BaseShape,
    shape,
} from './_base';

export interface Arc extends BaseShape {
    x: number;
    y: number;
    radius: number;
    startAngle: number;
    endAngle: number;
}

export const arc = shape<Arc>((context, state) => {
    const {
        x,
        y,
        radius,
        startAngle,
        endAngle,
    } = state;

    context.beginPath();
    context.arc(x, y, radius, startAngle, endAngle);
});
