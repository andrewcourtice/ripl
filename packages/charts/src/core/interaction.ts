/**
 * Shared interaction helpers for charts.
 *
 * `applyHoverHighlight` replaces the copy-pasted hover blocks in bar/line/area/scatter/pie that
 * each registered a fresh `mouseleave` listener *inside* every `mouseenter` handler, a bug that
 * leaked and accumulated listeners on every re-render. This helper registers each listener once
 * and disposes any previous registration when re-applied to a persistent element.
 */

import type {
    Arc,
    ArcState,
    Ease,
    Element,
    ElementInterpolationState,
    Renderer,
} from '@ripl/core';

/** Minimal tooltip surface required by the hover helper (decouples it from the Tooltip class). */
export interface HoverTooltip {
    /** Shows the tooltip at the given position with the given content. */
    show(x: number, y: number, content: string): void;
    /** Hides the tooltip. */
    hide(): void;
}

type StateOf<TElement extends Element> = ElementInterpolationState<TElement extends Element<infer TState> ? TState : never>;

/** The pointer position passed to interaction callbacks. */
export interface InteractionPoint {
    /** Pointer x coordinate, in logical pixels (CSS pixels relative to the context's top-left, unaffected by the device pixel ratio). */
    x: number;
    /** Pointer y coordinate, in logical pixels (CSS pixels relative to the context's top-left, unaffected by the device pixel ratio). */
    y: number;
}

/** Options describing how an element should respond to hover, beyond its {@link HoverHighlightStates}. */
export interface HoverHighlightOptions {
    /** Renderer used to run the highlight/restore transitions. */
    renderer: Renderer;
    /**
     * Resolves the highlight/restore transition timing lazily, at hover time. Resolving on each
     * hover (rather than baking a value in when the handler is bound) keeps navigator-driven
     * animation suppression from freezing the hover into an instant snap.
     */
    animation: () => {
        /** Duration of the highlight/restore transition, in milliseconds. */
        duration: number;
        /** Easing applied to the highlight/restore transition. */
        ease: Ease;
    };
    /** Optional tooltip to show/hide alongside the highlight. */
    tooltip?: HoverTooltip;
    /** Resolves the tooltip anchor point (called on enter). */
    anchor?: () => {
        /** X coordinate of the tooltip anchor, in logical pixels. */
        x: number;
        /** Y coordinate of the tooltip anchor, in logical pixels. */
        y: number;
    };
    /** Resolves the tooltip content (called on enter). */
    content?: () => string;
    /** Called when the pointer enters the element, with the current pointer position. */
    onEnter?: (point: InteractionPoint) => void;
    /** Called when the pointer leaves the element, with the last known pointer position. */
    onLeave?: (point: InteractionPoint) => void;
    /** Called when the element is clicked, with the pointer position. */
    onClick?: (point: InteractionPoint) => void;
}

/**
 * The pair of states a hover transitions between, given together or not at all: an element handed a
 * `highlight` without the `restore` that undoes it would be stranded highlighted once the pointer left.
 *
 * @typeParam TElement - The element type the states are applied to.
 */
export type HoverHighlightStates<TElement extends Element> = {
    /** Target state applied while hovered. */
    highlight: StateOf<TElement>;
    /** Target state applied when the pointer leaves, undoing `highlight`. */
    restore: StateOf<TElement>;
} | {
    /** Omitted for a chart whose hover treatment is carried entirely by `onEnter`/`onLeave`. */
    highlight?: undefined;
    /** Omitted alongside `highlight`. */
    restore?: undefined;
};

const HOVER_DISPOSERS = Symbol('hover-disposers');

interface HoverHost {
    [HOVER_DISPOSERS]?: { dispose(): void }[];
}

/**
 * Wires consistent hover behavior (highlight transition + optional tooltip) onto an element.
 * Safe to call repeatedly on the same persistent element across renders; prior listeners are
 * disposed first so handlers never accumulate.
 */
export function applyHoverHighlight<TElement extends Element>(
    element: TElement,
    options: HoverHighlightOptions & HoverHighlightStates<TElement>
): void {
    const host = element as unknown as HoverHost;

    host[HOVER_DISPOSERS]?.forEach(disposer => disposer.dispose());

    const {
        renderer,
        animation,
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

    // `mouseenter`/`mouseleave` carry no coordinates, so track the latest position for them.
    const pointer: InteractionPoint = {
        x: 0,
        y: 0,
    };
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

        if (!highlight) {
            return;
        }

        const { duration, ease } = animation();

        renderer.transition(element, {
            duration,
            ease,
            state: highlight,
        });
    }));

    disposers.push(element.on('mouseleave', () => {
        tooltip?.hide();

        onLeave?.({ ...pointer });

        if (!restore) {
            return;
        }

        const { duration, ease } = animation();

        renderer.transition(element, {
            duration,
            ease,
            state: restore,
        });
    }));

    if (onClick) {
        disposers.push(element.on('click', event => {
            const data = event.data as InteractionPoint | null;
            onClick(data ? {
                x: data.x,
                y: data.y,
            } : { ...pointer });
        }));
    }

    host[HOVER_DISPOSERS] = disposers;
}

/**
 * Anchors a tooltip at an arc's centroid, measured against the geometry the arc is animating
 * toward rather than its current frame, so a tooltip opened mid-transition lands where the
 * segment settles rather than where it happens to be.
 *
 * @param arc - The arc to anchor against.
 * @returns An {@link HoverHighlightOptions.anchor} resolver.
 */
export function arcCentroidAnchor(arc: Arc): () => InteractionPoint {
    return () => {
        const [x, y] = arc.getCentroid(arc.data as Partial<ArcState>);

        return {
            x,
            y,
        };
    };
}

/**
 * How a segment reports its hover to the chart around it: the typed event it emits and the
 * chart-wide highlight it drives.
 *
 * @typeParam TPayload - The chart's interaction event payload, which carries the pointer position.
 */
export interface SegmentInteractionOptions<TPayload extends InteractionPoint> {
    /** The event's pointer-independent fields; `x`/`y` are filled in from the pointer per event. */
    payload: Omit<TPayload, 'x' | 'y'>;
    /** Emits the chart's enter event for the segment. */
    onEnter?: (event: TPayload) => void;
    /** Emits the chart's leave event for the segment. */
    onLeave?: (event: TPayload) => void;
    /** Emits the chart's click event for the segment. */
    onClick?: (event: TPayload) => void;
    /**
     * Toggles the chart-wide highlight for the hovered segment, called with `true` on enter and
     * `false` on leave. Charts whose segments are already solid at rest use it so the hover reads
     * as the other segments dimming rather than this one lifting.
     */
    onHighlight?: (hovered: boolean) => void;
}

/**
 * Wires a chart segment's full hover treatment: the tooltip and highlight transition of
 * {@link applyHoverHighlight}, plus the typed enter/leave/click events and the chart-wide highlight
 * every segmented chart emits alongside them.
 *
 * @typeParam TElement - The element type the hover is attached to.
 * @typeParam TPayload - The chart's interaction event payload.
 * @param element - The segment element to make interactive.
 * @param options - The hover treatment, together with the events the segment reports.
 */
export function applySegmentInteraction<TElement extends Element, TPayload extends InteractionPoint>(
    element: TElement,
    options: Omit<HoverHighlightOptions, 'onEnter' | 'onLeave' | 'onClick'>
        & HoverHighlightStates<TElement>
        & SegmentInteractionOptions<TPayload>
): void {
    const {
        payload,
        onEnter,
        onLeave,
        onClick,
        onHighlight,
        ...hover
    } = options;

    const eventAt = (point: InteractionPoint) => ({
        ...payload,
        x: point.x,
        y: point.y,
    } as TPayload);

    applyHoverHighlight(element, {
        ...hover,
        onEnter: point => {
            onHighlight?.(true);
            onEnter?.(eventAt(point));
        },
        onLeave: point => {
            onHighlight?.(false);
            onLeave?.(eventAt(point));
        },
        onClick: point => onClick?.(eventAt(point)),
    } as HoverHighlightOptions & HoverHighlightStates<TElement>);
}
