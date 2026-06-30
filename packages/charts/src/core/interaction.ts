/**
 * Shared interaction helpers for charts.
 *
 * `applyHoverHighlight` replaces the copy-pasted hover blocks in bar/line/area/scatter/pie that
 * each registered a fresh `mouseleave` listener *inside* every `mouseenter` handler — a bug that
 * leaked and accumulated listeners on every re-render. This helper registers each listener once
 * and disposes any previous registration when re-applied to a persistent element.
 */

import type {
    Ease,
    Element,
    ElementInterpolationState,
    Renderer,
} from '@ripl/core';

/** Minimal tooltip surface required by the hover helper (decouples it from the Tooltip class). */
export interface HoverTooltip {
    show(x: number, y: number, content: string): void;
    hide(): void;
}

type StateOf<TElement extends Element> = ElementInterpolationState<TElement extends Element<infer TState> ? TState : never>;

/** The pointer position passed to interaction callbacks. */
export interface InteractionPoint {
    x: number;
    y: number;
}

/** Options describing how an element should respond to hover. */
export interface HoverHighlightOptions<TElement extends Element> {
    renderer: Renderer;
    duration: number;
    ease: Ease;
    /** Target state applied while hovered. */
    highlight: StateOf<TElement>;
    /** Target state applied when the pointer leaves. */
    restore: StateOf<TElement>;
    /** Optional tooltip to show/hide alongside the highlight. */
    tooltip?: HoverTooltip;
    /** Resolves the tooltip anchor point (called on enter). */
    anchor?: () => { x: number;
        y: number; };
    /** Resolves the tooltip content (called on enter). */
    content?: () => string;
    /** Called when the pointer enters the element, with the current pointer position. */
    onEnter?: (point: InteractionPoint) => void;
    /** Called when the pointer leaves the element, with the last known pointer position. */
    onLeave?: (point: InteractionPoint) => void;
    /** Called when the element is clicked, with the pointer position. */
    onClick?: (point: InteractionPoint) => void;
}

const HOVER_DISPOSERS = Symbol('hover-disposers');

interface HoverHost {
    [HOVER_DISPOSERS]?: { dispose(): void }[];
}

/**
 * Wires consistent hover behaviour (highlight transition + optional tooltip) onto an element.
 * Safe to call repeatedly on the same persistent element across renders — prior listeners are
 * disposed first so handlers never accumulate.
 */
export function applyHoverHighlight<TElement extends Element>(
    element: TElement,
    options: HoverHighlightOptions<TElement>
): void {
    const host = element as unknown as HoverHost;

    host[HOVER_DISPOSERS]?.forEach(disposer => disposer.dispose());

    const {
        renderer,
        duration,
        ease,
        highlight,
        restore,
        tooltip,
        anchor,
        content,
        onEnter,
        onLeave,
        onClick,
    } = options;

    const disposers: { dispose(): void }[] = [];

    // Tracks the latest pointer position so enter/leave callbacks can report a meaningful
    // location (the `mouseenter`/`mouseleave` events themselves carry no coordinates).
    const pointer: InteractionPoint = { x: 0, y: 0 };
    const wantsPointer = !!(onEnter || onLeave || onClick);

    if (wantsPointer) {
        disposers.push(element.on('mousemove', event => {
            const data = event.data as InteractionPoint | null;

            if (data) {
                pointer.x = data.x;
                pointer.y = data.y;
            }
        }));
    }

    disposers.push(element.on('mouseenter', () => {
        if (tooltip && anchor && content) {
            const { x, y } = anchor();
            tooltip.show(x, y, content());
        }

        onEnter?.({ ...pointer });

        renderer.transition(element, {
            duration,
            ease,
            state: highlight,
        });
    }));

    disposers.push(element.on('mouseleave', () => {
        tooltip?.hide();

        onLeave?.({ ...pointer });

        renderer.transition(element, {
            duration,
            ease,
            state: restore,
        });
    }));

    if (onClick) {
        disposers.push(element.on('click', event => {
            const data = event.data as InteractionPoint | null;
            onClick(data ? { x: data.x, y: data.y } : { ...pointer });
        }));
    }

    host[HOVER_DISPOSERS] = disposers;
}
