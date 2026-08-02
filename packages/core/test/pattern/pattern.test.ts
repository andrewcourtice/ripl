import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    getPatternTileGeometry,
    isPatternString,
    parsePattern,
    parsePatternCached,
    serializePattern,
} from '../../src';

describe('Pattern parsing', () => {

    it('Should parse a full pattern string', () => {
        expect(parsePattern('pattern(diagonal, #1a6, #fff0, 8)')).toEqual({
            type: 'diagonal',
            foreground: '#1a6',
            background: '#fff0',
            size: 8,
        });
    });

    it('Should apply defaults for omitted arguments', () => {
        expect(parsePattern('pattern(dots)')).toEqual({
            type: 'dots',
            foreground: '#000000',
            background: 'transparent',
            size: 8,
        });
    });

    it('Should accept a px suffix on the size', () => {
        expect(parsePattern('pattern(vertical, red, white, 12px)')?.size).toBe(12);
    });

    it('Should reject invalid inputs', () => {
        expect(parsePattern('pattern(zigzag, red)')).toBeNull();
        expect(parsePattern('pattern()')).toBeNull();
        expect(parsePattern('pattern(dots, red, white, -4)')).toBeNull();
        expect(parsePattern('linear-gradient(90deg, red, blue)')).toBeNull();
        expect(parsePattern('red')).toBeNull();
    });

    it('Should round-trip through the serializer', () => {
        const source = 'pattern(cross-hatch, #336699, #ffffff, 10)';
        const parsed = parsePattern(source);

        expect(parsed).not.toBeNull();
        expect(serializePattern(parsed!)).toBe(source);
        expect(parsePattern(serializePattern(parsed!))).toEqual(parsed);
    });

    it('Should identify pattern strings with the cheap guard', () => {
        expect(isPatternString('pattern(diagonal)')).toBe(true);
        expect(isPatternString(' pattern(dots, red) ')).toBe(true);
        expect(isPatternString('linear-gradient(90deg, red, blue)')).toBe(false);
        expect(isPatternString('#ff0000')).toBe(false);
    });

});

describe('Pattern tile geometry', () => {

    it('Should build three seamless lines for the diagonal motif', () => {
        const geometry = getPatternTileGeometry(parsePattern('pattern(diagonal, red, transparent, 8)')!);

        expect(geometry.size).toBe(8);
        expect(geometry.shapes).toHaveLength(3);
        expect(geometry.shapes.every(shape => shape.kind === 'line')).toBe(true);
    });

    it('Should build one centered dot for the dots motif', () => {
        const geometry = getPatternTileGeometry(parsePattern('pattern(dots, red, transparent, 12)')!);

        expect(geometry.shapes).toEqual([{
            kind: 'dot',
            cx: 6,
            cy: 6,
            radius: 2,
        }]);
    });

    it('Should build crossing center lines for the cross-hatch motif', () => {
        const geometry = getPatternTileGeometry(parsePattern('pattern(cross-hatch)')!);

        expect(geometry.shapes).toHaveLength(2);
    });

});

describe('parsePatternCached', () => {

    it('Should parse identically to parsePattern', () => {
        const value = 'pattern(diagonal, #1a6, #fff0, 8)';

        expect(parsePatternCached(value)).toEqual(parsePattern(value));
    });

    it('Should return a reference-identical result for the same string', () => {
        const value = 'pattern(dots, red, transparent, 12)';

        expect(parsePatternCached(value)).toBe(parsePatternCached(value));
    });

    it('Should memoize an invalid pattern string as null', () => {
        expect(parsePatternCached('not-a-pattern')).toBeNull();
        expect(parsePatternCached('not-a-pattern')).toBeNull();
    });

    // A wipe-at-threshold cache would drop the hot entry here; the bounded LRU keeps it.
    it('Should retain a recently used entry after the limit is exceeded', () => {
        const hot = 'pattern(cross-hatch, #123456, transparent, 9)';
        const first = parsePatternCached(hot);

        for (let i = 1; i <= 300; i++) {
            parsePatternCached(`pattern(dots, red, transparent, ${i})`);
            parsePatternCached(hot);
        }

        expect(parsePatternCached(hot)).toBe(first);
    });

});
