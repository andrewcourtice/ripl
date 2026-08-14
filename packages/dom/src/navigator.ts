import {
    Navigator,
    resolveInteraction,
} from '@ripl/core';

import type {
    Context,
    NavigatorInteractions,
    NavigatorOptions,
    Point,
    ResolvedInteraction,
} from '@ripl/core';

import {
    typeIsBoolean,
    typeIsFunction,
} from '@ripl/utilities';

import {
    hasWindow,
    onDOMElementResize,
    onDOMEvent,
} from './dom';

/** Options for constructing a {@link DOMNavigator}. Alias of {@link NavigatorOptions}, which carries the `interactions` and `bounds` this class honors. */
export type DOMNavigatorOptions = NavigatorOptions;

const INTERACTION_KEY = Symbol('navigator-interaction');
const VIEWPORT_KEY = Symbol('navigator-viewport');
const WHEEL_SENSITIVITY = 0.002;

/**
 * Feature-detects whether an element can host the wheel/pointer interaction a {@link DOMNavigator}
 * needs. Non-DOM contexts (e.g. the terminal context, which carries a dummy `{}` element) fail this,
 * so the navigator can decline to attach instead of crashing on `getBoundingClientRect`.
 */
function isInteractiveElement(element: unknown): element is HTMLElement {
    return !!element
        && typeIsFunction((element as HTMLElement).getBoundingClientRect)
        && typeIsFunction((element as HTMLElement).addEventListener);
}

/**
 * DOM-bound {@link Navigator} that translates real wheel/pointer/touch gestures into the base
 * navigator's imperative commands: the pan/zoom/brush analogue of how `DOMContext` adds real event
 * listeners on top of the abstract `Context`. The base class in `@ripl/core` owns the view model and
 * stays context-agnostic; this subclass owns input.
 *
 * The gesture model is intentionally Figma-like so a navigator can roam a scene freely:
 * - **click-and-hold drag** (left or middle button, with or without ⌘/Ctrl) pans the view;
 * - **wheel** zooms toward the pointer, and a two-finger **pinch** zooms toward the gesture center;
 * - **⇧ shift-drag** brushes a rectangular selection when brushing is enabled.
 *
 * Because the base transform is unbounded, dragging past the viewport edge (the pointer is captured
 * for the duration of the drag) keeps panning, so content outside the current viewport can be reached
 * and then re-framed with the base `centerOn`/`fitBounds` helpers.
 *
 * {@link Navigator.bounds} scopes which gestures are claimed: the wheel and a gesture's first press
 * are ignored outside the region, leaving the rest of the surface to whatever else is listening.
 * Continuation is never gated, so a drag that leaves the region keeps tracking.
 */
export class DOMNavigator extends Navigator {

    private _element: HTMLElement;
    private _previousTouchAction = '';
    private _previousCursor = '';
    private _panCursorEnabled = false;

    private _pointers = new Map<number, Point>();
    private _dragStart: Point | null = null;
    private _brushing = false;
    private _panning = false;
    private _pinchDistance = 0;
    private _originDirty = true;
    private _originLeft = 0;
    private _originTop = 0;

    constructor(context: Context, options?: DOMNavigatorOptions) {
        super(options);

        this._element = context.element as unknown as HTMLElement;

        // Non-DOM contexts (e.g. terminal) carry a dummy element, so feature-detect and stay inert, not crash.
        if (!isInteractiveElement(this._element)) {
            console.warn('createNavigator: the provided context is not DOM-interactive; navigation is disabled.');
            return;
        }

        this._syncViewport();

        this.retain(onDOMElementResize(this._element, () => {
            this._originDirty = true;
            this._syncViewport();
        }), VIEWPORT_KEY);

        if (hasWindow) {
            // Capture phase: a scroll event doesn't bubble, so an ancestor scroll container is only visible here.
            this.retain(onDOMEvent(window, 'scroll', () => this._originDirty = true, {
                capture: true,
                passive: true,
            }), VIEWPORT_KEY);

            this.retain(onDOMEvent(window, 'resize', () => this._originDirty = true), VIEWPORT_KEY);
        }

        if (options?.interactions) {
            this._attachInteractions(options.interactions);
        }
    }

    private _syncViewport(): void {
        const rect = this._element.getBoundingClientRect();

        this.viewport = {
            width: rect.width,
            height: rect.height,
        };
    }

    /** Re-reads where the element sits in the viewport, at most once per invalidation. */
    private _refreshOrigin(): void {
        if (!this._originDirty) {
            return;
        }

        ({
            left: this._originLeft,
            top: this._originTop,
        } = this._element.getBoundingClientRect());

        this._originDirty = false;
    }

    private _localPoint(event: {
        clientX: number;
        clientY: number;
    }): Point {
        // A rect read per `pointermove` flushes layout mid-gesture, which is the frame budget gone.
        this._refreshOrigin();

        return [
            event.clientX - this._originLeft,
            event.clientY - this._originTop,
        ];
    }

    /** Whether a gesture starting at `point` belongs to this navigator, per its {@link Navigator.bounds}. */
    private _withinBounds(point: Point): boolean {
        if (!this._bounds) {
            return true;
        }

        const {
            x,
            y,
            width,
            height,
        } = this._bounds;

        return point[0] >= x
            && point[0] <= x + width
            && point[1] >= y
            && point[1] <= y + height;
    }

    private _setCursor(cursor: string): void {
        if (this._panCursorEnabled) {
            this._element.style.cursor = cursor;
        }
    }

    private _attachInteractions(interactions: boolean | NavigatorInteractions): void {
        const isBoolean = typeIsBoolean(interactions);
        const config = isBoolean ? {} as NavigatorInteractions : interactions;
        const fallback = isBoolean ? interactions : false;

        const zoom = resolveInteraction(config.zoom, fallback);
        const pan = resolveInteraction(config.pan, fallback);
        const brush = resolveInteraction(config.brush, fallback);

        // `{}` and `{ zoom: false }` are both truthy; suppressing native scroll for no gesture is not a trade.
        if (!zoom.enabled && !pan.enabled && !brush.enabled) {
            return;
        }

        this._previousTouchAction = this._element.style.touchAction;
        this._element.style.touchAction = 'none';

        if (pan.enabled) {
            this._panCursorEnabled = true;
            this._previousCursor = this._element.style.cursor;
            this._element.style.cursor = 'grab';
        }

        if (zoom.enabled) {
            this.retain(onDOMEvent(this._element, 'wheel', event => {
                const point = this._localPoint(event);

                // Ahead of `preventDefault`, so a wheel outside the claimed region still scrolls the page.
                if (!this._withinBounds(point)) {
                    return;
                }

                event.preventDefault();

                const factor = Math.exp(-event.deltaY * WHEEL_SENSITIVITY * zoom.sensitivity);

                this.zoomBy(factor, point);
            }), INTERACTION_KEY);
        }

        if (pan.enabled || brush.enabled) {
            this._attachPointerInteractions(pan, brush);
        }

        this.retain({
            dispose: () => {
                this._element.style.touchAction = this._previousTouchAction;

                if (this._panCursorEnabled) {
                    this._element.style.cursor = this._previousCursor;
                }
            },
        }, INTERACTION_KEY);
    }

    private _attachPointerInteractions(pan: ResolvedInteraction, brush: ResolvedInteraction): void {
        this.retain(onDOMEvent(this._element, 'pointerdown', event => {
            const origin = this._localPoint(event);

            // Only a gesture's first press is gated; a second finger completing a pinch may land anywhere.
            if (this._pointers.size === 0 && !this._withinBounds(origin)) {
                return;
            }

            this._pointers.set(event.pointerId, origin);

            // Every tracked pointer, not just the gesturing ones: an uncaptured release off the element leaks its entry.
            this._element.setPointerCapture?.(event.pointerId);

            if (this._pointers.size === 2) {
                this._pinchDistance = this._pointerDistance();
                this._panning = false;
                this._brushing = false;
                return;
            }

            const button = event.button ?? 0;

            // Shift-drag brushes; any other left/middle click-and-hold pans, matching the Figma grab gesture.
            this._brushing = brush.enabled && event.shiftKey;
            this._panning = pan.enabled && !this._brushing && button !== 2;

            if (!this._brushing && !this._panning) {
                return;
            }

            this._dragStart = origin;

            if (this._panning) {
                this._setCursor('grabbing');
            }
        }), INTERACTION_KEY);

        this.retain(onDOMEvent(this._element, 'pointermove', event => {
            if (!this._pointers.has(event.pointerId)) {
                return;
            }

            const point = this._localPoint(event);
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
            this._pinchDistance = 0;

            // A pinch that loses a finger has to hand the survivor back to panning, not strand it mid-gesture.
            if (this._pointers.size === 1 && pan.enabled) {
                this._panning = true;
                this._dragStart = [...this._pointers.values()][0];
                this._setCursor('grabbing');

                return;
            }

            this._setCursor('grab');
        };

        this.retain(onDOMEvent(this._element, 'pointerup', endPointer), INTERACTION_KEY);
        this.retain(onDOMEvent(this._element, 'pointercancel', endPointer), INTERACTION_KEY);
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
        this.dispose(VIEWPORT_KEY);
        super.destroy();
    }

}

/** Factory that creates a DOM-bound {@link DOMNavigator} for the given context. */
export function createNavigator(context: Context, options?: DOMNavigatorOptions): DOMNavigator {
    return new DOMNavigator(context, options);
}
