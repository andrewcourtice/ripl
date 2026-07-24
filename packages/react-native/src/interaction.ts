import {
    createFrameBuffer,
    getEuclideanDistance,
} from '@ripl/core';

import type {
    RenderElement,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

import type {
    ReactNativeSkiaContext,
} from './context';

const DEFAULT_DRAG_THRESHOLD = 3;

/** Options for a {@link SkiaPointerController}. */
export interface SkiaPointerControllerOptions {
    /** Minimum pointer travel, in logical pixels, before a press becomes a drag. Defaults to `3`. */
    dragThreshold?: number;
}

/**
 * Translates raw pointer input (from `react-native-gesture-handler`) into Ripl's pointer events,
 * reusing the context's hit testing. It mirrors the interaction logic of the DOM backend
 * (`@ripl/dom`'s `DOMContext`) — hover enter/leave/move diffing, a drag threshold, and click — but
 * consumes view-local logical coordinates directly, since the React Native surface uses identity
 * coordinate scales.
 */
export class SkiaPointerController {

    private readonly _context: ReactNativeSkiaContext;
    private readonly _dragThreshold: number;
    private readonly _activeElements = new Set<RenderElement>();
    private readonly _scheduleHitTest = createFrameBuffer();

    private _dragElement?: RenderElement;
    private _dragStartX = 0;
    private _dragStartY = 0;
    private _dragPrevX = 0;
    private _dragPrevY = 0;
    private _dragStarted = false;

    constructor(context: ReactNativeSkiaContext, options?: SkiaPointerControllerOptions) {
        this._context = context;
        this._dragThreshold = options?.dragThreshold ?? DEFAULT_DRAG_THRESHOLD;
    }

    /** Signals the pointer entered the surface, emitting a context `mouseenter`. */
    public pointerEnter(): void {
        this._context.emit('mouseenter', null);
    }

    /** Signals the pointer left the surface, emitting a context `mouseleave` and clearing hover state. */
    public pointerLeave(): void {
        this._context.emit('mouseleave', null);

        this._activeElements.forEach(element => element.emit('mouseleave', null));
        this._activeElements.clear();
    }

    /** Begins a potential drag by hit-testing the press point for drag listeners. */
    public pointerDown(x: number, y: number): void {
        const hits = this._context.queryHits(['dragstart', 'drag', 'dragend'], x, y);

        if (hits.length > 0) {
            this._dragElement = hits[0];
            this._dragStartX = x;
            this._dragStartY = y;
            this._dragStarted = false;
        }
    }

    /** Emits a context `mousemove`, advances any in-progress drag, and schedules a hover hit test. */
    public pointerMove(x: number, y: number): void {
        this._context.emit('mousemove', {
            x,
            y,
        });

        if (this._dragElement) {
            this._handleDrag(x, y);
        }

        this._scheduleHitTest(() => this._handleHoverHitTest(x, y));
    }

    /** Completes a drag (emitting `dragend` when one was in progress) and clears drag state. */
    public pointerUp(x: number, y: number): void {
        const element = this._dragElement;

        if (element && this._dragStarted) {
            const payload = {
                x,
                y,
                startX: this._dragStartX,
                startY: this._dragStartY,
                deltaX: x - this._dragPrevX,
                deltaY: y - this._dragPrevY,
            };

            this._context.emit('dragend', payload);
            element.emit('dragend', payload);
        }

        this._dragElement = undefined;
        this._dragStarted = false;
    }

    /** Hit-tests the tap point and emits `click` on the topmost matching element. */
    public click(x: number, y: number): void {
        const hits = this._context.queryHits(['click'], x, y);

        if (hits.length > 0) {
            hits[0].emit('click', {
                x,
                y,
            });
        }
    }

    /** Clears hover and drag state. */
    public destroy(): void {
        this._activeElements.clear();
        this._dragElement = undefined;
        this._dragStarted = false;
    }

    private _handleDrag(x: number, y: number): void {
        const element = this._dragElement;

        if (!element) {
            return;
        }

        const dx = x - this._dragStartX;
        const dy = y - this._dragStartY;

        if (!this._dragStarted) {
            if (getEuclideanDistance(dx, dy) >= this._dragThreshold) {
                this._dragStarted = true;
                this._dragPrevX = this._dragStartX;
                this._dragPrevY = this._dragStartY;

                const payload = {
                    x: this._dragStartX,
                    y: this._dragStartY,
                };

                this._context.emit('dragstart', payload);
                element.emit('dragstart', payload);
            }

            return;
        }

        const payload = {
            x,
            y,
            startX: this._dragStartX,
            startY: this._dragStartY,
            deltaX: x - this._dragPrevX,
            deltaY: y - this._dragPrevY,
        };

        this._dragPrevX = x;
        this._dragPrevY = y;

        this._context.emit('drag', payload);
        element.emit('drag', payload);
    }

    private _handleHoverHitTest(x: number, y: number): void {
        const hits = this._context.queryHits(['mousemove', 'mouseenter', 'mouseleave'], x, y);
        const topmost = hits.length > 0 ? [hits[0]] : [];

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(topmost, [...this._activeElements], (hitElement, activeElement) => hitElement === activeElement);

        exits.forEach(element => {
            this._activeElements.delete(element);
            element.emit('mouseleave', null);
        });

        entries.forEach(element => {
            this._activeElements.add(element);
            element.emit('mouseenter', null);
        });

        updates.forEach(([element]) => element.emit('mousemove', {
            x,
            y,
        }));
    }

}
