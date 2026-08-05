import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    mockCanvasState,
} from '../src';

describe('mockCanvasState', () => {

    function create() {
        const stub = mockCanvasState(mockCanvasContext());

        vi.restoreAllMocks();

        return stub;
    }

    test('Should push and pop the drawing state', () => {
        const stub = create();

        stub.fillStyle = '#ff0000';
        stub.save();
        stub.fillStyle = '#0000ff';
        stub.restore();

        expect(stub.fillStyle).toBe('#ff0000');
    });

    test('Should report the outstanding save depth', () => {
        const stub = create();

        expect(stub.getSaveDepth()).toBe(0);

        stub.save();
        stub.save();

        expect(stub.getSaveDepth()).toBe(2);

        stub.restore();

        expect(stub.getSaveDepth()).toBe(1);
    });

    test('Should start at the identity matrix', () => {
        expect(create().getMatrix()).toEqual([1, 0, 0, 1, 0, 0]);
    });

    test('Should compose translate and scale in call order', () => {
        const stub = create();

        stub.translate(10, 20);
        stub.scale(2, 3);

        expect(stub.getMatrix()).toEqual([2, 0, 0, 3, 10, 20]);
    });

    test('Should compose a rotation', () => {
        const stub = create();

        stub.rotate(Math.PI / 2);

        const [
            scaleX,
            skewY,
            skewX,
            scaleY,
        ] = stub.getMatrix();

        expect(scaleX).toBeCloseTo(0);
        expect(skewY).toBeCloseTo(1);
        expect(skewX).toBeCloseTo(-1);
        expect(scaleY).toBeCloseTo(0);
    });

    test('Should post-multiply an explicit transform', () => {
        const stub = create();

        stub.scale(2, 2);
        stub.transform(1, 0, 0, 1, 5, 5);

        expect(stub.getMatrix()).toEqual([2, 0, 0, 2, 10, 10]);
    });

    test('Should replace the matrix on setTransform', () => {
        const stub = create();

        stub.translate(100, 100);
        stub.setTransform(2, 0, 0, 2, 0, 0);

        expect(stub.getMatrix()).toEqual([2, 0, 0, 2, 0, 0]);
    });

    test('Should return to the identity matrix on resetTransform', () => {
        const stub = create();

        stub.translate(100, 100);
        stub.resetTransform();

        expect(stub.getMatrix()).toEqual([1, 0, 0, 1, 0, 0]);
    });

    test('Should restore the matrix alongside the drawing state', () => {
        const stub = create();

        stub.translate(10, 0);
        stub.save();
        stub.translate(90, 0);

        expect(stub.getMatrix()).toEqual([1, 0, 0, 1, 100, 0]);

        stub.restore();

        expect(stub.getMatrix()).toEqual([1, 0, 0, 1, 10, 0]);
    });

});
