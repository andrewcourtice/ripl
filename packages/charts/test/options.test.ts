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
    formatNumber,
    normalizeAnimation,
    normalizeDataLabels,
    normalizeLegend,
    normalizePadding,
    normalizeSegmentLabels,
    normalizeTitle,
    resolveEase,
    resolveFormatLabel,
    resolveValueFormat,
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
    it('formats percentages, capping at 2 decimals', () => {
        expect(resolveFormatLabel('percentage')!(0.25)).toBe('25%');
        expect(resolveFormatLabel('percentage')!(0.12345)).toBe('12.35%');
    });

    it('formats numbers with the 2-decimal precision cap', () => {
        expect(resolveFormatLabel('number')!(3.14159)).toBe('3.14');
        expect(resolveFormatLabel('number')!(1000)).toBe((1000).toLocaleString());
    });

    it('passes through a custom formatter', () => {
        const fn = (v: number) => `$${v}`;
        expect(resolveFormatLabel(fn)).toBe(fn);
    });
});

describe('formatNumber', () => {
    it('caps at 2 decimals by default and strips trailing zeros', () => {
        expect(formatNumber(3.14159)).toBe('3.14');
        expect(formatNumber(5)).toBe('5');
        expect(formatNumber(5.5)).toBe('5.5');
    });

    it('respects a custom precision', () => {
        expect(formatNumber(3.14159, 3)).toBe('3.142');
    });

    it('stringifies non-numeric values', () => {
        expect(formatNumber('abc')).toBe('abc');
    });
});

describe('normalizeSegmentLabels', () => {
    it('is hidden by default', () => {
        expect(normalizeSegmentLabels()).toMatchObject({ visible: false, position: 'inside' });
    });

    it('enables labels from a boolean', () => {
        expect(normalizeSegmentLabels(true)).toMatchObject({ visible: true, position: 'inside' });
        expect(normalizeSegmentLabels(false).visible).toBe(false);
    });

    it('enables labels and sets position from a string', () => {
        expect(normalizeSegmentLabels('outside')).toMatchObject({ visible: true, position: 'outside' });
    });

    it('merges a partial options object and enables labels', () => {
        expect(normalizeSegmentLabels({ position: 'outside', fontColor: '#111' })).toMatchObject({
            visible: true,
            position: 'outside',
            fontColor: '#111',
        });
    });
});

describe('normalizeTitle defaults', () => {
    it('renders the title bold with extra padding', () => {
        const title = normalizeTitle('Sales');
        expect(title).toMatchObject({
            font: 'bold 16px sans-serif',
            padding: 16,
        });
    });
});

describe('resolveValueFormat', () => {
    it('falls back to String when no format is given', () => {
        expect(resolveValueFormat()(42)).toBe('42');
    });

    it('applies a built-in format type', () => {
        expect(resolveValueFormat('percentage')(0.5)).toBe('50%');
    });

    it('caps untyped numeric values at 2 decimals', () => {
        expect(resolveValueFormat()(3.14159)).toBe('3.14');
    });

    it('uses a custom formatter', () => {
        expect(resolveValueFormat((v: number) => `$${v}`)(5)).toBe('$5');
    });
});

describe('normalizeDataLabels', () => {
    it('is hidden by default', () => {
        expect(normalizeDataLabels()).toMatchObject({
            visible: false,
            anchor: 'top',
        });
    });

    it('treats a boolean as a visibility toggle', () => {
        expect(normalizeDataLabels(true)).toMatchObject({ visible: true });
        expect(normalizeDataLabels(false)).toMatchObject({ visible: false });
    });

    it('treats an anchor string as visible with that anchor', () => {
        expect(normalizeDataLabels('bottom')).toMatchObject({
            visible: true,
            anchor: 'bottom',
        });
    });

    it('honours a default anchor', () => {
        expect(normalizeDataLabels(true, { anchor: 'right' })).toMatchObject({
            visible: true,
            anchor: 'right',
        });
    });

    it('merges a partial options object and makes it visible', () => {
        expect(normalizeDataLabels({ anchor: 'left', fontColor: '#111' })).toMatchObject({
            visible: true,
            anchor: 'left',
            fontColor: '#111',
        });
    });
});
