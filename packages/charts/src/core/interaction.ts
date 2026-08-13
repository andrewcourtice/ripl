/**
 * Shared interaction helpers for charts.
 *
 * `applyHoverHighlight` replaces the copy-pasted hover blocks in bar/line/area/scatter/pie that
 * each registered a fresh `mouseleave` listener *inside* every `mouseenter` handler, a bug that
 * leaked and accumulated listeners on every re-render. This helper registers each listener once
 * and disposes any previous registration when re-applied to a persistent element.
 *
 * It also attaches a {@link MarkInteraction} handle to the element, built from the same closures the
 * listeners use and read back with {@link getMarkInteraction}, so a chart's programmatic highlight
 * replays exactly what a hover does instead of reimplementing it.
 */

import type {
    Arc,
    ArcState,
    Ease,
    Element,
    ElementInterpolationState,
    Renderer,
    Transition,
} from '@ripl/core';

import {
    functionNoop,
} from '@ripl/utilities';

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
    /**
     * Toggles the chart-wide highlight for this element, called with `true` when it is highlighted
     * and `false` when it is restored. Unlike `onEnter`/`onLeave` it fires for a programmatic
     * highlight too, so code-driven highlights dim the rest of the chart exactly as hover does.
     */
    onHighlight?: (highlighted: boolean) => void;
    /** Called when the pointer enters the element, with the current pointer position. */
    onEnter?: (point: InteractionPoint) => void;
    /** Called when the pointer leaves the element, with the last known pointer position. */
    onLeave?: (point: InteractionPoint) => void;
    /** Called when the element is clicked, with the pointer position. */
    onClick?: (point: InteractionPoint) => void;
}

/** Overrides for a single {@link MarkInteraction} enter or leave. */
export interface MarkInteractionOptions {
    /** Whether the mark's tooltip is shown (on enter) or hidden (on leave). Defaults to `true`, matching hover. */
    tooltip?: boolean;
    /** Tooltip content to show in place of the mark's own — e.g. the joined content of several matched marks. */
    content?: string;
    /** Transition duration in milliseconds, overriding the timing the chart's `animation` thunk resolves. `0` applies the state synchronously, scheduling no transition. */
    duration?: number;
    /** Called after a pointer has taken this highlight over and the mark has been restored, so the caller can drop its bookkeeping. Only meaningful on {@link MarkInteraction.enter}. */
    onTakeover?: () => void;
}

/**
 * The replayable face of a mark's hover treatment, attached by {@link applyHoverHighlight} and read
 * back with {@link getMarkInteraction}. The element's own `mouseenter`/`mouseleave` handlers drive
 * it too, so a programmatic highlight and a hover run the same code path.
 */
export interface MarkInteraction {
    /**
     * Applies the highlight state, fires the chart-wide highlight and, when asked, shows the mark's
     * tooltip. Returns `false` — having mutated nothing — when the mark is no longer attached to the
     * scene, since transitioning a detached element would never complete.
     */
    enter(options?: MarkInteractionOptions): boolean;
    /** Restores the rest state, releases the chart-wide highlight and hides the tooltip. */
    leave(options?: MarkInteractionOptions): void;
    /** The mark's tooltip anchor, or `undefined` when it has none. */
    anchor(): InteractionPoint | undefined;
    /** The mark's tooltip content, or `undefined` when it has none. */
    content(): string | undefined;
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
const MARK_INTERACTION = Symbol('mark-interaction');

interface HoverHost {
    [HOVER_DISPOSERS]?: { dispose(): void }[];
    [MARK_INTERACTION]?: MarkInteraction;
}

/** Programmatic highlights in flight, per renderer, so a pointer entering any mark can take them over. */
const PROGRAMMATIC_HIGHLIGHTS = new WeakMap<Renderer, Set<() => void>>();

function releaseProgrammaticHighlights(renderer: Renderer): void {
    const active = PROGRAMMATIC_HIGHLIGHTS.get(renderer);

    if (!active?.size) {
        return;
    }

    PROGRAMMATIC_HIGHLIGHTS.delete(renderer);
    Array.from(active).forEach(release => release());
}

/**
 * Returns the replayable hover treatment {@link applyHoverHighlight} attached to an element, or
 * `undefined` when the element has none (it was never made interactive, or its markers are off).
 *
 * @param element - The element to read the handle from.
 * @returns The element's {@link MarkInteraction}, or `undefined`.
 */
export function getMarkInteraction(element: Element): MarkInteraction | undefined {
    return (element as unknown as HoverHost)[MARK_INTERACTION];
}

/**
 * Wires consistent hover behavior (highlight transition + optional tooltip) onto an element, and
 * attaches the {@link MarkInteraction} handle that replays it on demand. Safe to call repeatedly on
 * the same persistent element across renders; prior listeners are disposed and the previous handle
 * replaced, so handlers never accumulate.
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
        onHighlight,
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

    let activeTransition: Transition | undefined;
    let release: (() => void) | undefined;

    const applyState = (state: StateOf<TElement>, overrides?: MarkInteractionOptions) => {
        // Timing stays lazy: the thunk resolves per invocation, and only then does the caller override it.
        const resolved = animation();
        const duration = overrides?.duration ?? resolved.duration;

        activeTransition?.abort();
        activeTransition = undefined;

        if (duration > 0) {
            activeTransition = renderer.transition(element, {
                duration,
                ease: resolved.ease,
                state,
            });

            // Nothing awaits a hover, so swallow the rejection the next `abort()` raises.
            activeTransition.catch(functionNoop);

            return;
        }

        // A zero-duration transition lands a frame later, so write the state and nudge the loop to paint it.
        element.interpolate(state)(1);
        renderer.start();
    };

    const detachProgrammatic = () => {
        if (!release) {
            return;
        }

        PROGRAMMATIC_HIGHLIGHTS.get(renderer)?.delete(release);
        release = undefined;
    };

    const leaveMark = (overrides?: MarkInteractionOptions) => {
        detachProgrammatic();

        if (overrides?.tooltip !== false) {
            tooltip?.hide();
        }

        onHighlight?.(false);

        if (!restore || !element.parent) {
            activeTransition?.abort();
            activeTransition = undefined;
            return;
        }

        applyState(restore, overrides);
    };

    const enterMark = (overrides: MarkInteractionOptions | undefined, programmatic: boolean): boolean => {
        if (!element.parent) {
            return false;
        }

        const text = overrides?.content ?? content?.();

        if (tooltip && anchor && text !== undefined && overrides?.tooltip !== false) {
            const { x, y } = anchor();
            tooltip.show(x, y, text);
        }

        onHighlight?.(true);

        if (highlight) {
            applyState(highlight, overrides);
        }

        if (programmatic) {
            const onTakeover = overrides?.onTakeover;

            detachProgrammatic();
            release = () => {
                release = undefined;
                leaveMark({ duration: 0 });
                onTakeover?.();
            };

            const active = PROGRAMMATIC_HIGHLIGHTS.get(renderer) ?? new Set<() => void>();

            active.add(release);
            PROGRAMMATIC_HIGHLIGHTS.set(renderer, active);
        }

        return true;
    };

    disposers.push(element.on('mouseenter', () => {
        // The pointer owns the chart the moment it reaches a mark, so a code-set highlight steps aside here.
        releaseProgrammaticHighlights(renderer);

        enterMark(undefined, false);
        onEnter?.({ ...pointer });
    }));

    disposers.push(element.on('mouseleave', () => {
        leaveMark();
        onLeave?.({ ...pointer });
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
    host[MARK_INTERACTION] = {
        enter: options => enterMark(options, true),
        leave: options => leaveMark(options),
        anchor: () => anchor?.(),
        content: () => content?.(),
    };
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
 * The typed events a segment reports to the chart around it. They stay bound to the pointer
 * handlers: a programmatic highlight replays the segment's treatment through its
 * {@link MarkInteraction} handle without emitting any of them.
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
}

/**
 * Wires a chart segment's full hover treatment: the tooltip, highlight transition and chart-wide
 * highlight of {@link applyHoverHighlight}, plus the typed enter/leave/click events every segmented
 * chart emits alongside them.
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
        ...hover
    } = options;

    const eventAt = (point: InteractionPoint) => ({
        ...payload,
        x: point.x,
        y: point.y,
    } as TPayload);

    applyHoverHighlight(element, {
        ...hover,
        onEnter: point => onEnter?.(eventAt(point)),
        onLeave: point => onLeave?.(eventAt(point)),
        onClick: point => onClick?.(eventAt(point)),
    } as HoverHighlightOptions & HoverHighlightStates<TElement>);
}
