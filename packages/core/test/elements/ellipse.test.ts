import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createEllipse,
    elementIsEllipse,
} from '../../src';

describe('Ellipse', () => {

    test('Should create with state', () => {
        const ellipse = createEllipse({
            cx: 100,
            cy: 200,
            radiusX: 50,
            radiusY: 30,
            rotation: 0,
            startAngle: 0,
            endAngle: Math.PI * 2,
        });

        expect(ellipse.cx).toBe(100);
        expect(ellipse.cy).toBe(200);
        expect(ellipse.radiusX).toBe(50);
        expect(ellipse.radiusY).toBe(30);
        expect(ellipse.rotation).toBe(0);
        expect(ellipse.startAngle).toBe(0);
        expect(ellipse.endAngle).toBe(Math.PI * 2);
        expect(ellipse.type).toBe('ellipse');
    });

    test('Should update state via setters', () => {
        const ellipse = createEllipse({
            cx: 0,
            cy: 0,
            radiusX: 10,
            radiusY: 10,
            rotation: 0,
            startAngle: 0,
            endAngle: Math.PI,
        });

        ellipse.cx = 50;
        ellipse.cy = 60;
        ellipse.radiusX = 80;
        ellipse.radiusY = 40;
        ellipse.rotation = 1;
        ellipse.startAngle = 0.5;
        ellipse.endAngle = 3;

        expect(ellipse.cx).toBe(50);
        expect(ellipse.cy).toBe(60);
        expect(ellipse.radiusX).toBe(80);
        expect(ellipse.radiusY).toBe(40);
        expect(ellipse.rotation).toBe(1);
        expect(ellipse.startAngle).toBe(0.5);
        expect(ellipse.endAngle).toBe(3);
    });

    test('Should compute bounding box', () => {
        const ellipse = createEllipse({
            cx: 100,
            cy: 100,
            radiusX: 50,
            radiusY: 30,
            rotation: 0,
            startAngle: 0,
            endAngle: Math.PI * 2,
        });

        const box = ellipse.getBoundingBox();

        expect(box.top).toBe(70);
        expect(box.left).toBe(50);
        expect(box.bottom).toBe(130);
        expect(box.right).toBe(150);
    });

});

describe('elementIsEllipse', () => {

    test('Should return true for Ellipse instances', () => {
        const ellipse = createEllipse({
            cx: 0,
            cy: 0,
            radiusX: 10,
            radiusY: 10,
            rotation: 0,
            startAngle: 0,
            endAngle: Math.PI * 2,
        });

        expect(elementIsEllipse(ellipse)).toBe(true);
    });

    test('Should return false for non-Ellipse values', () => {
        expect(elementIsEllipse({})).toBe(false);
        expect(elementIsEllipse(null)).toBe(false);
    });

});
