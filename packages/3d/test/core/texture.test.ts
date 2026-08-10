import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createTexture,
    sampleTexture,
    Texture,
    textureTransformUV,
    textureWrapCoordinate,
    typeIsTexture,
} from '../../src';

import {
    polyfillImageData,
} from '@ripl/test-utils';

polyfillImageData();

/**
 * A 2×2 image whose four texels are red, green, blue and white.
 *
 * Small enough that every filtered sample is predictable by hand, which is what makes the wrap and
 * filter assertions below meaningful rather than merely self-consistent.
 */
function createCheckerSource(): ImageData {
    return new ImageData(new Uint8ClampedArray([
        255,
        0,
        0,
        255,
        0,
        255,
        0,
        255,
        0,
        0,
        255,
        255,
        255,
        255,
        255,
        255,
    ]), 2, 2);
}

function createChecker() {
    return createTexture(createCheckerSource(), {
        magFilter: 'nearest',
    });
}

describe('Texture', () => {

    describe('Construction', () => {

        test('Should default to repeating with linear filtering', () => {
            const texture = createTexture(createCheckerSource());

            expect(texture.wrapS).toBe('repeat');
            expect(texture.wrapT).toBe('repeat');
            expect(texture.magFilter).toBe('linear');
            expect(texture.minFilter).toBe('linear');
            expect(texture.flipY).toBe(false);
            expect(texture.repeat).toEqual([1, 1]);
            expect(texture.offset).toEqual([0, 0]);
        });

        test('Should report the source dimensions', () => {
            const texture = createTexture(createCheckerSource());

            expect(texture.width).toBe(2);
            expect(texture.height).toBe(2);
        });

        test('Should give every texture a distinct identity', () => {
            expect(createChecker().id).not.toBe(createChecker().id);
        });

        test('Should identify textures', () => {
            expect(typeIsTexture(createChecker())).toBe(true);
            expect(typeIsTexture({})).toBe(false);
            expect(typeIsTexture(null)).toBe(false);
        });

    });

    // A backend caches its upload against the version, so every mutation has to bump it or a
    // changed texture renders from a stale image.
    describe('Versioning', () => {

        test('Should bump on every property change', () => {
            const texture = createChecker();
            const initial = texture.version;

            texture.wrapS = 'clamp';
            expect(texture.version).toBeGreaterThan(initial);

            const afterWrap = texture.version;

            texture.repeat = [2, 2];
            expect(texture.version).toBeGreaterThan(afterWrap);
        });

        test('Should bump when the source is replaced', () => {
            const texture = createChecker();
            const initial = texture.version;

            texture.source = createCheckerSource();

            expect(texture.version).toBeGreaterThan(initial);
        });

        test('Should bump on an explicit invalidate', () => {
            const texture = createChecker();
            const initial = texture.version;

            texture.invalidate();

            expect(texture.version).toBe(initial + 1);
        });

    });

    describe('textureWrapCoordinate', () => {

        test('Should clamp outside the unit range', () => {
            expect(textureWrapCoordinate(-0.5, 'clamp')).toBe(0);
            expect(textureWrapCoordinate(1.5, 'clamp')).toBe(1);
            expect(textureWrapCoordinate(0.25, 'clamp')).toBe(0.25);
        });

        test('Should tile on repeat', () => {
            expect(textureWrapCoordinate(1.25, 'repeat')).toBeCloseTo(0.25, 12);
            expect(textureWrapCoordinate(-0.25, 'repeat')).toBeCloseTo(0.75, 12);
        });

        // A mirrored tile has to run backwards, or the seam between tiles jumps.
        test('Should flip alternate tiles on mirror', () => {
            expect(textureWrapCoordinate(0.25, 'mirror')).toBeCloseTo(0.25, 12);
            expect(textureWrapCoordinate(1.25, 'mirror')).toBeCloseTo(0.75, 12);
            expect(textureWrapCoordinate(2.25, 'mirror')).toBeCloseTo(0.25, 12);
        });

    });

    describe('textureTransformUV', () => {

        test('Should be the identity by default', () => {
            expect(textureTransformUV(createChecker(), [0.3, 0.7])).toEqual([0.3, 0.7]);
        });

        test('Should scale by the repeat and shift by the offset', () => {
            const texture = createTexture(createCheckerSource(), {
                repeat: [2, 3],
                offset: [0.1, 0.2],
            });

            const [tu, tv] = textureTransformUV(texture, [0.5, 0.5]);

            expect(tu).toBeCloseTo(1.1, 12);
            expect(tv).toBeCloseTo(1.7, 12);
        });

    });

    describe('sampleTexture', () => {

        test('Should read each texel with nearest filtering', () => {
            const texture = createChecker();

            expect(sampleTexture(texture, 0.25, 0.25)).toEqual([255, 0, 0, 1]);
            expect(sampleTexture(texture, 0.75, 0.25)).toEqual([0, 255, 0, 1]);
            expect(sampleTexture(texture, 0.25, 0.75)).toEqual([0, 0, 255, 1]);
            expect(sampleTexture(texture, 0.75, 0.75)).toEqual([255, 255, 255, 1]);
        });

        test('Should blend between texels with linear filtering', () => {
            const texture = createTexture(createCheckerSource(), {
                magFilter: 'linear',
            });
            const sampled = sampleTexture(texture, 0.5, 0.5)!;

            expect(sampled[0]).toBeGreaterThan(0);
            expect(sampled[0]).toBeLessThan(255);
            expect(sampled[1]).toBeGreaterThan(0);
            expect(sampled[1]).toBeLessThan(255);
        });

        test('Should tile a coordinate beyond the unit range', () => {
            const texture = createChecker();

            expect(sampleTexture(texture, 1.25, 0.25)).toEqual(sampleTexture(texture, 0.25, 0.25));
        });

        test('Should clamp a coordinate beyond the unit range when clamping', () => {
            const texture = createTexture(createCheckerSource(), {
                magFilter: 'nearest',
                wrapS: 'clamp',
                wrapT: 'clamp',
            });

            expect(sampleTexture(texture, 5, 0.25)).toEqual([0, 255, 0, 1]);
        });

        test('Should flip vertically when flipY is set', () => {
            const texture = createTexture(createCheckerSource(), {
                magFilter: 'nearest',
                flipY: true,
            });

            expect(sampleTexture(texture, 0.25, 0.25)).toEqual([0, 0, 255, 1]);
        });

        test('Should honour the repeat transform', () => {
            const texture = createTexture(createCheckerSource(), {
                magFilter: 'nearest',
                repeat: [2, 1],
            });

            // Doubling the repeat means u=0.375 lands where u=0.75 would without it.
            expect(sampleTexture(texture, 0.375, 0.25)).toEqual([0, 255, 0, 1]);
            expect(sampleTexture(texture, 0.125, 0.25)).toEqual([255, 0, 0, 1]);
        });

        test('Should return undefined for a source with no pixels', () => {
            const texture = createTexture(new ImageData(new Uint8ClampedArray(4), 1, 1));

            texture.source = document.createElement('canvas');

            expect(sampleTexture(texture, 0.5, 0.5)).toBeUndefined();
        });

        // Reading pixels back per sample would be ruinous, so the readback is cached per version.
        test('Should resample after the texture is invalidated', () => {
            const texture = createChecker();

            expect(sampleTexture(texture, 0.25, 0.25)).toEqual([255, 0, 0, 1]);

            texture.source = new ImageData(new Uint8ClampedArray([
                0,
                0,
                0,
                255,
                0,
                0,
                0,
                255,
                0,
                0,
                0,
                255,
                0,
                0,
                0,
                255,
            ]), 2, 2);

            expect(sampleTexture(texture, 0.25, 0.25)).toEqual([0, 0, 0, 1]);
        });

    });

    test('Should be constructible directly as well as through the factory', () => {
        expect(new Texture(createCheckerSource())).toBeInstanceOf(Texture);
    });

});
