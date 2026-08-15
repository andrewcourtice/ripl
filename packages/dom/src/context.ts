import {
    Context,
    createFrameBuffer,
    getEuclideanDistance,
} from '@ripl/core';

import type {
    ContextOptions,
    ContextPointerEvent,
    ContextPointerType,
    RenderElement,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsString,
} from '@ripl/utilities';

import {
    hasWindow,
    onDOMElementResize,
    onDOMEvent,
} from './dom';

import type {
    DOMElementEventMap,
    DOMEventHandler,
} from './dom';

interface InteractionState {
    left: number;
    top: number;
    pointerButtons: Set<number>;
    activePointers: Set<number>;
    dragElement: RenderElement | undefined;
    dragStartX: number;
    dragStartY: number;
    dragStarted: boolean;
    suppressClick: boolean;
    withinSurface: boolean;
    capturedPointerId: number | undefined;
    scheduleHitTest: ReturnType<typeof createFrameBuffer>;
}

const INTERACTION_KEY = Symbol('interaction');
const DRAG_EVENTS = ['dragstart', 'drag', 'dragend'];
const PRESS_EVENTS = ['mousedown', ...DRAG_EVENTS];

/** DOM-aware rendering context that extends the base `Context` with element mounting, resize observation, and interaction handling. */
export abstract class DOMContext<TElement extends Element = Element, TMeta extends Record<string, unknown> = Record<string, unknown>> extends Context<TElement, TMeta> {

    /** The host DOM element that the context's rendering surface is mounted into. */
    public readonly root: HTMLElement;

    private _interactive: boolean;
    private _interactionEnabled = false;
    private _activeElements = new Set<RenderElement>();
    private _dragThreshold: number;
    private _interactionState?: InteractionState;
    private _originDirty = true;

    constructor(
        type: string,
        target: string | HTMLElement,
        element: TElement,
        options?: ContextOptions<TMeta>
    ) {
        const {
            interactive = true,
            dragThreshold = 3,
        } = options || {};

        super(type, element, options);

        const root = typeIsString(target)
            ? document.querySelector(target) as HTMLElement
            : target;

        if (root.childElementCount > 0) {
            root.innerHTML = '';
        }

        root.appendChild(element);

        this._interactive = interactive;
        this._dragThreshold = dragThreshold;
        this.root = root;
    }

    protected init(): void {
        const {
            width,
            height,
        } = this.element.getBoundingClientRect();

        this.rescale(width, height);

        this.retain(onDOMElementResize(this.root, ({ width, height }) => {
            this._originDirty = true;
            this.rescale(width, height);
        }));

        if (this._interactive) {
            this.enableInteraction();
        }
    }

    private _attachInteractionEvent<TEvent extends keyof DOMElementEventMap<HTMLElement>>(event: TEvent, handler: DOMEventHandler<HTMLElement, TEvent>) {
        this.retain(onDOMEvent(this.element as unknown as HTMLElement, event, handler), INTERACTION_KEY);
    }

    /**
     * Re-reads where the surface sits in the viewport, at most once per invalidation.
     *
     * Pointer coordinates are `clientX/Y` minus this origin, so a stale origin offsets every event.
     * It goes stale two ways: the page scrolls or the layout shifts under a pointer that never
     * leaves, and a surface mounted under a stationary pointer never fires the `mouseenter` that
     * would first record it.
     */
    private _refreshOrigin(force?: boolean): void {
        if (!this._originDirty && !force) {
            return;
        }

        const state = this._interactionState!;

        ({
            left: state.left,
            top: state.top,
        } = this.element.getBoundingClientRect());

        this._originDirty = false;
    }

    /**
     * Unwinds every hovered element, emitting the `mouseleave` each one is owed.
     *
     * The pending hover frame is dropped first: it re-enters whatever the pointer was last over,
     * so flushing before cancelling would hand a `mouseenter` back to an element a frame later —
     * on a context that may by then be torn down.
     */
    private _flushActiveElements(): void {
        this._interactionState?.scheduleHitTest.cancel();

        this._activeElements.forEach(element => element.emit('mouseleave', null));
        this._activeElements.clear();
    }

    private _getLogicalPoint(event: MouseEvent): [number, number] {
        const state = this._interactionState!;

        return [event.clientX - state.left, event.clientY - state.top];
    }

    private _pointerPayload(event: PointerEvent, x: number, y: number): ContextPointerEvent {
        return {
            x,
            y,
            pointerId: event.pointerId,
            pointerType: event.pointerType as ContextPointerType,
            isPrimary: event.isPrimary,
            button: event.button,
            buttons: event.buttons,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
        };
    }

    /**
     * The single gate for context-level enter/leave, so the native events and the ones synthesized
     * during a captured drag cannot double up. Capture retargets moves to the surface and suppresses
     * the browser's own leave, so crossing the edge mid-gesture is only visible here.
     */
    private _setWithinSurface(inside: boolean, event: PointerEvent, x: number, y: number): void {
        const state = this._interactionState!;

        if (state.withinSurface === inside) {
            return;
        }

        state.withinSurface = inside;

        const payload = this._pointerPayload(event, x, y);

        if (inside) {
            this._refreshOrigin(true);
            this.emit('pointerenter', payload);

            if (event.isPrimary) {
                this.emit('mouseenter', null);
            }

            return;
        }

        this._flushActiveElements();
        this.emit('pointerleave', payload);

        if (event.isPrimary) {
            this.emit('mouseleave', null);
        }
    }

    private _handlePointerEnter(event: PointerEvent): void {
        this._refreshOrigin(true);
        this._setWithinSurface(true, event, ...this._getLogicalPoint(event));
    }

    private _handlePointerLeave(event: PointerEvent): void {
        this._flushActiveElements();
        this._setWithinSurface(false, event, ...this._getLogicalPoint(event));
    }

    private _handlePointerDown(event: PointerEvent): void {
        this._refreshOrigin();

        const state = this._interactionState!;
        const [x, y] = this._getLogicalPoint(event);

        state.activePointers.add(event.pointerId);
        this.emit('pointerdown', this._pointerPayload(event, x, y));

        if (!event.isPrimary) {
            return;
        }

        // Capture keeps a drag tracking once it leaves the surface; without it the gesture strands.
        (this.element as unknown as HTMLElement).setPointerCapture?.(event.pointerId);
        state.capturedPointerId = event.pointerId;
        state.withinSurface = true;

        const payload = {
            x,
            y,
        };

        this.emit('mousedown', payload);

        const hitElements = this.hitTest(PRESS_EVENTS, x, y);

        // Assigned unconditionally: a press that hits nothing must not inherit the last gesture's origin.
        state.dragElement = hitElements.find(element => DRAG_EVENTS.some(dragEvent => element.has(dragEvent)));
        state.pointerButtons.add(event.button);
        state.dragStartX = x;
        state.dragStartY = y;
        state.dragStarted = false;
        state.suppressClick = false;

        hitElements.find(element => element.has('mousedown'))?.emit('mousedown', payload);
    }

    private _handlePointerMove(event: PointerEvent): void {
        this._refreshOrigin();

        const state = this._interactionState!;
        const [x, y] = this._getLogicalPoint(event);

        this.emit('pointermove', this._pointerPayload(event, x, y));

        if (!event.isPrimary) {
            return;
        }

        // While captured the browser reports no leave of its own, so the edge crossing is only visible here.
        if (state.capturedPointerId !== undefined) {
            this._setWithinSurface(this._isWithinSurface(x, y), event, x, y);
        } else if (this._isWithinSurface(x, y)) {
            // A move over the surface proves the pointer is on it, even where the enter was missed.
            state.withinSurface = true;
        }

        this.emit('mousemove', {
            x,
            y,
        });

        if (state.dragElement) {
            this._handleDrag(x, y);
        }

        state.scheduleHitTest(() => this._handleHoverHitTest(x, y));
    }

    private _handleDrag(x: number, y: number): void {
        const state = this._interactionState!;
        const dx = x - state.dragStartX;
        const dy = y - state.dragStartY;

        if (!state.dragStarted) {
            if (getEuclideanDistance(dx, dy) >= this._dragThreshold) {
                state.dragStarted = true;

                const payload = {
                    x: state.dragStartX,
                    y: state.dragStartY,
                };

                this.emit('dragstart', payload);
                state.dragElement!.emit('dragstart', payload);
            }

            return;
        }

        const payload = {
            x,
            y,
            startX: state.dragStartX,
            startY: state.dragStartY,
            deltaX: dx,
            deltaY: dy,
        };

        this.emit('drag', payload);
        state.dragElement!.emit('drag', payload);
    }

    private _handleHoverHitTest(x: number, y: number): void {
        const hitElements = this.hitTest(['mousemove', 'mouseenter', 'mouseleave'], x, y);
        const topmost = hitElements.length > 0 ? [hitElements[0]] : [];

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(topmost, [...this._activeElements], (hitElement, activeElement) => {
            return hitElement === activeElement;
        });

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

    /** Whether a logical-space point lies inside the surface, and so will be followed by a `click`. */
    private _isWithinSurface(x: number, y: number): boolean {
        return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
    }

    /**
     * Closes out the gesture in flight, wherever the button was released.
     *
     * Bound at the window as well as the surface, so this can arrive against a state that
     * {@link DOMContext.disableInteraction} has already dropped — hence the null check rather than
     * the non-null assertion the surface-bound handlers use.
     */
    private _handlePointerUp(event: PointerEvent, cancelled?: boolean): void {
        const state = this._interactionState;

        // Per pointer, so every finger of a pinch is released and the double-bound handler dedupes.
        if (state?.activePointers.delete(event.pointerId)) {
            this._refreshOrigin();
            this._releaseCapture(event);
            this.emit(cancelled ? 'pointercancel' : 'pointerup', this._pointerPayload(event, ...this._getLogicalPoint(event)));
        }

        // Per button, so a second button gets its own `mouseup` and the double-bound handler dedupes.
        if (!state?.pointerButtons.delete(event.button)) {
            return;
        }

        const [x, y] = this._getLogicalPoint(event);

        const payload = {
            x,
            y,
        };

        this.emit('mouseup', payload);

        this.hitTest(['mouseup'], x, y).at(0)?.emit('mouseup', payload);

        if (state.dragStarted) {
            const dragPayload = {
                x,
                y,
                startX: state.dragStartX,
                startY: state.dragStartY,
                deltaX: x - state.dragStartX,
                deltaY: y - state.dragStartY,
            };

            this.emit('dragend', dragPayload);
            state.dragElement?.emit('dragend', dragPayload);

            // Only an in-surface release is followed by a `click`; arming otherwise strands the flag onto a later one.
            state.suppressClick = this._isWithinSurface(x, y);
        }

        state.dragElement = undefined;
        state.dragStarted = false;
    }

    /**
     * A gesture the host took over (a browser deciding the touch was a scroll). It ends the same way
     * a release does — a consumer half-way through a drag must not be stranded — but no `click`
     * follows one, so the suppression flag is left alone.
     */
    private _handlePointerCancel(event: PointerEvent): void {
        this._handlePointerUp(event, true);
    }

    /** Hands the pointer back to the browser, so its own leave/enter reporting resumes. */
    private _releaseCapture(event: PointerEvent): void {
        const state = this._interactionState!;

        if (state.capturedPointerId !== event.pointerId) {
            return;
        }

        (this.element as unknown as HTMLElement).releasePointerCapture?.(event.pointerId);
        state.capturedPointerId = undefined;
    }

    private _handleClick(event: MouseEvent): void {
        const state = this._interactionState!;

        // The DOM fires `click` after the `mouseup` that ended the drag; the gesture was not a click.
        if (state.suppressClick) {
            state.suppressClick = false;
            return;
        }

        this._refreshOrigin();

        const [x, y] = this._getLogicalPoint(event);

        const payload = {
            x,
            y,
        };

        this.emit('click', payload);

        this.hitTest(['click'], x, y).at(0)?.emit('click', payload);
    }

    /**
     * Enables interaction events (pointer enter, leave, move, down, up, cancel, click, drag) with
     * element hit testing.
     *
     * Pointer events are the single input source: they cover mouse, pen and touch alike, where the
     * mouse events they replace only reached touch through the browser's compatibility shims. Each
     * one emits its `pointer*` event for every pointer, then — for the primary pointer only — the
     * `mouse*`/`drag*` events with their original payloads, so existing consumers are unchanged and
     * gain touch and pen for free. `click` keeps its own binding; its suppression-after-drag
     * semantics are unrelated.
     */
    public enableInteraction(): void {
        if (this._interactionEnabled) {
            return;
        }

        this._interactionEnabled = true;

        this._interactionState = {
            left: 0,
            top: 0,
            pointerButtons: new Set(),
            activePointers: new Set(),
            dragElement: undefined,
            dragStartX: 0,
            dragStartY: 0,
            dragStarted: false,
            suppressClick: false,
            withinSurface: false,
            capturedPointerId: undefined,
            scheduleHitTest: createFrameBuffer(),
        };

        this._attachInteractionEvent('pointerenter', event => this._handlePointerEnter(event));
        this._attachInteractionEvent('pointerleave', event => this._handlePointerLeave(event));
        this._attachInteractionEvent('pointerdown', event => this._handlePointerDown(event));
        this._attachInteractionEvent('pointermove', event => this._handlePointerMove(event));
        this._attachInteractionEvent('pointerup', event => this._handlePointerUp(event));
        this._attachInteractionEvent('pointercancel', event => this._handlePointerCancel(event));
        this._attachInteractionEvent('click', event => this._handleClick(event));

        if (hasWindow) {
            // Capture phase: a scroll event doesn't bubble, so an ancestor scroll container is only visible here.
            this.retain(onDOMEvent(window, 'scroll', () => this._originDirty = true, {
                capture: true,
                passive: true,
            }), INTERACTION_KEY);

            this.retain(onDOMEvent(window, 'resize', () => this._originDirty = true), INTERACTION_KEY);

            // A release outside the surface never reaches the element, stranding the drag with no `dragend`.
            this.retain(onDOMEvent(window, 'pointerup', event => this._handlePointerUp(event)), INTERACTION_KEY);
            this.retain(onDOMEvent(window, 'pointercancel', event => this._handlePointerCancel(event)), INTERACTION_KEY);
        }

        // Seeded now rather than on the first enter, which never fires for a surface mounted under the pointer.
        this._refreshOrigin(true);
    }

    /** Disables DOM interaction events, unwinding any hover with a final `mouseleave` per element. */
    public disableInteraction(): void {
        if (!this._interactionEnabled) {
            return;
        }

        this._interactionEnabled = false;

        const captured = this._interactionState?.capturedPointerId;

        if (captured !== undefined) {
            (this.element as unknown as HTMLElement).releasePointerCapture?.(captured);
        }

        // Ahead of dropping the state, which holds the frame buffer the flush has to cancel.
        this._flushActiveElements();

        this._interactionState = undefined;
        this.dispose(INTERACTION_KEY);
    }

    /** Destroys the context, removing the DOM element and disposing all resources. */
    public destroy(): void {
        this.disableInteraction();
        this.element.remove();
        super.destroy();
    }

}
