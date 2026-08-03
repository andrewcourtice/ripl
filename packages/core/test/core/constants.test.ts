import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    CONTEXT_OPERATIONS,
    TRANSFORM_DEFAULTS,
} from '../../src';

import type {
    Context,
} from '../../src';

describe('Core Constants', () => {

    // ── CONTEXT_OPERATIONS ───────────────────────────────────────

    describe('CONTEXT_OPERATIONS', () => {

        test('Should have a setter for each visual state property', () => {
            const expectedKeys = [
                'direction',
                'fill',
                'filter',
                'font',
                'fontKerning',
                'opacity',
                'globalCompositeOperation',
                'lineCap',
                'lineDash',
                'lineDashOffset',
                'lineJoin',
                'lineWidth',
                'miterLimit',
                'shadowBlur',
                'shadowColor',
                'shadowOffsetX',
                'shadowOffsetY',
                'stroke',
                'textAlign',
                'textBaseline',
                'zIndex',
                'translateX',
                'translateY',
                'transformScaleX',
                'transformScaleY',
                'rotation',
                'transformOriginX',
                'transformOriginY',
            ];

            expectedKeys.forEach(key => {
                expect(CONTEXT_OPERATIONS).toHaveProperty(key);
                expect(typeof CONTEXT_OPERATIONS[key as keyof typeof CONTEXT_OPERATIONS]).toBe('function');
            });
        });

        test('Should composite opacity multiplicatively rather than assigning it', () => {
            const context = { opacity: 0.5 } as Context;

            CONTEXT_OPERATIONS.opacity(context, 0.5);

            expect(context.opacity).toBe(0.25);
        });

        test('Should assign non-opacity properties', () => {
            const context = { fill: '#000000' } as Context;

            CONTEXT_OPERATIONS.fill(context, '#ff0000');

            expect(context.fill).toBe('#ff0000');
        });

    });

    // ── TRANSFORM_DEFAULTS ───────────────────────────────────────

    describe('TRANSFORM_DEFAULTS', () => {

        test('Should have correct default values', () => {
            expect(TRANSFORM_DEFAULTS.translateX).toBe(0);
            expect(TRANSFORM_DEFAULTS.translateY).toBe(0);
            expect(TRANSFORM_DEFAULTS.transformScaleX).toBe(1);
            expect(TRANSFORM_DEFAULTS.transformScaleY).toBe(1);
            expect(TRANSFORM_DEFAULTS.rotation).toBe(0);
            expect(TRANSFORM_DEFAULTS.transformOriginX).toBe(0);
            expect(TRANSFORM_DEFAULTS.transformOriginY).toBe(0);
        });

    });

});
