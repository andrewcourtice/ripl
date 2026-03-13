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
export abstract class DOMContext<TElement extends Element = Element> extends Context<TElement> {

    public readonly root: HTMLElement;

    private interactive: boolean;
    private interactionEnabled = false;
    private activeElements = new Set<RenderElement>();
    private dragThreshold: number;
    private interactionState?: InteractionState;

    constructor(
        type: string,
        target: string | HTMLElement,
        element: TElement,
        options?: ContextOptions
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

        this.interactive = interactive;
        this.dragThreshold = dragThreshold;
        this.root = root;
    }

    protected init() {
        const {
            width,
            height,
        } = this.element.getBoundingClientRect();

        this.rescale(width, height);

        this.retain(onDOMElementResize(this.root, ({ width, height }) => this.rescale(width, height)));

        if (this.interactive) {
            this.enableInteraction();
        }
    }

    private attachInteractionEvent<TEvent extends keyof DOMElementEventMap<HTMLElement>>(event: TEvent, handler: DOMEventHandler<HTMLElement, TEvent>) {
        this.retain(onDOMEvent(this.element as unknown as HTMLElement, event, handler), INTERACTION_KEY);
    }

    private handleMouseEnter(): void {
        const state = this.interactionState!;

        ({
            left: state.left,
            top: state.top,
        } = this.element.getBoundingClientRect());

        this.emit('mouseenter', null);
    }

    private handleMouseLeave(): void {
        this.emit('mouseleave', null);
    }

    private handleMouseDown(event: MouseEvent): void {
        const state = this.interactionState!;
        const rx = event.clientX - state.left;
        const ry = event.clientY - state.top;
        const x = this.scaleX(rx);
        const y = this.scaleY(ry);

        const hitElements = this.hitTest(['dragstart', 'drag', 'dragend'], x, y);

        if (hitElements.length > 0) {
            this.sortByZIndex(hitElements);

            state.dragElement = hitElements[0];
            state.dragStartX = rx;
            state.dragStartY = ry;
            state.dragStarted = false;
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        const state = this.interactionState!;
        const x = event.clientX - state.left;
        const y = event.clientY - state.top;

        this.emit('mousemove', {
            x,
            y,
        });

        if (state.dragElement) {
            this.handleDrag(x, y);
        }

        state.scheduleHitTest(() => this.handleHoverHitTest(x, y));
    }

    private handleDrag(rx: number, ry: number): void {
        const state = this.interactionState!;
        const dx = rx - state.dragStartX;
        const dy = ry - state.dragStartY;

        if (!state.dragStarted) {
            if (getEuclideanDistance(dx, dy) >= this.dragThreshold) {
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

    private handleHoverHitTest(rx: number, ry: number): void {
        const x = this.scaleX(rx);
        const y = this.scaleY(ry);

        const hitElements = this.hitTest(['mousemove', 'mouseenter', 'mouseleave'], x, y);

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(hitElements, [...this.activeElements], (hitElement, activeElement) => hitElement === activeElement);

        entries.forEach(element => {
            this.activeElements.add(element);
            element.emit('mouseenter', null);
        });

        updates.forEach(([element]) => element.emit('mousemove', {
            x: rx,
            y: ry,
        }));

        exits.forEach(element => {
            this.activeElements.delete(element);
            element.emit('mouseleave', null);
        });
    }

    private handleMouseUp(event: MouseEvent): void {
        const state = this.interactionState!;

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

    private handleClick(event: MouseEvent): void {
        const state = this.interactionState!;
        const x = this.scaleX(event.clientX - state.left);
        const y = this.scaleY(event.clientY - state.top);

        const hitElements = this.hitTest(['click'], x, y);

        if (hitElements.length > 0) {
            this.sortByZIndex(hitElements);

            hitElements[0].emit('click', {
                x,
                y,
            });
        }
    }

    /** Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing. */
    public enableInteraction(): void {
        if (this.interactionEnabled) {
            return;
        }

        this.interactionEnabled = true;

        this.interactionState = {
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

        this.attachInteractionEvent('mouseenter', () => this.handleMouseEnter());
        this.attachInteractionEvent('mouseleave', () => this.handleMouseLeave());
        this.attachInteractionEvent('mousedown', event => this.handleMouseDown(event));
        this.attachInteractionEvent('mousemove', event => this.handleMouseMove(event));
        this.attachInteractionEvent('mouseup', event => this.handleMouseUp(event));
        this.attachInteractionEvent('click', event => this.handleClick(event));
    }

    /** Disables DOM interaction events and clears the active element set. */
    public disableInteraction(): void {
        if (!this.interactionEnabled) {
            return;
        }

        this.interactionEnabled = false;
        this.interactionState = undefined;
        this.dispose(INTERACTION_KEY);
        this.activeElements.clear();
    }

    /** Destroys the context, removing the DOM element and disposing all resources. */
    public destroy(): void {
        this.disableInteraction();
        this.element.remove();
        super.destroy();
    }

}
