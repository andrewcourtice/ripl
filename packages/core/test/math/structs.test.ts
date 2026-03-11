import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    Box,
} from '../../src';

describe('Box', () => {

    test('Should store top, left, bottom, right', () => {
        const box = new Box(10, 20, 110, 220);
        expect(box.top).toBe(10);
        expect(box.left).toBe(20);
        expect(box.bottom).toBe(110);
        expect(box.right).toBe(220);
    });

    test('Should compute width', () => {
        const box = new Box(0, 10, 100, 60);
        expect(box.width).toBe(50);
    });

    test('Should compute height', () => {
        const box = new Box(10, 0, 110, 100);
        expect(box.height).toBe(100);
    });

    test('Should handle zero-size box', () => {
        const box = new Box(5, 5, 5, 5);
        expect(box.width).toBe(0);
        expect(box.height).toBe(0);
    });

    test('Box.empty() should return a zero-origin zero-size box', () => {
        const box = Box.empty();
        expect(box.top).toBe(0);
        expect(box.left).toBe(0);
        expect(box.bottom).toBe(0);
        expect(box.right).toBe(0);
        expect(box.width).toBe(0);
        expect(box.height).toBe(0);
    });

});
