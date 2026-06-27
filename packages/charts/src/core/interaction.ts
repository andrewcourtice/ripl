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
    anchor?: () => { x: number; y: number };
    /** Resolves the tooltip content (called on enter). */
    content?: () => string;
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
    } = options;

    const enter = element.on('mouseenter', () => {
        if (tooltip && anchor && content) {
            const { x, y } = anchor();
            tooltip.show(x, y, content());
        }

        renderer.transition(element, {
            duration,
            ease,
            state: highlight,
        });
    });

    const leave = element.on('mouseleave', () => {
        tooltip?.hide();

        renderer.transition(element, {
            duration,
            ease,
            state: restore,
        });
    });

    host[HOVER_DISPOSERS] = [enter, leave];
}
