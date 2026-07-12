import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import type {
    Mock,
} from 'vitest';

import {
    createText,
    elementIsText,
    factory,
} from '../../src';

import type {
    MeasureTextOptions,
} from '../../src';

/** Emulates a real canvas's anchor-relative `actualBoundingBox*` metrics for a fixed 10px/char font. */
function fakeMeasureText(text: string, options?: MeasureTextOptions): TextMetrics {
    const width = text.length * 10;
    const height = 12;
    const align = options?.textAlign ?? 'start';
    const baseline = options?.textBaseline ?? 'alphabetic';

    let actualBoundingBoxLeft = 0;
    let actualBoundingBoxRight = width;

    if (align === 'center') {
        actualBoundingBoxLeft = width / 2;
        actualBoundingBoxRight = width / 2;
    } else if (align === 'right' || align === 'end') {
        actualBoundingBoxLeft = width;
        actualBoundingBoxRight = 0;
    }

    let actualBoundingBoxAscent = height;
    let actualBoundingBoxDescent = 0;

    if (baseline === 'middle') {
        actualBoundingBoxAscent = height / 2;
        actualBoundingBoxDescent = height / 2;
    } else if (baseline === 'top') {
        actualBoundingBoxAscent = 0;
        actualBoundingBoxDescent = height;
    }

    return {
        width,
        actualBoundingBoxLeft,
        actualBoundingBoxRight,
        actualBoundingBoxAscent,
        actualBoundingBoxDescent,
    } as TextMetrics;
}

describe('Text', () => {

    test('Should create with state', () => {
        const text = createText({
            x: 10,
            y: 20,
            content: 'Hello',
        });

        expect(text.x).toBe(10);
        expect(text.y).toBe(20);
        expect(text.content).toBe('Hello');
        expect(text.type).toBe('text');
    });

    test('Should update state via setters', () => {
        const text = createText({
            x: 0,
            y: 0,
            content: 'initial',
        });

        text.x = 50;
        text.y = 60;
        text.content = 'updated';

        expect(text.x).toBe(50);
        expect(text.y).toBe(60);
        expect(text.content).toBe('updated');
    });

    test('Should support numeric content', () => {
        const text = createText({
            x: 0,
            y: 0,
            content: 42,
        });

        expect(text.content).toBe(42);
    });

    test('Should support pathData property', () => {
        const text = createText({
            x: 0,
            y: 0,
            content: 'curved',
            pathData: 'M0,0 C10,10 20,10 30,0',
        });

        expect(text.pathData).toBe('M0,0 C10,10 20,10 30,0');
    });

    test('Should support startOffset property', () => {
        const text = createText({
            x: 0,
            y: 0,
            content: 'offset',
            startOffset: 50,
        });

        expect(text.startOffset).toBe(50);
    });

    test('Should have getBoundingBox method', () => {
        const text = createText({
            x: 10,
            y: 20,
            content: 'test',
        });

        expect(typeof text.getBoundingBox).toBe('function');
    });

});

describe('Text getBoundingBox', () => {

    let originalMeasureText: typeof factory.measureText;

    beforeEach(() => {
        originalMeasureText = factory.measureText;
        factory.set({
            measureText: fakeMeasureText,
        });
    });

    afterEach(() => {
        factory.set({
            measureText: originalMeasureText,
        });
    });

    test('Should anchor the box at the position for start/alphabetic text', () => {
        const text = createText({
            x: 100,
            y: 100,
            content: 'ab',
        });

        const box = text.getBoundingBox();

        expect(box.top).toBe(88);
        expect(box.left).toBe(100);
        expect(box.bottom).toBe(100);
        expect(box.right).toBe(120);
    });

    test('Should shift the box for centered/middle text while keeping the same size', () => {
        const text = createText({
            x: 100,
            y: 100,
            content: 'ab',
        });

        text.textAlign = 'center';
        text.textBaseline = 'middle';

        const box = text.getBoundingBox();

        expect(box.right - box.left).toBe(20);
        expect(box.bottom - box.top).toBe(12);
        expect(box.left).toBe(90);
        expect(box.right).toBe(110);
        expect(box.top).toBe(94);
        expect(box.bottom).toBe(106);
    });

    test('Should right-align the box for right/bottom text', () => {
        const text = createText({
            x: 100,
            y: 100,
            content: 'ab',
        });

        text.textAlign = 'right';

        const box = text.getBoundingBox();

        expect(box.left).toBe(80);
        expect(box.right).toBe(100);
    });

});

describe('Text getBoundingBox caching', () => {

    let originalMeasureText: typeof factory.measureText;
    let measureSpy: Mock<(text: string, options?: MeasureTextOptions) => TextMetrics>;

    beforeEach(() => {
        originalMeasureText = factory.measureText;
        measureSpy = vi.fn(fakeMeasureText);
        factory.set({
            measureText: measureSpy,
        });
    });

    afterEach(() => {
        factory.set({
            measureText: originalMeasureText,
        });
    });

    test('Should measure once and reuse the measurement across repeated calls', () => {
        const text = createText({
            x: 10,
            y: 20,
            content: 'hello',
        });

        text.getBoundingBox();
        text.getBoundingBox();
        text.getBoundingBox();

        expect(measureSpy).toHaveBeenCalledTimes(1);
    });

    test('Should reposition the box on x/y change without re-measuring', () => {
        const text = createText({
            x: 0,
            y: 100,
            content: 'ab',
        });

        const before = text.getBoundingBox();
        expect(before.left).toBe(0);
        expect(before.right).toBe(20);

        text.x = 50;
        const after = text.getBoundingBox();

        expect(measureSpy).toHaveBeenCalledTimes(1);
        expect(after.left).toBe(50);
        expect(after.right).toBe(70);
    });

    test('Should re-measure when content, font, or alignment change', () => {
        const text = createText({
            x: 0,
            y: 0,
            content: 'ab',
        });

        text.getBoundingBox();

        text.content = 'abc';
        text.getBoundingBox();

        text.font = '20px serif';
        text.getBoundingBox();

        text.textAlign = 'center';
        text.getBoundingBox();

        expect(measureSpy).toHaveBeenCalledTimes(4);
    });

});

describe('elementIsText', () => {

    test('Should return true for Text instances', () => {
        const text = createText({
            x: 0,
            y: 0,
            content: 'test',
        });

        expect(elementIsText(text)).toBe(true);
    });

    test('Should return false for non-Text values', () => {
        expect(elementIsText({})).toBe(false);
        expect(elementIsText(null)).toBe(false);
    });

});
