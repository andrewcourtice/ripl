import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    getPatternTileGeometry,
    isPatternString,
    parsePattern,
    serialisePattern,
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

    it('Should round-trip through the serialiser', () => {
        const source = 'pattern(cross-hatch, #336699, #ffffff, 10)';
        const parsed = parsePattern(source);

        expect(parsed).not.toBeNull();
        expect(serialisePattern(parsed!)).toBe(source);
        expect(parsePattern(serialisePattern(parsed!))).toEqual(parsed);
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

    it('Should build one centred dot for the dots motif', () => {
        const geometry = getPatternTileGeometry(parsePattern('pattern(dots, red, transparent, 12)')!);

        expect(geometry.shapes).toEqual([{
            kind: 'dot',
            cx: 6,
            cy: 6,
            radius: 2,
        }]);
    });

    it('Should build crossing centre lines for the cross-hatch motif', () => {
        const geometry = getPatternTileGeometry(parsePattern('pattern(cross-hatch)')!);

        expect(geometry.shapes).toHaveLength(2);
    });

});
