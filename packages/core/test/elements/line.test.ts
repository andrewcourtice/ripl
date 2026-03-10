import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createLine,
    elementIsLine,
} from '../../src';

describe('Line', () => {

    test('Should create with state', () => {
        const line = createLine({
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 50,
        });

        expect(line.x1).toBe(0);
        expect(line.y1).toBe(0);
        expect(line.x2).toBe(100);
        expect(line.y2).toBe(50);
        expect(line.type).toBe('line');
    });

    test('Should update state via setters', () => {
        const line = createLine({
            x1: 0,
            y1: 0,
            x2: 10,
            y2: 10,
        });

        line.x1 = 5;
        line.y1 = 15;
        line.x2 = 200;
        line.y2 = 300;

        expect(line.x1).toBe(5);
        expect(line.y1).toBe(15);
        expect(line.x2).toBe(200);
        expect(line.y2).toBe(300);
    });

    test('Should compute bounding box', () => {
        const line = createLine({
            x1: 10,
            y1: 20,
            x2: 100,
            y2: 200,
        });

        const box = line.getBoundingBox();

        expect(box.top).toBe(20);
        expect(box.left).toBe(10);
        expect(box.bottom).toBe(200);
        expect(box.right).toBe(100);
    });

    test('Should compute bounding box with reversed coordinates', () => {
        const line = createLine({
            x1: 100,
            y1: 200,
            x2: 10,
            y2: 20,
        });

        const box = line.getBoundingBox();

        expect(box.top).toBe(20);
        expect(box.left).toBe(10);
        expect(box.bottom).toBe(200);
        expect(box.right).toBe(100);
    });

});

describe('elementIsLine', () => {

    test('Should return true for Line instances', () => {
        const line = createLine({
            x1: 0,
            y1: 0,
            x2: 10,
            y2: 10,
        });

        expect(elementIsLine(line)).toBe(true);
    });

    test('Should return false for non-Line values', () => {
        expect(elementIsLine({})).toBe(false);
        expect(elementIsLine(null)).toBe(false);
    });

});
