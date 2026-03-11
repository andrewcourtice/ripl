import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    CONTEXT_OPERATIONS,
    TRANSFORM_DEFAULTS,
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
