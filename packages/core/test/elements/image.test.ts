import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createImage,
    elementIsImage,
    interpolateImage,
} from '../../src';

function createMockImage(width: number = 100, height: number = 50): HTMLImageElement {
    const img = new Image();

    Object.defineProperty(img, 'width', {
        value: width,
    });

    Object.defineProperty(img, 'height', {
        value: height,
    });

    return img;
}

describe('ImageElement', () => {

    test('Should create with state', () => {
        const img = createMockImage();
        const image = createImage({
            image: img,
            x: 10,
            y: 20,
        });

        expect(image.image).toBe(img);
        expect(image.x).toBe(10);
        expect(image.y).toBe(20);
        expect(image.type).toBe('image');
    });

    test('Should update state via setters', () => {
        const img1 = createMockImage();
        const img2 = createMockImage(200, 100);

        const image = createImage({
            image: img1,
            x: 0,
            y: 0,
        });

        image.x = 50;
        image.y = 60;
        image.image = img2;

        expect(image.x).toBe(50);
        expect(image.y).toBe(60);
        expect(image.image).toBe(img2);
    });

    test('Should support optional width and height', () => {
        const img = createMockImage();
        const image = createImage({
            image: img,
            x: 0,
            y: 0,
            width: 200,
            height: 100,
        });

        expect(image.width).toBe(200);
        expect(image.height).toBe(100);
    });

    test('Should compute bounding box from explicit dimensions', () => {
        const img = createMockImage();
        const image = createImage({
            image: img,
            x: 10,
            y: 20,
            width: 200,
            height: 100,
        });

        const box = image.getBoundingBox();

        expect(box.top).toBe(20);
        expect(box.left).toBe(10);
        expect(box.bottom).toBe(120);
        expect(box.right).toBe(210);
    });

    test('Should compute bounding box from source dimensions when no explicit size', () => {
        const img = createMockImage(300, 150);
        const image = createImage({
            image: img,
            x: 10,
            y: 20,
        });

        const box = image.getBoundingBox();

        expect(box.top).toBe(20);
        expect(box.left).toBe(10);
        expect(box.bottom).toBe(170);
        expect(box.right).toBe(310);
    });

});

describe('elementIsImage', () => {

    test('Should return true for ImageElement instances', () => {
        const img = createMockImage();
        const image = createImage({
            image: img,
            x: 0,
            y: 0,
        });

        expect(elementIsImage(image)).toBe(true);
    });

    test('Should return false for non-ImageElement values', () => {
        expect(elementIsImage({})).toBe(false);
        expect(elementIsImage(null)).toBe(false);
    });

});

describe('interpolateImage', () => {

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // A runtime without the DOM image constructors reached `instanceof` before any guard could run.
    test('Should size a source on a runtime that declares no image constructors', () => {
        const source = {} as CanvasImageSource;

        vi.stubGlobal('HTMLImageElement', undefined);
        vi.stubGlobal('HTMLCanvasElement', undefined);
        vi.stubGlobal('SVGImageElement', undefined);
        vi.stubGlobal('HTMLVideoElement', undefined);
        vi.stubGlobal('ImageBitmap', undefined);

        expect(() => interpolateImage(source, source)).not.toThrow();
    });

});

// jsdom has no 2D context, so the blend path is unreachable without standing one in.
describe('interpolateImage blending', () => {

    function stubCanvasContext() {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
            globalAlpha: 1,
            clearRect: vi.fn(),
            drawImage: vi.fn(),
        }) as unknown as CanvasRenderingContext2D);
    }

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('Should settle on each endpoint rather than hand back the blend buffer', () => {
        stubCanvasContext();

        const from = createMockImage();
        const to = createMockImage();
        const interpolate = interpolateImage(from, to);

        expect(interpolate(0)).toBe(from);
        expect(interpolate(1)).toBe(to);
    });

    test('Should blend into a buffer between the endpoints', () => {
        stubCanvasContext();

        const from = createMockImage();
        const to = createMockImage();
        const blended = interpolateImage(from, to)(0.5);

        expect(blended).not.toBe(from);
        expect(blended).not.toBe(to);
    });

    // A shared blend buffer had two cross-fades in the same frame hand back one another's pixels.
    test('Should give concurrent cross-fades their own blend buffer', () => {
        stubCanvasContext();

        const first = interpolateImage(createMockImage(), createMockImage());
        const second = interpolateImage(createMockImage(20, 20), createMockImage(20, 20));

        expect(first(0.5)).not.toBe(second(0.5));
    });

    test('Should cross-fade an element\'s image and land on the target', () => {
        stubCanvasContext();

        const from = createMockImage();
        const to = createMockImage();
        const element = createImage({
            image: from,
            x: 0,
            y: 0,
        });

        const interpolator = element.interpolate({ image: to });

        interpolator(0.5);
        expect(element.image).not.toBe(from);
        expect(element.image).not.toBe(to);

        interpolator(1);
        expect(element.image).toBe(to);
    });

});
