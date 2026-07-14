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
    onDOMElementResize,
    onDOMEvent,
} from './dom';

import type {
    DOMElementEventMap,
    DOMEventHandler,
} from './dom';

const INTERACTION_KEY = Symbol('interaction');

interface InteractionState {
    left: number;
    top: number;
    dragElement: RenderElement | undefined;
    dragStartX: number;
    dragStartY: number;
    dragPrevX: number;
    dragPrevY: number;
    dragStarted: boolean;
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

        this.retain(onDOMElementResize(this.root, ({ width, height }) => this.rescale(width, height)));

        if (this._interactive) {
            this.enableInteraction();
        }
    }

    private _attachInteractionEvent<TEvent extends keyof DOMElementEventMap<HTMLElement>>(event: TEvent, handler: DOMEventHandler<HTMLElement, TEvent>) {
        this.retain(onDOMEvent(this.element as unknown as HTMLElement, event, handler), INTERACTION_KEY);
    }

    private _handleMouseEnter(): void {
        const state = this._interactionState!;

        ({
            left: state.left,
            top: state.top,
        } = this.element.getBoundingClientRect());

        this.emit('mouseenter', null);
    }

    private _handleMouseLeave(): void {
        this.emit('mouseleave', null);
    }

    private _handleMouseDown(event: MouseEvent): void {
        const state = this._interactionState!;
        const rx = event.clientX - state.left;
        const ry = event.clientY - state.top;
        const x = this.scaleX(rx);
        const y = this.scaleY(ry);

        const hitElements = this.hitTest(['dragstart', 'drag', 'dragend'], x, y);

        if (hitElements.length > 0) {
            state.dragElement = hitElements[0];
            state.dragStartX = rx;
            state.dragStartY = ry;
            state.dragStarted = false;
        }
    }

    private _handleMouseMove(event: MouseEvent): void {
        const state = this._interactionState!;
        const x = event.clientX - state.left;
        const y = event.clientY - state.top;

        this.emit('mousemove', {
            x,
            y,
        });

        if (state.dragElement) {
            this._handleDrag(x, y);
        }

        state.scheduleHitTest(() => this._handleHoverHitTest(x, y));
    }

    private _handleDrag(rx: number, ry: number): void {
        const state = this._interactionState!;
        const dx = rx - state.dragStartX;
        const dy = ry - state.dragStartY;

        if (!state.dragStarted) {
            if (getEuclideanDistance(dx, dy) >= this._dragThreshold) {
                state.dragStarted = true;
                state.dragPrevX = state.dragStartX;
                state.dragPrevY = state.dragStartY;

                const payload = {
                    x: this.scaleX(state.dragStartX),
                    y: this.scaleY(state.dragStartY),
                };

                this.emit('dragstart', payload);
                state.dragElement!.emit('dragstart', payload);
            }

            return;
        }

        const deltaX = rx - state.dragPrevX;
        const deltaY = ry - state.dragPrevY;

        state.dragPrevX = rx;
        state.dragPrevY = ry;

        const payload = {
            x: this.scaleX(rx),
            y: this.scaleY(ry),
            startX: this.scaleX(state.dragStartX),
            startY: this.scaleY(state.dragStartY),
            deltaX,
            deltaY,
        };

        this.emit('drag', payload);
        state.dragElement!.emit('drag', payload);
    }

    private _handleHoverHitTest(rx: number, ry: number): void {
        const x = this.scaleX(rx);
        const y = this.scaleY(ry);

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
            x: rx,
            y: ry,
        }));
    }

    private _handleMouseUp(event: MouseEvent): void {
        const state = this._interactionState!;

        if (state.dragElement && state.dragStarted) {
            const rx = event.clientX - state.left;
            const ry = event.clientY - state.top;
            const deltaX = rx - state.dragPrevX;
            const deltaY = ry - state.dragPrevY;

            const payload = {
                x: this.scaleX(rx),
                y: this.scaleY(ry),
                startX: this.scaleX(state.dragStartX),
                startY: this.scaleY(state.dragStartY),
                deltaX,
                deltaY,
            };

            this.emit('dragend', payload);
            state.dragElement.emit('dragend', payload);
        }

        state.dragElement = undefined;
        state.dragStarted = false;
    }

    private _handleClick(event: MouseEvent): void {
        const state = this._interactionState!;
        const x = this.scaleX(event.clientX - state.left);
        const y = this.scaleY(event.clientY - state.top);

        const hitElements = this.hitTest(['click'], x, y);

        if (hitElements.length > 0) {
            hitElements[0].emit('click', {
                x,
                y,
            });
        }
    }

    /** Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing. */
    public enableInteraction(): void {
        if (this._interactionEnabled) {
            return;
        }

        this._interactionEnabled = true;

        this._interactionState = {
            left: 0,
            top: 0,
            dragElement: undefined,
            dragStartX: 0,
            dragStartY: 0,
            dragPrevX: 0,
            dragPrevY: 0,
            dragStarted: false,
            scheduleHitTest: createFrameBuffer(),
        };

        this._attachInteractionEvent('mouseenter', () => this._handleMouseEnter());
        this._attachInteractionEvent('mouseleave', () => this._handleMouseLeave());
        this._attachInteractionEvent('mousedown', event => this._handleMouseDown(event));
        this._attachInteractionEvent('mousemove', event => this._handleMouseMove(event));
        this._attachInteractionEvent('mouseup', event => this._handleMouseUp(event));
        this._attachInteractionEvent('click', event => this._handleClick(event));
    }

    /** Disables DOM interaction events and clears the active element set. */
    public disableInteraction(): void {
        if (!this._interactionEnabled) {
            return;
        }

        this._interactionEnabled = false;
        this._interactionState = undefined;
        this.dispose(INTERACTION_KEY);
        this._activeElements.clear();
    }

    /** Destroys the context, removing the DOM element and disposing all resources. */
    public destroy(): void {
        this.disableInteraction();
        this.element.remove();
        super.destroy();
    }

}
