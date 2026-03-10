import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createPath,
    elementIsPath,
} from '../../src';

describe('Path', () => {

    test('Should create with state', () => {
        const path = createPath({
            x: 10,
            y: 20,
            width: 100,
            height: 50,
        });

        expect(path.x).toBe(10);
        expect(path.y).toBe(20);
        expect(path.width).toBe(100);
        expect(path.height).toBe(50);
        expect(path.type).toBe('path');
    });

    test('Should update state via setters', () => {
        const path = createPath({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        path.x = 50;
        path.y = 60;
        path.width = 200;
        path.height = 300;

        expect(path.x).toBe(50);
        expect(path.y).toBe(60);
        expect(path.width).toBe(200);
        expect(path.height).toBe(300);
    });

    test('Should compute bounding box', () => {
        const path = createPath({
            x: 10,
            y: 20,
            width: 100,
            height: 50,
        });

        const box = path.getBoundingBox();

        expect(box.top).toBe(20);
        expect(box.left).toBe(10);
        expect(box.bottom).toBe(70);
        expect(box.right).toBe(110);
    });

    test('Should compute bounding box with zero dimensions', () => {
        const path = createPath({
            x: 10,
            y: 20,
            width: 0,
            height: 0,
        });

        const box = path.getBoundingBox();

        expect(box.top).toBe(20);
        expect(box.left).toBe(10);
        expect(box.bottom).toBe(20);
        expect(box.right).toBe(10);
    });

    test('Should accept pathRenderer in constructor', () => {
        const renderer = vi.fn();

        const path = createPath({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            pathRenderer: renderer,
        });

        expect(path).toBeDefined();
    });

    test('Should allow setting pathRenderer via setPathRenderer', () => {
        const path = createPath({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const renderer = vi.fn();
        path.setPathRenderer(renderer);

        expect(path).toBeDefined();
    });

});

describe('elementIsPath', () => {

    test('Should return true for Path instances', () => {
        const path = createPath({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        expect(elementIsPath(path)).toBe(true);
    });

    test('Should return false for non-Path values', () => {
        expect(elementIsPath({})).toBe(false);
        expect(elementIsPath(null)).toBe(false);
    });

});
