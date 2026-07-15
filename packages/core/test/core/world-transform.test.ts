import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createGroup,
    createRect,
    getWorldTransform,
    matrixApplyToPoint,
} from '../../src';

describe('getWorldTransform', () => {

    test('returns null when the element and its ancestors are all identity', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });
        expect(getWorldTransform(rect)).toBeNull();
    });

    test('composes an ancestor group transform with the element\'s own transform', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });
        rect.translateX = 5;

        const group = createGroup({ children: [rect] });
        group.translateX = 10;

        const world = getWorldTransform(rect);

        expect(world).not.toBeNull();
        // Group translate(10) composed with the element's own translate(5).
        expect(matrixApplyToPoint(world!, [0, 0])).toEqual([15, 0]);
    });

    test('composes nested group transforms from the root down', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const inner = createGroup({ children: [rect] });
        inner.translateY = 20;

        const outer = createGroup({ children: [inner] });
        outer.translateX = 100;

        const world = getWorldTransform(rect);

        expect(world).not.toBeNull();
        expect(matrixApplyToPoint(world!, [0, 0])).toEqual([100, 20]);
    });

    test('reflects a group scale about the origin', () => {
        const rect = createRect({
            x: 4,
            y: 6,
            width: 10,
            height: 10,
        });

        const group = createGroup({ children: [rect] });
        group.transformScaleX = 2;
        group.transformScaleY = 3;

        const world = getWorldTransform(rect);

        expect(world).not.toBeNull();
        expect(matrixApplyToPoint(world!, [4, 6])).toEqual([8, 18]);
    });

});
