import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createPolygon,
    elementIsPolygon,
} from '../../src';

describe('Polygon', () => {

    test('Should create with state', () => {
        const polygon = createPolygon({
            cx: 100,
            cy: 100,
            radius: 50,
            sides: 6,
        });

        expect(polygon.cx).toBe(100);
        expect(polygon.cy).toBe(100);
        expect(polygon.radius).toBe(50);
        expect(polygon.sides).toBe(6);
        expect(polygon.type).toBe('polygon');
    });

    test('Should update state via setters', () => {
        const polygon = createPolygon({
            cx: 0,
            cy: 0,
            radius: 10,
            sides: 3,
        });

        polygon.cx = 50;
        polygon.cy = 60;
        polygon.radius = 100;
        polygon.sides = 8;

        expect(polygon.cx).toBe(50);
        expect(polygon.cy).toBe(60);
        expect(polygon.radius).toBe(100);
        expect(polygon.sides).toBe(8);
    });

    test('Should clamp sides to minimum of 3', () => {
        const polygon = createPolygon({
            cx: 0,
            cy: 0,
            radius: 10,
            sides: 6,
        });

        polygon.sides = 1;

        expect(polygon.sides).toBe(3);
    });

    test('Should compute bounding box', () => {
        const polygon = createPolygon({
            cx: 100,
            cy: 100,
            radius: 50,
            sides: 4,
        });

        const box = polygon.getBoundingBox();

        expect(box.top).toBe(50);
        expect(box.left).toBe(50);
        expect(box.bottom).toBe(150);
        expect(box.right).toBe(150);
    });

});

describe('elementIsPolygon', () => {

    test('Should return true for Polygon instances', () => {
        const polygon = createPolygon({
            cx: 0,
            cy: 0,
            radius: 10,
            sides: 3,
        });

        expect(elementIsPolygon(polygon)).toBe(true);
    });

    test('Should return false for non-Polygon values', () => {
        expect(elementIsPolygon({})).toBe(false);
        expect(elementIsPolygon(null)).toBe(false);
    });

});
