import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    createCircle,
    createGroup,
} from '../../src';

describe('World transform & bounding box caching', () => {

    it('Should return the same cached matrix for a static chain', () => {
        const group = createGroup({
            translateX: 10,
        });

        const circle = createCircle({
            cx: 0,
            cy: 0,
            radius: 5,
        });

        group.add(circle);

        const first = circle.getWorldTransform();
        const second = circle.getWorldTransform();

        expect(first).not.toBeNull();
        expect(second).toBe(first);
    });

    it('Should recompute when the element itself changes', () => {
        const group = createGroup({
            translateX: 10,
        });

        const circle = createCircle({
            cx: 0,
            cy: 0,
            radius: 5,
        });

        group.add(circle);

        const before = circle.getBoundingBox();

        circle.translateX = 5;

        const after = circle.getBoundingBox();

        expect(before.left).toBe(5);
        expect(after.left).toBe(10);
    });

    it('Should recompute when an ancestor changes', () => {
        const group = createGroup({
            translateX: 10,
        });

        const circle = createCircle({
            cx: 0,
            cy: 0,
            radius: 5,
        });

        group.add(circle);

        expect(circle.getBoundingBox().left).toBe(5);

        group.translateX = 20;

        expect(circle.getBoundingBox().left).toBe(15);
    });

    it('Should recompute when the element is reparented', () => {
        const groupA = createGroup({
            translateX: 10,
        });

        const groupB = createGroup({
            translateX: 50,
        });

        const circle = createCircle({
            cx: 0,
            cy: 0,
            radius: 5,
        });

        groupA.add(circle);

        expect(circle.getBoundingBox().left).toBe(5);

        groupA.remove(circle);
        groupB.add(circle);

        expect(circle.getBoundingBox().left).toBe(45);
    });

    it('Should not corrupt the cache when a returned box is mutated', () => {
        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
        });

        const first = circle.getBoundingBox();

        first.left = -999;
        first.top = -999;

        const second = circle.getBoundingBox();

        expect(second.left).toBe(5);
        expect(second.top).toBe(5);
    });

    it('Should follow child geometry through a group with a percentage transform origin', () => {
        const group = createGroup({
            rotation: Math.PI,
            transformOriginX: '50%',
            transformOriginY: '50%',
        });

        const circleA = createCircle({
            cx: 10,
            cy: 0,
            radius: 10,
        });

        const circleB = createCircle({
            cx: 30,
            cy: 0,
            radius: 10,
        });

        group.add(circleA);
        group.add(circleB);

        // Composite box spans x [0..40] — origin x resolves to 20, so A (center 10) maps to 30.
        const before = circleA.getBoundingBox();

        expect((before.left + before.right) / 2).toBeCloseTo(30);

        // Moving B stretches the composite box to x [0..60] — origin x becomes 30, A maps to 50.
        circleB.cx = 50;

        const after = circleA.getBoundingBox();

        expect((after.left + after.right) / 2).toBeCloseTo(50);
    });

});
