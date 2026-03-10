import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createArc,
    elementIsArc,
} from '../../src';

describe('Arc', () => {

    test('Should create with state', () => {
        const arc = createArc({
            cx: 100,
            cy: 100,
            startAngle: 0,
            endAngle: Math.PI,
            radius: 50,
        });

        expect(arc.cx).toBe(100);
        expect(arc.cy).toBe(100);
        expect(arc.startAngle).toBe(0);
        expect(arc.endAngle).toBe(Math.PI);
        expect(arc.radius).toBe(50);
        expect(arc.type).toBe('arc');
    });

    test('Should update state via setters', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: 1,
            radius: 10,
        });

        arc.cx = 50;
        arc.cy = 60;
        arc.startAngle = 0.5;
        arc.endAngle = 2;
        arc.radius = 100;
        arc.innerRadius = 20;
        arc.padAngle = 0.1;

        expect(arc.cx).toBe(50);
        expect(arc.cy).toBe(60);
        expect(arc.startAngle).toBe(0.5);
        expect(arc.endAngle).toBe(2);
        expect(arc.radius).toBe(100);
        expect(arc.innerRadius).toBe(20);
        expect(arc.padAngle).toBe(0.1);
    });

    test('Should compute bounding box without innerRadius', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI / 2,
            radius: 100,
        });

        const box = arc.getBoundingBox();

        expect(box).toBeDefined();
        expect(box.top).toBeLessThanOrEqual(box.bottom);
        expect(box.left).toBeLessThanOrEqual(box.right);
    });

    test('Should compute bounding box with innerRadius', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI / 2,
            radius: 100,
            innerRadius: 50,
        });

        const box = arc.getBoundingBox();

        expect(box).toBeDefined();
        expect(box.top).toBeLessThanOrEqual(box.bottom);
        expect(box.left).toBeLessThanOrEqual(box.right);
    });

    test('Should compute centroid', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI,
            radius: 100,
        });

        const [cx, cy] = arc.getCentroid();

        expect(typeof cx).toBe('number');
        expect(typeof cy).toBe('number');
    });

    test('Should compute centroid with alterations', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI,
            radius: 100,
        });

        const [cx1] = arc.getCentroid();
        const [cx2] = arc.getCentroid({ radius: 200 });

        expect(cx2).not.toBe(cx1);
    });

    test('Should support borderRadius property', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI,
            radius: 50,
            borderRadius: 5,
        });

        expect(arc.borderRadius).toBe(5);
    });

});

describe('elementIsArc', () => {

    test('Should return true for Arc instances', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: 1,
            radius: 10,
        });

        expect(elementIsArc(arc)).toBe(true);
    });

    test('Should return false for non-Arc values', () => {
        expect(elementIsArc({})).toBe(false);
        expect(elementIsArc(null)).toBe(false);
    });

});
