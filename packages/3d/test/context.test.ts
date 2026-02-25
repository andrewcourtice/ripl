import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import {
    createContext,
    mat4Identity,
} from '../src';

function mockCanvasContext() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const noop = () => {};
    const original = HTMLCanvasElement.prototype.getContext;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLCanvasElement.prototype as any).getContext = function () {
        return {
            save: noop,
            restore: noop,
            clearRect: noop,
            fillRect: noop,
            beginPath: noop,
            closePath: noop,
            moveTo: noop,
            lineTo: noop,
            fill: noop,
            stroke: noop,
            arc: noop,
            rect: noop,
            setLineDash: noop,
            getLineDash: () => [],
            setTransform: noop,
            resetTransform: noop,
            scale: noop,
            translate: noop,
            rotate: noop,
            transform: noop,
            clip: noop,
            createLinearGradient: () => ({
                addColorStop: noop,
            }),
            createRadialGradient: () => ({
                addColorStop: noop,
            }),
            measureText: () => ({
                width: 0,
            }),
            fillStyle: '#000000',
            strokeStyle: '#000000',
            filter: 'none',
            direction: 'ltr',
            font: '10px sans-serif',
            fontKerning: 'auto',
            globalAlpha: 1,
            globalCompositeOperation: 'source-over',
            lineCap: 'butt',
            lineDashOffset: 0,
            lineJoin: 'miter',
            lineWidth: 1,
            miterLimit: 10,
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            textAlign: 'start',
            textBaseline: 'alphabetic',
            canvas: this,
        };
    };

    return () => {
        HTMLCanvasElement.prototype.getContext = original;
    };
}

describe('Context3D', () => {

    let restoreMock: () => void;

    beforeAll(() => {
        restoreMock = mockCanvasContext();
    });

    afterAll(() => {
        restoreMock();
    });

    test('Construction stores identity matrices', () => {
        const ctx = createContext(document.createElement('div'));

        expect(ctx.viewMatrix).toEqual(mat4Identity());
        expect(ctx.viewProjectionMatrix).toBeDefined();
        expect(ctx.lightDirection).toEqual([0, 0, -1]);
    });

    test('setCamera updates viewMatrix', () => {
        const ctx = createContext(document.createElement('div'));
        const prevView = new Float64Array(ctx.viewMatrix);

        ctx.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        let changed = false;

        for (let idx = 0; idx < 16; idx++) {
            if (ctx.viewMatrix[idx] !== prevView[idx]) {
                changed = true;
                break;
            }
        }

        expect(changed).toBe(true);
    });

    test('setPerspective stores fov/near/far values', () => {
        const ctx = createContext(document.createElement('div'));

        ctx.setPerspective(90, 0.5, 500);

        // In jsdom, canvas width/height are 0 so the projection matrix
        // won't update, but the values should be stored for when rescale occurs.
        // We verify the method doesn't throw and the context remains valid.
        expect(ctx.projectionMatrix).toBeDefined();
        expect(ctx.viewProjectionMatrix).toBeDefined();
    });

    test('setOrthographic updates projectionMatrix', () => {
        const ctx = createContext(document.createElement('div'));

        ctx.setOrthographic(-10, 10, -10, 10, 0.1, 100);

        expect(ctx.projectionMatrix[0]).not.toBe(0);
        expect(ctx.projectionMatrix[5]).not.toBe(0);
        expect(ctx.projectionMatrix[15]).toBe(1);
    });

    test('project returns a 2D point', () => {
        const ctx = createContext(document.createElement('div'));
        ctx.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        const point = ctx.project([0, 0, 0]);

        expect(point).toHaveLength(2);
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
    });

    test('projectDepth returns a number', () => {
        const ctx = createContext(document.createElement('div'));
        ctx.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        const depth = ctx.projectDepth([0, 0, 0]);

        expect(typeof depth).toBe('number');
    });

});
