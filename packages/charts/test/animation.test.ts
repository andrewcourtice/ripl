import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    ANIMATION_REFERENCE,
    resolveAnimation,
    stagger,
} from '../src/core/animation';

describe('resolveAnimation', () => {
    it('scales the reference duration by the configured speed', () => {
        const resolved = resolveAnimation({ enabled: true, duration: 500, ease: 'easeLinear' }, 1000);
        expect(resolved.duration).toBe(500);
        expect(resolved.enabled).toBe(true);
    });

    it('collapses to zero duration when disabled', () => {
        const resolved = resolveAnimation({ enabled: false, duration: 1000, ease: 'easeLinear' }, ANIMATION_REFERENCE.enter);
        expect(resolved.enabled).toBe(false);
        expect(resolved.duration).toBe(0);
    });

    it('resolves the easing function', () => {
        const resolved = resolveAnimation({ enabled: true, duration: 1000, ease: 'easeLinear' });
        expect(typeof resolved.ease).toBe('function');
    });
});

describe('stagger', () => {
    it('returns 0 for a single element', () => {
        expect(stagger(0, 1, 1000)).toBe(0);
    });

    it('returns 0 when there is no duration', () => {
        expect(stagger(2, 10, 0)).toBe(0);
    });

    it('spreads delays across the collection', () => {
        expect(stagger(0, 4, 1000)).toBe(0);
        expect(stagger(2, 4, 1000)).toBe(500);
    });

    it('applies a fraction to compress the stagger window', () => {
        expect(stagger(2, 4, 1000, 0.5)).toBe(250);
    });
});
