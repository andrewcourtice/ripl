import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCircle,
    elementIsCircle,
} from '../../src';

describe('Circle', () => {

    test('Should create with state', () => {
        const circle = createCircle({
            cx: 10,
            cy: 20,
            radius: 30,
        });

        expect(circle.cx).toBe(10);
        expect(circle.cy).toBe(20);
        expect(circle.radius).toBe(30);
        expect(circle.type).toBe('circle');
    });

    test('Should update state via setters', () => {
        const circle = createCircle({
            cx: 0,
            cy: 0,
            radius: 10,
        });

        circle.cx = 50;
        circle.cy = 60;
        circle.radius = 70;

        expect(circle.cx).toBe(50);
        expect(circle.cy).toBe(60);
        expect(circle.radius).toBe(70);
    });

    test('Should compute bounding box', () => {
        const circle = createCircle({
            cx: 100,
            cy: 100,
            radius: 50,
        });

        const box = circle.getBoundingBox();

        expect(box.top).toBe(50);
        expect(box.left).toBe(50);
        expect(box.bottom).toBe(150);
        expect(box.right).toBe(150);
    });

    test('Should compute bounding box at origin', () => {
        const circle = createCircle({
            cx: 0,
            cy: 0,
            radius: 25,
        });

        const box = circle.getBoundingBox();

        expect(box.top).toBe(-25);
        expect(box.left).toBe(-25);
        expect(box.bottom).toBe(25);
        expect(box.right).toBe(25);
    });

});

describe('elementIsCircle', () => {

    test('Should return true for Circle instances', () => {
        const circle = createCircle({
            cx: 0,
            cy: 0,
            radius: 10,
        });

        expect(elementIsCircle(circle)).toBe(true);
    });

    test('Should return false for non-Circle values', () => {
        expect(elementIsCircle({})).toBe(false);
        expect(elementIsCircle(null)).toBe(false);
        expect(elementIsCircle(42)).toBe(false);
    });

});
