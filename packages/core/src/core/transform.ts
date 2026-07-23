/**
 * Element transform application: maps an element's transform state (translate, scale,
 * rotation, origin) onto a {@link TransformTarget}: either a live rendering context or the
 * matrix accumulator behind world-transform computation.
 */

import {
    resolveRotation,
    resolveTransformOrigin,
} from '../context/transform';

import type {
    Matrix,
} from '../math';

import {
    matrixIdentity,
    matrixMultiply,
    matrixRotate,
    matrixScale,
    matrixTranslate,
} from '../math';

import {
    typeIsString,
} from '@ripl/utilities';

import type {
    Element,
} from './element';

/**
 * The subset of {@link Context} transform operations required to apply an element's
 * transform. Implemented by every {@link Context}, and by the internal matrix accumulator
 * used to reconstruct an element's world transform for hit testing.
 */
export interface TransformTarget {
    /** Applies a translation of `(x, y)`. */
    translate(x: number, y: number): void;
    /** Applies a rotation, in radians. */
    rotate(angle: number): void;
    /** Applies a scale with the given horizontal and vertical factors. */
    scale(x: number, y: number): void;
}

/**
 * Applies an element's transform (translate, rotate, scale about its transform-origin) to
 * the given target. Used both to drive a {@link Context}'s transform during rendering and,
 * via a matrix accumulator, to reconstruct an element's world transform for hit testing.
 *
 * @param target - The {@link Context} (or matrix accumulator) to apply the transform to.
 * @param element - The element whose transform is applied.
 */
export function applyElementTransform(target: TransformTarget, element: Element) {
    const translateX = element.translateX ?? 0;
    const translateY = element.translateY ?? 0;
    const scaleX = element.transformScaleX ?? 1;
    const scaleY = element.transformScaleY ?? 1;
    const rawRotation = element.rotation ?? 0;
    const rawOriginX = element.transformOriginX ?? 0;
    const rawOriginY = element.transformOriginY ?? 0;

    const rotation = resolveRotation(rawRotation);

    const hasTranslate = translateX !== 0 || translateY !== 0;
    const hasScale = scaleX !== 1 || scaleY !== 1;
    const hasRotation = rotation !== 0;
    const hasOrigin = rawOriginX !== 0 || rawOriginY !== 0;

    if (!hasTranslate && !hasScale && !hasRotation) {
        return;
    }

    let originX = 0;
    let originY = 0;

    if (hasOrigin) {
        const needsBBox = typeIsString(rawOriginX) || typeIsString(rawOriginY);
        // Origins resolve against the element's own (pre-transform) geometry, not its on-screen box.
        const box = needsBBox ? element._getLocalBoundingBox() : null;

        originX = resolveTransformOrigin(rawOriginX, box?.width ?? 0);
        originY = resolveTransformOrigin(rawOriginY, box?.height ?? 0);

        if (needsBBox && box) {
            originX += box.left;
            originY += box.top;
        }
    }

    target.translate(originX + translateX, originY + translateY);

    if (hasRotation) {
        target.rotate(rotation);
    }

    if (hasScale) {
        target.scale(scaleX, scaleY);
    }

    if (hasOrigin) {
        target.translate(-originX, -originY);
    }
}

/** A {@link TransformTarget} that accumulates applied transforms into a single {@link Matrix}. */
export class MatrixTransformTarget implements TransformTarget {

    public matrix: Matrix = matrixIdentity();

    public translate(x: number, y: number): void {
        this.matrix = matrixMultiply(this.matrix, matrixTranslate(x, y));
    }

    public rotate(angle: number): void {
        this.matrix = matrixMultiply(this.matrix, matrixRotate(angle));
    }

    public scale(x: number, y: number): void {
        this.matrix = matrixMultiply(this.matrix, matrixScale(x, y));
    }

}
