import {
    scaleContinuous,
} from '../scales';

import {
    typeIsString,
} from '@ripl/utilities';

export function rescaleCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    const context = canvas.getContext('2d');
    const dpr = window.devicePixelRatio;
    const scaledWidth = Math.floor(width * dpr);
    const scaledHeight = Math.floor(height * dpr);

    const output = {
        xScale: scaleContinuous([0, width], [0, scaledWidth]),
        yScale: scaleContinuous([0, height], [0, scaledHeight]),
    };

    if (scaledWidth === canvas.width && scaledHeight === canvas.height) {
        return output;
    }

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    return output;
}

export function createContext(target: string | HTMLCanvasElement) {
    const canvas = typeIsString(target) ? document.querySelector(target) as HTMLCanvasElement : target;
    const context = canvas?.getContext('2d');

    if (!context) {
        throw new Error('Failed to resolve canvas element');
    }

    const {
        width,
        height,
    } = canvas.getBoundingClientRect();

    const {
        xScale,
        yScale,
    } = rescaleCanvas(canvas, width, height);

    const clear = () => context.clearRect(0, 0, canvas.width, canvas.height);

    return {
        canvas,
        context,
        clear,
        width,
        height,
        xScale,
        yScale,
    };
}