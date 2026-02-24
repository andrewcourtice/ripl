import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createRect,
    elementIsRect,
} from '../../src';

describe('Rect', () => {

    test('Should create a rect with correct state', () => {
        const rect = createRect({
            x: 10,
            y: 20,
            width: 100,
            height: 50,
        });

        expect(rect.type).toBe('rect');
        expect(rect.x).toBe(10);
        expect(rect.y).toBe(20);
        expect(rect.width).toBe(100);
        expect(rect.height).toBe(50);
    });

    test('Should update state via setters', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        rect.x = 50;
        rect.y = 60;
        rect.width = 200;
        rect.height = 100;

        expect(rect.x).toBe(50);
        expect(rect.y).toBe(60);
        expect(rect.width).toBe(200);
        expect(rect.height).toBe(100);
    });

    test('Should compute correct bounding box', () => {
        const rect = createRect({
            x: 10,
            y: 20,
            width: 100,
            height: 50,
        });

        const box = rect.getBoundingBox();
        expect(box.top).toBe(20);
        expect(box.left).toBe(10);
        expect(box.bottom).toBe(70);
        expect(box.right).toBe(110);
    });

    test('Should support borderRadius', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            borderRadius: 5,
        });

        expect(rect.borderRadius).toBe(5);
    });

    test('elementIsRect should identify rects', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        expect(elementIsRect(rect)).toBe(true);
        expect(elementIsRect({})).toBe(false);
        expect(elementIsRect(null)).toBe(false);
    });

});
