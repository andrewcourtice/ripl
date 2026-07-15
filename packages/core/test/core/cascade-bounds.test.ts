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

        const local = rect.getLocalBoundingBox();
        const world = rect.getBoundingBox();

        expect([local.left, local.top, local.right, local.bottom]).toEqual([10, 20, 40, 60]);
        expect([world.left, world.top, world.right, world.bottom]).toEqual([10, 20, 40, 60]);
    });

    test('getBoundingBox reflects the element\'s own translation; getLocalBoundingBox stays raw', () => {
        const rect = createRect({
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        });
        rect.translateX = 100;
        rect.translateY = 5;

        expect(rect.getLocalBoundingBox().left).toBe(10);
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
        expect(rect.getLocalBoundingBox().left).toBe(10);
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

});
