import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    Box,
    geometryContainingBox,
} from '../../src';

describe('Math', () => {

    describe('geometryContainingBox', () => {

        test('Should not include the origin for boxes away from it', () => {
            const boxes = [
                new Box(100, 100, 200, 200),
                new Box(150, 150, 260, 260),
            ];

            const result = geometryContainingBox(boxes, box => box);

            expect(result.top).toBe(100);
            expect(result.left).toBe(100);
            expect(result.bottom).toBe(260);
            expect(result.right).toBe(260);
        });

        test('Should contain boxes with negative coordinates', () => {
            const result = geometryContainingBox([new Box(-50, -40, -10, -20)], box => box);

            expect(result.top).toBe(-50);
            expect(result.left).toBe(-40);
            expect(result.bottom).toBe(-10);
            expect(result.right).toBe(-20);
        });

        test('Should return an empty box for no input', () => {
            const result = geometryContainingBox([] as Box[], box => box);

            expect(result.top).toBe(0);
            expect(result.left).toBe(0);
            expect(result.bottom).toBe(0);
            expect(result.right).toBe(0);
        });

    });

});
