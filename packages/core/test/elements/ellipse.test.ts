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

    test('Should rotate the bounding box about its center, keeping the center fixed', () => {
        const ellipse = createEllipse({
            cx: 100,
            cy: 100,
            radiusX: 50,
            radiusY: 30,
            rotation: Math.PI / 2,
            startAngle: 0,
            endAngle: Math.PI * 2,
        });

        const box = ellipse.getBoundingBox();

        // A quarter turn swaps the radii, and the center must not drift.
        expect(box.right - box.left).toBeCloseTo(60);
        expect(box.bottom - box.top).toBeCloseTo(100);
        expect((box.left + box.right) / 2).toBeCloseTo(100);
        expect((box.top + box.bottom) / 2).toBeCloseTo(100);
    });

    test('Should honor an explicit transform origin instead of defaulting to the center', () => {
        const ellipse = createEllipse({
            cx: 100,
            cy: 100,
            radiusX: 50,
            radiusY: 30,
            rotation: Math.PI / 2,
            startAngle: 0,
            endAngle: Math.PI * 2,
            transformOriginX: 0,
            transformOriginY: 0,
        });

        // Rotating about the canvas origin moves the ellipse off its authored center.
        expect((ellipse.getBoundingBox().left + ellipse.getBoundingBox().right) / 2).toBeCloseTo(-100);
    });

    test('Should leave the local bounding box unrotated', () => {
        const ellipse = createEllipse({
            cx: 100,
            cy: 100,
            radiusX: 50,
            radiusY: 30,
            rotation: Math.PI / 2,
            startAngle: 0,
            endAngle: Math.PI * 2,
        });

        const local = ellipse.getBoundingBox(true);

        expect(local.right - local.left).toBe(100);
        expect(local.bottom - local.top).toBe(60);
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
