import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createGroup,
    createRect,
} from '../../src';

describe('Own-only state cascade', () => {

    test('a property getter returns the element\'s own value, not an inherited one', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });
        const group = createGroup({ children: [rect] });
        group.fill = '#ff0000';

        // Inheritance now happens through the render tree (the group applies its paint at its
        // boundary), so the getter itself is own-only.
        expect(rect.fill).toBeUndefined();
        expect(group.fill).toBe('#ff0000');
    });

    test('opacity is own-only (composited at the group boundary, not inherited as a value)', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });
        const group = createGroup({ children: [rect] });
        group.opacity = 0.5;

        expect(rect.opacity).toBeUndefined();
        expect(group.opacity).toBe(0.5);
    });

});

describe('Transform-aware bounding boxes', () => {

    test('getBoundingBox equals the local box when there is no transform', () => {
        const rect = createRect({
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        });

        const local = rect.getBoundingBox(true);
        const world = rect.getBoundingBox();

        expect([local.left, local.top, local.right, local.bottom]).toEqual([10, 20, 40, 60]);
        expect([world.left, world.top, world.right, world.bottom]).toEqual([10, 20, 40, 60]);
    });

    test('getBoundingBox reflects the element\'s own translation; getBoundingBox(true) stays raw', () => {
        const rect = createRect({
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        });
        rect.translateX = 100;
        rect.translateY = 5;

        expect(rect.getBoundingBox(true).left).toBe(10);
        expect(rect.getBoundingBox().left).toBe(110);
        expect(rect.getBoundingBox().top).toBe(25);
    });

    test('getBoundingBox reflects an ancestor group\'s transform', () => {
        const rect = createRect({
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        });
        const group = createGroup({ children: [rect] });
        group.translateX = 50;
        group.transformScaleX = 2;

        // Group scales x by 2 (about origin) then the rect sits at x=10 → 20, plus the group's +50.
        const world = rect.getBoundingBox();
        expect(world.left).toBe(70);
        expect(world.right).toBe(130);
        // Local is untouched by ancestor transforms.
        expect(rect.getBoundingBox(true).left).toBe(10);
        // The group's own local box unions the children's untransformed geometry.
        expect(group.getBoundingBox(true).left).toBe(10);
    });

    test('a group\'s bounding box encloses its children on screen', () => {
        const rect = createRect({
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        });
        const group = createGroup({ children: [rect] });
        group.translateX = 100;

        expect(group.getBoundingBox().left).toBe(110);
    });

    test('getBoundingBox reflects the element\'s own rotation about a numeric origin', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 40,
            height: 10,
        });
        rect.rotation = Math.PI / 2;
        rect.transformOriginX = 0;
        rect.transformOriginY = 0;

        const world = rect.getBoundingBox();

        // A quarter turn about (0, 0) maps (x, y) -> (-y, x), so the 40x10 box becomes 10x40.
        expect(world.width).toBeCloseTo(10);
        expect(world.height).toBeCloseTo(40);
        expect(world.left).toBeCloseTo(-10);
        expect(world.top).toBeCloseTo(0);
        // Local geometry is untouched.
        expect(rect.getBoundingBox(true).width).toBe(40);
    });

    test('getBoundingBox rotates about a percentage origin resolved from local geometry', () => {
        const rect = createRect({
            x: 100,
            y: 100,
            width: 40,
            height: 10,
        });
        rect.rotation = Math.PI / 2;
        rect.transformOriginX = '50%';
        rect.transformOriginY = '50%';

        const world = rect.getBoundingBox();

        // Rotating about its own center swaps the extents and holds the center in place.
        expect(world.width).toBeCloseTo(10);
        expect(world.height).toBeCloseTo(40);
        expect((world.left + world.right) / 2).toBeCloseTo(120);
        expect((world.top + world.bottom) / 2).toBeCloseTo(105);
    });

    test('getBoundingBox composes a rotated child with an ancestor group translation', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 40,
            height: 10,
        });
        rect.rotation = Math.PI / 2;
        rect.transformOriginX = 0;
        rect.transformOriginY = 0;

        const group = createGroup({ children: [rect] });
        group.translateX = 100;
        group.translateY = 50;

        const world = rect.getBoundingBox();

        expect(world.left).toBeCloseTo(90);
        expect(world.top).toBeCloseTo(50);
        expect(world.width).toBeCloseTo(10);
        expect(world.height).toBeCloseTo(40);
    });

    test('a rotated element yields a conservative box that encloses its unrotated size', () => {
        const rect = createRect({
            x: -10,
            y: -10,
            width: 20,
            height: 20,
        });
        rect.rotation = Math.PI / 4;
        rect.transformOriginX = 0;
        rect.transformOriginY = 0;

        const world = rect.getBoundingBox();

        expect(world.width).toBeGreaterThan(20);
        expect(world.width).toBeCloseTo(Math.sqrt(800));
    });

});
