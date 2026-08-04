import {
    Context,
    createFrameBuffer,
    getEuclideanDistance,
} from '@ripl/core';

import type {
    ContextOptions,
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

const INTERACTION_KEY = Symbol('interaction');
const DRAG_EVENTS = ['dragstart', 'drag', 'dragend'];
const PRESS_EVENTS = ['mousedown', ...DRAG_EVENTS];

interface InteractionState {
    left: number;
    top: number;
    pointerButtons: Set<number>;
    dragElement: RenderElement | undefined;
    dragStartX: number;
    dragStartY: number;
    dragPrevX: number;
    dragPrevY: number;
    dragStarted: boolean;
    suppressClick: boolean;
    scheduleHitTest: ReturnType<typeof createFrameBuffer>;
}

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

    private _handleMouseEnter(): void {
        this._refreshOrigin(true);
        this.emit('mouseenter', null);
    }

    private _handleMouseLeave(): void {
        this._flushActiveElements();
        this.emit('mouseleave', null);
    }

    private _getLogicalPoint(event: MouseEvent): [number, number] {
        const state = this._interactionState!;

        return [event.clientX - state.left, event.clientY - state.top];
    }

    private _hitTestLogical(events: string[], x: number, y: number): RenderElement[] {
        return this.hitTest(events, ...this.toSurfacePoint(x, y));
    }

    private _handleMouseDown(event: MouseEvent): void {
        this._refreshOrigin();

        const state = this._interactionState!;
        const [x, y] = this._getLogicalPoint(event);

        const payload = {
            x,
            y,
        };

        this.emit('mousedown', payload);

        const hitElements = this._hitTestLogical(PRESS_EVENTS, x, y);

        // Assigned unconditionally: a press that hits nothing must not inherit the last gesture's origin.
        state.dragElement = hitElements.find(element => DRAG_EVENTS.some(dragEvent => element.has(dragEvent)));
        state.pointerButtons.add(event.button);
        state.dragStartX = x;
        state.dragStartY = y;
        state.dragStarted = false;
        state.suppressClick = false;

        hitElements.find(element => element.has('mousedown'))?.emit('mousedown', payload);
    }

    private _handleMouseMove(event: MouseEvent): void {
        this._refreshOrigin();

        const state = this._interactionState!;
        const [x, y] = this._getLogicalPoint(event);

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
                state.dragPrevX = state.dragStartX;
                state.dragPrevY = state.dragStartY;

                const payload = {
                    x: state.dragStartX,
                    y: state.dragStartY,
                };

                this.emit('dragstart', payload);
                state.dragElement!.emit('dragstart', payload);
            }

            return;
        }

        const deltaX = x - state.dragPrevX;
        const deltaY = y - state.dragPrevY;

        state.dragPrevX = x;
        state.dragPrevY = y;

        const payload = {
            x,
            y,
            startX: state.dragStartX,
            startY: state.dragStartY,
            deltaX,
            deltaY,
        };

        this.emit('drag', payload);
        state.dragElement!.emit('drag', payload);
    }

    private _handleHoverHitTest(x: number, y: number): void {
        const hitElements = this._hitTestLogical(['mousemove', 'mouseenter', 'mouseleave'], x, y);
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
    private _handleMouseUp(event: MouseEvent): void {
        const state = this._interactionState;

        // Per button, so a second button gets its own `mouseup` and the double-bound handler dedupes.
        if (!state?.pointerButtons.delete(event.button)) {
            return;
        }

        this._refreshOrigin();

        const [x, y] = this._getLogicalPoint(event);

        const payload = {
            x,
            y,
        };

        this.emit('mouseup', payload);

        this._hitTestLogical(['mouseup'], x, y).at(0)?.emit('mouseup', payload);

        if (state.dragStarted) {
            const dragPayload = {
                x,
                y,
                startX: state.dragStartX,
                startY: state.dragStartY,
                deltaX: x - state.dragPrevX,
                deltaY: y - state.dragPrevY,
            };

            this.emit('dragend', dragPayload);
            state.dragElement?.emit('dragend', dragPayload);

            // Only an in-surface release is followed by a `click`; arming otherwise strands the flag onto a later one.
            state.suppressClick = this._isWithinSurface(x, y);
        }

        state.dragElement = undefined;
        state.dragStarted = false;
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

        this._hitTestLogical(['click'], x, y).at(0)?.emit('click', payload);
    }

    /** Enables DOM interaction events (mouse enter, leave, move, down, up, click, drag) with element hit testing. */
    public enableInteraction(): void {
        if (this._interactionEnabled) {
            return;
        }

        this._interactionEnabled = true;

        this._interactionState = {
            left: 0,
            top: 0,
            pointerButtons: new Set(),
            dragElement: undefined,
            dragStartX: 0,
            dragStartY: 0,
            dragPrevX: 0,
            dragPrevY: 0,
            dragStarted: false,
            suppressClick: false,
            scheduleHitTest: createFrameBuffer(),
        };

        this._attachInteractionEvent('mouseenter', () => this._handleMouseEnter());
        this._attachInteractionEvent('mouseleave', () => this._handleMouseLeave());
        this._attachInteractionEvent('mousedown', event => this._handleMouseDown(event));
        this._attachInteractionEvent('mousemove', event => this._handleMouseMove(event));
        this._attachInteractionEvent('mouseup', event => this._handleMouseUp(event));
        this._attachInteractionEvent('click', event => this._handleClick(event));

        if (hasWindow) {
            // Capture phase: a scroll event doesn't bubble, so an ancestor scroll container is only visible here.
            this.retain(onDOMEvent(window, 'scroll', () => this._originDirty = true, {
                capture: true,
                passive: true,
            }), INTERACTION_KEY);

            this.retain(onDOMEvent(window, 'resize', () => this._originDirty = true), INTERACTION_KEY);

            // A release outside the surface never reaches the element, stranding the drag with no `dragend`.
            this.retain(onDOMEvent(window, 'mouseup', event => this._handleMouseUp(event)), INTERACTION_KEY);
        }

        // Seeded now rather than on the first `mouseenter`, which never fires for a surface mounted under the pointer.
        this._refreshOrigin(true);
    }

    /** Disables DOM interaction events, unwinding any hover with a final `mouseleave` per element. */
    public disableInteraction(): void {
        if (!this._interactionEnabled) {
            return;
        }

        this._interactionEnabled = false;

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
