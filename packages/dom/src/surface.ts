import {
    hasWindow,
    onDOMEvent,
} from './dom';

import type {
    Context,
    Point,
} from '@ripl/core';

import {
    typeIsFunction,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

/**
 * Where a context's surface sits on the page, and how big it is drawn relative to the logical
 * size the context reports.
 *
 * `scaleX`/`scaleY` are on-screen CSS pixels per logical pixel: `1` for an untransformed surface,
 * and something else when a CSS transform (or an intrinsic-size mismatch) scales it. They are the
 * factor a client coordinate has to be divided by to land in the logical space element geometry is
 * authored in — the space {@link Context.toSurfacePoint} maps *out of*, not into.
 */
export interface SurfaceRect {
    /** Distance from the viewport's left edge to the surface's left edge, in CSS pixels. */
    left: number;
    /** Distance from the viewport's top edge to the surface's top edge, in CSS pixels. */
    top: number;
    /** On-screen width of the surface, in CSS pixels. */
    width: number;
    /** On-screen height of the surface, in CSS pixels. */
    height: number;
    /** On-screen CSS pixels per logical pixel horizontally. */
    scaleX: number;
    /** On-screen CSS pixels per logical pixel vertically. */
    scaleY: number;
}

/** Anything carrying `clientX`/`clientY` — every pointer, mouse, and wheel event. */
export interface ClientPoint {
    /** The event's X coordinate relative to the viewport, in CSS pixels. */
    clientX: number;
    /** The event's Y coordinate relative to the viewport, in CSS pixels. */
    clientY: number;
}

/**
 * Tracks a context surface's position and on-screen scale, re-measuring only when something that
 * can move it fires, and maps points across the boundary between the page and the scene.
 */
export interface SurfaceOrigin extends Disposable {
    /** The surface's current position and scale, re-measured on first read after an invalidation. */
    readonly rect: SurfaceRect;
    /** Marks the cached measurement stale, so the next read re-measures. */
    invalidate(): void;
    /** Maps a viewport (`clientX`/`clientY`) point into the logical space elements are authored in. */
    toLogicalPoint(event: ClientPoint): Point;
    /** Maps a logical point back to viewport coordinates, the inverse of {@link SurfaceOrigin.toLogicalPoint}. */
    toClientPoint(x: number, y: number): Point;
}

const IDENTITY_RECT: SurfaceRect = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
};

/** An unsized surface would divide the point by zero, so fall back to an unscaled mapping. */
function resolveScale(onScreen: number, logical: number): number {
    return onScreen > 0 && logical > 0
        ? onScreen / logical
        : 1;
}

function isMeasurable(element: unknown): element is HTMLElement {
    return !!element && typeof (element as HTMLElement).getBoundingClientRect === 'function';
}

/**
 * Measures where a context's surface sits on the page and how big it is drawn relative to the
 * logical size the context reports. Returns an identity rect for a non-DOM context (the terminal
 * context carries a dummy element), so callers never have to feature-detect.
 *
 * @param context - The context whose surface is measured.
 * @returns The surface's viewport position and on-screen scale.
 */
export function getSurfaceRect(context: Context): SurfaceRect {
    const element = context.element as unknown;

    if (!isMeasurable(element)) {
        return { ...IDENTITY_RECT };
    }

    const {
        left,
        top,
        width,
        height,
    } = element.getBoundingClientRect();

    return {
        left,
        top,
        width,
        height,
        scaleX: resolveScale(width, context.width),
        scaleY: resolveScale(height, context.height),
    };
}

/**
 * Creates a {@link SurfaceOrigin} for a context: the one origin cache and point mapping every DOM
 * consumer turning pointer events into scene coordinates should go through. Each call owns its own
 * cache and listeners, so a consumer holds one for as long as it handles pointer events and
 * disposes it with the rest of its wiring.
 *
 * A `getBoundingClientRect()` per `pointermove` flushes layout mid-gesture, which is the frame
 * budget gone, so the measurement is cached and re-taken only when a page scroll, a window resize,
 * a context resize or the pointer entering the surface can have moved it — plus whenever a caller
 * invalidates it explicitly.
 *
 * Points cross into logical space (the space public pointer payloads and element geometry use),
 * never surface space: a caller that needs surface coordinates — `Context.hitTest` and
 * `Element.intersectsWith` take them — maps on through {@link Context.toSurfacePoint}.
 *
 * @param context - The context whose surface is tracked.
 * @returns The origin tracker; dispose it to detach the scroll, resize and pointer listeners.
 * @example
 * const origin = createSurfaceOrigin(context);
 * element.addEventListener('pointermove', event => console.log(origin.toLogicalPoint(event)));
 */
export function createSurfaceOrigin(context: Context): SurfaceOrigin {
    const disposables: Disposable[] = [];
    const element = context.element as unknown;

    let rect: SurfaceRect | undefined;

    const invalidate = () => rect = undefined;

    if (hasWindow) {
        // Capture phase: a scroll event doesn't bubble, so an ancestor scroll container is only visible here.
        disposables.push(onDOMEvent(window, 'scroll', invalidate, {
            capture: true,
            passive: true,
        }));

        disposables.push(onDOMEvent(window, 'resize', invalidate));
    }

    // A container resize moves and rescales the surface without the window ever resizing.
    if (typeIsFunction(context.on)) {
        disposables.push(context.on('resize', invalidate));
    }

    // A layout shift elsewhere on the page translates the surface with nothing else firing; the pointer arriving is the last cue before it is used.
    if (isMeasurable(element) && typeIsFunction(element.addEventListener)) {
        disposables.push(onDOMEvent(element, 'pointerenter', invalidate));
        disposables.push(onDOMEvent(element, 'mouseenter', invalidate));
    }

    const origin: SurfaceOrigin = {
        invalidate,
        get rect() {
            return rect ??= getSurfaceRect(context);
        },
        toLogicalPoint(event) {
            const current = origin.rect;

            return [
                (event.clientX - current.left) / current.scaleX,
                (event.clientY - current.top) / current.scaleY,
            ];
        },
        toClientPoint(x, y) {
            const current = origin.rect;

            return [
                current.left + x * current.scaleX,
                current.top + y * current.scaleY,
            ];
        },
        dispose() {
            disposables.forEach(disposable => disposable.dispose());
            disposables.length = 0;
        },
    };

    return origin;
}
