import {
    EventBus,
} from '../core/event-bus';

import type {
    EventMap,
} from '../core/event-bus';

import {
    clamp,
} from '../math';

import type {
    Context,
} from '../context';

import type {
    Point,
} from '../math';

import type {
    Disposable,
} from '@ripl/utilities';

import {
    typeIsBoolean,
} from '@ripl/utilities';

// Inlined rather than importing `onDOMEvent` from `@ripl/dom`: `@ripl/dom` depends on `@ripl/core`, so
// core must not depend back on it. `Navigator` only needs plain add/removeEventListener.
function listen<TType extends keyof HTMLElementEventMap>(element: HTMLElement, type: TType, handler: (event: HTMLElementEventMap[TType]) => void): Disposable {
    element.addEventListener(type, handler as EventListener);

    return {
        dispose: () => element.removeEventListener(type, handler as EventListener),
    };
}

/** A 2D affine view transform: uniform scale `k` plus translation `[x, y]` (screen pixels). */
export interface NavigatorTransform {
    k: number;
    x: number;
    y: number;
}

/** A rectangular brush selection in the context's pixel space. */
export interface NavigatorBrush {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

/** Enable/disable a single interaction, optionally with a sensitivity multiplier. */
export type NavigatorInteractionOption = boolean | {
    enabled?: boolean;
    sensitivity?: number;
};

/** Configures which navigator interactions (zoom, pan, brush) are enabled. */
export interface NavigatorInteractions {
    zoom?: NavigatorInteractionOption;
    pan?: NavigatorInteractionOption;
    brush?: NavigatorInteractionOption;
}

/** Options for constructing a {@link Navigator}. */
export interface NavigatorOptions {
    interactions?: boolean | NavigatorInteractions;
    /** Minimum and maximum zoom factor `k`. */
    scaleExtent?: [number, number];
}

/** Events emitted by a {@link Navigator}. */
export interface NavigatorEventMap extends EventMap {
    zoom: NavigatorTransform;
    pan: NavigatorTransform;
    change: NavigatorTransform;
    brush: NavigatorBrush;
    brushend: NavigatorBrush | null;
}

interface ResolvedInteraction {
    enabled: boolean;
    sensitivity: number;
}

const INTERACTION_KEY = Symbol('navigator-interaction');
const WHEEL_SENSITIVITY = 0.002;

function resolveInteraction(option: NavigatorInteractionOption | undefined, fallback: boolean): ResolvedInteraction {
    if (option === undefined) {
        return {
            enabled: fallback,
            sensitivity: 1,
        };
    }

    if (typeIsBoolean(option)) {
        return {
            enabled: option,
            sensitivity: 1,
        };
    }

    return {
        enabled: option.enabled !== false,
        sensitivity: option.sensitivity ?? 1,
    };
}

/**
 * Rescales a scale's domain to the window currently visible under a navigator transform. The scale
 * maps data → the given pixel `range`; inverting the transformed range endpoints back through the
 * scale yields the zoomed/panned data domain. This is how a cartesian chart turns navigator gestures
 * into axis rescaling (`scale.inverse`) without transforming the rendered geometry.
 */
export function rescaleDomain<TDomain>(
    scale: { inverse(value: number): TDomain },
    transform: NavigatorTransform,
    range: [number, number]
): [TDomain, TDomain] {
    const [
        rangeMin,
        rangeMax,
    ] = range;

    return [
        scale.inverse((rangeMin - transform.x) / transform.k),
        scale.inverse((rangeMax - transform.x) / transform.k),
    ];
}

/**
 * An interactive 2D pan/zoom/brush controller — the flat-scene analogue of the 3D `Camera`. A
 * consumer opts one in alongside their `Context`/`Scene`/`Renderer`; charts create one automatically
 * when their config enables it. It owns a view transform (`{ k, x, y }`) and an optional brush
 * selection, translates wheel/drag/pinch gestures into transform changes, and emits `zoom`/`pan`/
 * `change`/`brush`/`brushend` events. It does not itself repaint — consumers apply the transform
 * (e.g. rescaling axis domains via {@link rescaleDomain}) in response to `change`.
 */
export class Navigator extends EventBus<NavigatorEventMap> {

    private _context: Context;
    private _element: HTMLElement;

    private _transform: NavigatorTransform = {
        k: 1,
        x: 0,
        y: 0,
    };

    private _brush: NavigatorBrush | null = null;
    private _scaleExtent: [number, number];
    private _previousTouchAction = '';

    private _pointers = new Map<number, Point>();
    private _dragStart: Point | null = null;
    private _brushing = false;
    private _panning = false;
    private _pinchDistance = 0;

    constructor(target: Context | { context: Context }, options?: NavigatorOptions) {
        super();

        this._context = 'context' in target ? target.context : target;
        this._element = this._context.element as unknown as HTMLElement;
        this._scaleExtent = options?.scaleExtent ?? [0.001, 1000];

        if (options?.interactions) {
            this._attachInteractions(options.interactions);
        }
    }

    /** The current view transform. */
    public get transform(): NavigatorTransform {
        return {
            ...this._transform,
        };
    }

    /** The current brush selection, or `null` when nothing is selected. */
    public get brush(): NavigatorBrush | null {
        return this._brush && {
            ...this._brush,
        };
    }

    private _pointer(event: {
        clientX: number;
        clientY: number;
    }): Point {
        const rect = this._element.getBoundingClientRect();

        return [
            event.clientX - rect.left,
            event.clientY - rect.top,
        ];
    }

    private _commit(event: 'zoom' | 'pan'): void {
        const transform = this.transform;

        this.emit(event, transform);
        this.emit('change', transform);
    }

    /** Applies the transform to a point in original space, returning its on-screen position. */
    public applyPoint(point: Point): Point {
        return [
            this._transform.k * point[0] + this._transform.x,
            this._transform.k * point[1] + this._transform.y,
        ];
    }

    /** Inverts a screen-space point back to original space. */
    public invertPoint(point: Point): Point {
        return [
            (point[0] - this._transform.x) / this._transform.k,
            (point[1] - this._transform.y) / this._transform.k,
        ];
    }

    /** Replaces the view transform outright. */
    public setTransform(transform: NavigatorTransform): void {
        this._transform = {
            k: clamp(transform.k, this._scaleExtent[0], this._scaleExtent[1]),
            x: transform.x,
            y: transform.y,
        };

        this._commit('zoom');
    }

    /** Pans the view by a pixel delta. */
    public panBy(dx: number, dy: number): void {
        this._transform = {
            k: this._transform.k,
            x: this._transform.x + dx,
            y: this._transform.y + dy,
        };

        this._commit('pan');
    }

    /** Multiplies the zoom by `factor`, keeping `center` (screen pixels, defaults to the origin) fixed. */
    public zoomBy(factor: number, center: Point = [0, 0]): void {
        const nextK = clamp(this._transform.k * factor, this._scaleExtent[0], this._scaleExtent[1]);
        const ratio = nextK / this._transform.k;

        this._transform = {
            k: nextK,
            x: center[0] - ratio * (center[0] - this._transform.x),
            y: center[1] - ratio * (center[1] - this._transform.y),
        };

        this._commit('zoom');
    }

    /** Sets the absolute zoom factor, keeping `center` fixed. */
    public zoomTo(k: number, center: Point = [0, 0]): void {
        this.zoomBy(k / this._transform.k, center);
    }

    /** Resets the transform to the identity (no zoom, no pan). */
    public reset(): void {
        this._transform = {
            k: 1,
            x: 0,
            y: 0,
        };

        this._commit('zoom');
    }

    /** Sets the brush selection, normalising the extent, and emits a `brush` event. */
    public setBrush(brush: NavigatorBrush): void {
        this._brush = {
            x0: Math.min(brush.x0, brush.x1),
            y0: Math.min(brush.y0, brush.y1),
            x1: Math.max(brush.x0, brush.x1),
            y1: Math.max(brush.y0, brush.y1),
        };

        this.emit('brush', this._brush);
    }

    /** Clears the brush selection and emits a `brushend` event with `null`. */
    public clearBrush(): void {
        this._brush = null;
        this.emit('brushend', null);
    }

    private _attachInteractions(interactions: boolean | NavigatorInteractions): void {
        const isBoolean = typeIsBoolean(interactions);
        const config = isBoolean ? {} as NavigatorInteractions : interactions;
        const fallback = isBoolean ? interactions : false;

        const zoom = resolveInteraction(config.zoom, fallback);
        const pan = resolveInteraction(config.pan, fallback);
        const brush = resolveInteraction(config.brush, fallback);

        this._previousTouchAction = this._element.style.touchAction;
        this._element.style.touchAction = 'none';

        if (zoom.enabled) {
            this.retain(listen(this._element, 'wheel', event => {
                event.preventDefault();

                const factor = Math.exp(-event.deltaY * WHEEL_SENSITIVITY * zoom.sensitivity);

                this.zoomBy(factor, this._pointer(event));
            }), INTERACTION_KEY);
        }

        if (pan.enabled || brush.enabled) {
            this._attachPointerInteractions(pan, brush);
        }

        this.retain({
            dispose: () => {
                this._element.style.touchAction = this._previousTouchAction;
            },
        }, INTERACTION_KEY);
    }

    private _attachPointerInteractions(pan: ResolvedInteraction, brush: ResolvedInteraction): void {
        this.retain(listen(this._element, 'pointerdown', event => {
            this._pointers.set(event.pointerId, this._pointer(event));

            if (this._pointers.size === 2) {
                this._pinchDistance = this._pointerDistance();
                this._panning = false;
                this._brushing = false;
                return;
            }

            this._dragStart = this._pointer(event);
            this._brushing = brush.enabled && (!pan.enabled || event.shiftKey);
            this._panning = pan.enabled && !this._brushing;

            this._element.setPointerCapture?.(event.pointerId);
        }), INTERACTION_KEY);

        this.retain(listen(this._element, 'pointermove', event => {
            if (!this._pointers.has(event.pointerId)) {
                return;
            }

            const point = this._pointer(event);
            this._pointers.set(event.pointerId, point);

            if (this._pointers.size >= 2) {
                this._handlePinch();
                return;
            }

            if (this._brushing && this._dragStart) {
                this.setBrush({
                    x0: this._dragStart[0],
                    y0: this._dragStart[1],
                    x1: point[0],
                    y1: point[1],
                });
                return;
            }

            if (this._panning && this._dragStart) {
                this.panBy(point[0] - this._dragStart[0], point[1] - this._dragStart[1]);
                this._dragStart = point;
            }
        }), INTERACTION_KEY);

        const endPointer = (event: PointerEvent) => {
            this._pointers.delete(event.pointerId);

            if (this._brushing) {
                this.emit('brushend', this.brush);
            }

            this._brushing = false;
            this._panning = false;
            this._dragStart = null;
        };

        this.retain(listen(this._element, 'pointerup', endPointer), INTERACTION_KEY);
        this.retain(listen(this._element, 'pointercancel', endPointer), INTERACTION_KEY);
    }

    private _pointerDistance(): number {
        const [
            a,
            b,
        ] = [...this._pointers.values()];

        return Math.hypot(a[0] - b[0], a[1] - b[1]);
    }

    private _pinchCenter(): Point {
        const [
            a,
            b,
        ] = [...this._pointers.values()];

        return [
            (a[0] + b[0]) / 2,
            (a[1] + b[1]) / 2,
        ];
    }

    private _handlePinch(): void {
        const distance = this._pointerDistance();

        if (this._pinchDistance > 0 && distance > 0) {
            this.zoomBy(distance / this._pinchDistance, this._pinchCenter());
        }

        this._pinchDistance = distance;
    }

    /** Detaches all interaction listeners and disposes the navigator. */
    public destroy(): void {
        this.dispose(INTERACTION_KEY);
        super.destroy();
    }

}

/** Factory function that creates a new {@link Navigator} bound to the given context or scene. */
export function createNavigator(target: Context | { context: Context }, options?: NavigatorOptions): Navigator {
    return new Navigator(target, options);
}
