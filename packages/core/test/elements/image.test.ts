import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createImage,
    elementIsImage,
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
