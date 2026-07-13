import {
    Navigator,
} from '@ripl/core';

import type {
    Context,
    NavigatorInteractionOption,
    NavigatorInteractions,
    NavigatorOptions,
    Point,
} from '@ripl/core';

import {
    typeIsBoolean,
} from '@ripl/utilities';

import {
    onDOMElementResize,
    onDOMEvent,
} from './dom';

/** A navigator can be bound to a `Context`, a scene-like object exposing a `context`, or a raw element. */
export type NavigatorTarget = Context | {
    context: Context;
} | HTMLElement;

/** Options for constructing a {@link DOMNavigator}, adding interaction wiring to the base options. */
export interface DOMNavigatorOptions extends NavigatorOptions {
    interactions?: boolean | NavigatorInteractions;
}

interface ResolvedInteraction {
    enabled: boolean;
    sensitivity: number;
}

const INTERACTION_KEY = Symbol('navigator-interaction');
const VIEWPORT_KEY = Symbol('navigator-viewport');
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

function resolveElement(target: NavigatorTarget): HTMLElement {
    // A `Context` exposes its DOM node as `element`; a scene exposes its context as `context`. Check
    // `element` first: a concrete context (e.g. `CanvasContext`) carries both an `element` and a raw
    // `context`, and only its `element` is the DOM node we want.
    if ('element' in target) {
        return target.element as unknown as HTMLElement;
    }

    if ('context' in target) {
        return target.context.element as unknown as HTMLElement;
    }

    return target;
}

/**
 * DOM-bound {@link Navigator} that translates real wheel/pointer/touch gestures into the base
 * navigator's imperative commands — the pan/zoom/brush analogue of how `DOMContext` adds real event
 * listeners on top of the abstract `Context`. The base class in `@ripl/core` owns the view model and
 * stays context-agnostic; this subclass owns input.
 *
 * The gesture model is intentionally Figma-like so a navigator can roam a scene freely:
 * - **click-and-hold drag** (left or middle button, with or without ⌘/Ctrl) pans the view;
 * - **wheel** zooms toward the pointer, and a two-finger **pinch** zooms toward the gesture centre;
 * - **⇧ shift-drag** brushes a rectangular selection when brushing is enabled.
 *
 * Because the base transform is unbounded, dragging past the viewport edge (the pointer is captured
 * for the duration of the drag) keeps panning, so content outside the current viewport can be reached
 * — then re-framed with the base `centerOn`/`fitBounds` helpers.
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

    constructor(target: NavigatorTarget, options?: DOMNavigatorOptions) {
        super(options);

        this._element = resolveElement(target);
        this._syncViewport();

        this.retain(onDOMElementResize(this._element, () => this._syncViewport()), VIEWPORT_KEY);

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

    private _localPoint(event: {
        clientX: number;
        clientY: number;
    }): Point {
        const rect = this._element.getBoundingClientRect();

        return [
            event.clientX - rect.left,
            event.clientY - rect.top,
        ];
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

        this._previousTouchAction = this._element.style.touchAction;
        this._element.style.touchAction = 'none';

        if (pan.enabled) {
            this._panCursorEnabled = true;
            this._previousCursor = this._element.style.cursor;
            this._element.style.cursor = 'grab';
        }

        if (zoom.enabled) {
            this.retain(onDOMEvent(this._element, 'wheel', event => {
                event.preventDefault();

                const factor = Math.exp(-event.deltaY * WHEEL_SENSITIVITY * zoom.sensitivity);

                this.zoomBy(factor, this._localPoint(event));
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
            this._pointers.set(event.pointerId, this._localPoint(event));

            if (this._pointers.size === 2) {
                this._pinchDistance = this._pointerDistance();
                this._panning = false;
                this._brushing = false;
                return;
            }

            const button = event.button ?? 0;

            // Shift-drag brushes (when enabled); any other click-and-hold with the left or middle
            // button pans — including ⌘/Ctrl-click, matching the Figma "grab the canvas" gesture.
            this._brushing = brush.enabled && event.shiftKey;
            this._panning = pan.enabled && !this._brushing && button !== 2;

            if (!this._brushing && !this._panning) {
                return;
            }

            this._dragStart = this._localPoint(event);

            if (this._panning) {
                this._setCursor('grabbing');
            }

            this._element.setPointerCapture?.(event.pointerId);
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

/** Factory that creates a DOM-bound {@link DOMNavigator} for the given context, scene, or element. */
export function createNavigator(target: NavigatorTarget, options?: DOMNavigatorOptions): DOMNavigator {
    return new DOMNavigator(target, options);
}
