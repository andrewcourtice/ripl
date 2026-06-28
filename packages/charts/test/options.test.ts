import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    easeLinear,
    easeOutCubic,
} from '@ripl/core';

import {
    normalizeAnimation,
    normalizeLegend,
    normalizePadding,
    normalizeTitle,
    resolveEase,
    resolveFormatLabel,
} from '../src/core/options';

describe('normalizeTitle', () => {
    it('returns undefined when no input', () => {
        expect(normalizeTitle()).toBeUndefined();
    });

    it('wraps a string into title options', () => {
        const title = normalizeTitle('Sales');
        expect(title).toMatchObject({
            text: 'Sales',
            visible: true,
            position: 'top',
        });
    });

    it('merges partial options over defaults', () => {
        const title = normalizeTitle({
            text: 'Revenue',
            position: 'left',
            fontColor: '#f00',
        });
        expect(title).toMatchObject({
            text: 'Revenue',
            position: 'left',
            fontColor: '#f00',
        });
    });
});

describe('normalizeLegend', () => {
    it('defaults to hidden when no input', () => {
        expect(normalizeLegend().visible).toBe(false);
    });

    it('treats a boolean as a visibility toggle', () => {
        expect(normalizeLegend(true).visible).toBe(true);
        expect(normalizeLegend(false).visible).toBe(false);
    });

    it('treats a string as a position', () => {
        const legend = normalizeLegend('right');
        expect(legend.position).toBe('right');
        expect(legend.visible).toBe(true);
    });

    it('merges a partial options object', () => {
        const legend = normalizeLegend({
            position: 'bottom',
            highlight: false,
        });
        expect(legend).toMatchObject({
            position: 'bottom',
            highlight: false,
            visible: true,
        });
    });
});

describe('normalizeAnimation', () => {
    it('defaults to enabled with 1000ms', () => {
        expect(normalizeAnimation()).toMatchObject({
            enabled: true,
            duration: 1000,
        });
    });

    it('treats a boolean as an enabled toggle', () => {
        expect(normalizeAnimation(false).enabled).toBe(false);
    });

    it('merges partial options', () => {
        expect(normalizeAnimation({ duration: 500 })).toMatchObject({
            enabled: true,
            duration: 500,
        });
    });
});

describe('normalizePadding', () => {
    it('expands a number to all sides', () => {
        expect(normalizePadding(8)).toEqual({
            top: 8,
            right: 8,
            bottom: 8,
            left: 8,
        });
    });

    it('maps a tuple to sides', () => {
        expect(normalizePadding([1, 2, 3, 4])).toEqual({
            top: 1,
            right: 2,
            bottom: 3,
            left: 4,
        });
    });
});

describe('resolveEase', () => {
    it('defaults to easeOutCubic', () => {
        expect(resolveEase()).toBe(easeOutCubic);
    });

    it('resolves a named ease', () => {
        expect(resolveEase('easeLinear')).toBe(easeLinear);
    });

    it('passes through a function', () => {
        expect(resolveEase(easeLinear)).toBe(easeLinear);
    });
});

describe('resolveFormatLabel', () => {
    it('formats percentages', () => {
        expect(resolveFormatLabel('percentage')!(0.25)).toBe('25.0%');
    });

    it('passes through a custom formatter', () => {
        const fn = (v: number) => `$${v}`;
        expect(resolveFormatLabel(fn)).toBe(fn);
    });
});
