import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    Navigator,
    rescaleDomain,
} from '../../src';

describe('Navigator transform', () => {

    test('Should start at the identity transform', () => {
        const navigator = new Navigator();

        expect(navigator.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });
    });

    test('Should pan by a pixel delta and emit pan + change', () => {
        const navigator = new Navigator();
        const onPan = vi.fn();
        const onChange = vi.fn();

        navigator.on('pan', onPan);
        navigator.on('change', onChange);

        navigator.panBy(30, -10);

        expect(navigator.transform.x).toBe(30);
        expect(navigator.transform.y).toBe(-10);
        expect(onPan).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    test('Should pan to an absolute translation', () => {
        const navigator = new Navigator();

        navigator.panBy(30, 30);
        navigator.panTo(-5, 12);

        expect(navigator.transform.x).toBe(-5);
        expect(navigator.transform.y).toBe(12);
    });

    test('Should keep the zoom center fixed', () => {
        const navigator = new Navigator();

        navigator.zoomBy(2, [100, 100]);

        // The content point under screen [100, 100] is unchanged by a centered zoom.
        expect(navigator.invertPoint([100, 100])).toEqual([100, 100]);
        expect(navigator.transform.k).toBe(2);
    });

    test('Should clamp the zoom to the scale extent', () => {
        const navigator = new Navigator({
            scaleExtent: [0.5, 4],
        });

        navigator.zoomBy(100);
        expect(navigator.transform.k).toBe(4);

        navigator.zoomBy(0.0001);
        expect(navigator.transform.k).toBe(0.5);
    });

    test('Should round-trip applyPoint and invertPoint', () => {
        const navigator = new Navigator();

        navigator.setTransform({
            k: 2.5,
            x: 40,
            y: -15,
        });

        expect(navigator.invertPoint(navigator.applyPoint([12, 34]))).toEqual([12, 34]);
    });

    test('Should reset to the identity', () => {
        const navigator = new Navigator();

        navigator.panBy(50, 50);
        navigator.zoomBy(3);

        navigator.reset();

        expect(navigator.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });
    });

});

describe('Navigator framing', () => {

    test('Should center a content point within the viewport', () => {
        const navigator = new Navigator({
            viewport: {
                width: 200,
                height: 100,
            },
        });

        navigator.centerOn([50, 20]);

        // Screen position of the centered content point is the viewport center.
        expect(navigator.applyPoint([50, 20])).toEqual([100, 50]);
    });

    test('Should center content that lies outside the current viewport', () => {
        const navigator = new Navigator({
            viewport: {
                width: 200,
                height: 100,
            },
        });

        // A point far outside the viewport can still be framed.
        navigator.centerOn([5000, -3000]);

        expect(navigator.applyPoint([5000, -3000])).toEqual([100, 50]);
    });

    test('Should fit a bounds box into the viewport', () => {
        const navigator = new Navigator({
            viewport: {
                width: 200,
                height: 200,
            },
        });

        navigator.fitBounds({
            x0: 0,
            y0: 0,
            x1: 100,
            y1: 100,
        });

        // A 100x100 box fits a 200x200 viewport at 2x zoom, centered.
        expect(navigator.transform.k).toBe(2);
        expect(navigator.applyPoint([50, 50])).toEqual([100, 100]);
    });

    test('Should respect padding when fitting bounds', () => {
        const navigator = new Navigator({
            viewport: {
                width: 200,
                height: 200,
            },
        });

        navigator.fitBounds({
            x0: 0,
            y0: 0,
            x1: 100,
            y1: 100,
        }, {
            padding: 20,
        });

        // With 20px padding either side, 160px of viewport fits the 100px box → 1.6x.
        expect(navigator.transform.k).toBeCloseTo(1.6, 5);
    });

});

describe('Navigator brush', () => {

    test('Should normalize the brush extent and emit brush', () => {
        const navigator = new Navigator();
        const onBrush = vi.fn();

        navigator.on('brush', onBrush);

        navigator.setBrush({
            x0: 100,
            y0: 80,
            x1: 20,
            y1: 10,
        });

        expect(navigator.brush).toEqual({
            x0: 20,
            y0: 10,
            x1: 100,
            y1: 80,
        });
        expect(onBrush).toHaveBeenCalledTimes(1);
    });

    test('Should clear the brush and emit brushend', () => {
        const navigator = new Navigator();
        const onEnd = vi.fn();

        navigator.on('brushend', onEnd);
        navigator.setBrush({
            x0: 0,
            y0: 0,
            x1: 10,
            y1: 10,
        });

        navigator.clearBrush();

        expect(navigator.brush).toBeNull();
        expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({
            data: null,
        }));
    });

});

describe('rescaleDomain', () => {

    test('Should invert the transformed range through the scale', () => {
        const identity = {
            inverse: (value: number) => value,
        };

        // 2x zoom centered so screen 0..200 maps back to content 50..150.
        const domain = rescaleDomain(identity, {
            k: 2,
            x: -100,
            y: 0,
        }, [0, 200]);

        expect(domain).toEqual([50, 150]);
    });

});
