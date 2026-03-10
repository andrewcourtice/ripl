import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createText,
    elementIsText,
} from '../../src';

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

        // getBoundingBox requires a canvas context for measureText;
        // verify the method exists (full integration tested with canvas)
        expect(typeof text.getBoundingBox).toBe('function');
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
