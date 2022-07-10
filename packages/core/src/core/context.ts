import {
    isString,
} from '../utilities/type';

export function rescaleCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    const dpr = window.devicePixelRatio;
    const scaledWidth = width * dpr;
    const scaledHeight = height * dpr;

    if (scaledWidth === canvas.width && scaledHeight === canvas.height) {
        return;
    }

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
}

export function getContext(target: string | HTMLCanvasElement) {
    const canvas = isString(target) ? document.querySelector(target) as HTMLCanvasElement : target;
    const context = canvas?.getContext('2d');

    if (!context) {
        throw new Error('Failed to resolve canvas element');
    }

    const {
        width,
        height,
    } = canvas.getBoundingClientRect();

    rescaleCanvas(canvas, width, height);

    const clear = () => context.clearRect(0, 0, canvas.width, canvas.height);

    return {
        canvas,
        context,
        clear,
    };
}