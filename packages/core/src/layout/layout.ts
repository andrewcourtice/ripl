import {
    Element,
    Group,
    isGroup,
    TRANSFORM_DEFAULTS,
} from '../core';

import type {
    BaseElementState,
    ElementEventMap,
    ElementOptions,
    Event,
} from '../core';

import {
    createFrameBuffer,
} from '../animation';

import {
    Box,
} from '../math';

import type {
    Context,
} from '../context';

import type {
    FlexAlign,
} from './flex';

import {
    typeIsNumber,
    valueOneOrMore,
} from '@ripl/utilities';

import type {
    OneOrMore,
} from '@ripl/utilities';

/** Padding expressed as a uniform number or per-edge values. */
export type LayoutSpacing = number | {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
};

/** Resolved four-edge padding. */
export interface LayoutEdges {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/** Base state shared by all layout containers. */
export interface LayoutState extends BaseElementState {
    x: number;
    y: number;
    width?: number;
    height?: number;
    padding?: LayoutSpacing;
    gap?: number;
}

/** Options for constructing a layout container. */
export type LayoutOptions<TState extends LayoutState = LayoutState> = ElementOptions<TState> & {
    children?: OneOrMore<Element>;
};

/**
 * Per-child layout hints — the Ripl analogue of CSS flex/grid item properties. Set on any element
 * via its `layout` option/property; layout containers read them when positioning that child.
 * Unset fields fall back to the container's own settings.
 */
export interface LayoutItem {
    /** Ordering within the container; lower values are placed first. Ties keep insertion order. Default `0`. */
    order?: number;
    /** Flex grow factor — share of a line's leftover main-axis space. Default `0` (no growth). */
    grow?: number;
    /** Flex shrink factor — share of a line's main-axis overflow to absorb. Default `0` (no shrink). */
    shrink?: number;
    /** Overrides the child's measured main-axis size used as the flex base (CSS `flex-basis`). */
    basis?: number;
    /** Cross-axis alignment for this child, overriding the container's `align`/`alignItems`. */
    alignSelf?: FlexAlign;
    /** Main-axis (grid) alignment for this child, overriding the grid's `justifyItems`. */
    justifySelf?: FlexAlign;
}

/**
 * Abstract base for dynamic layout containers (flex, grid). A `Layout` is an abstract `Group`
 * that positions its children by writing concrete positions onto them: leaf shapes via
 * `translateX/translateY`, and nested layouts via their own `x/y` origin. It reacts to child
 * and configuration changes, coalescing relayout into a single animation frame.
 */
export abstract class Layout<
    TState extends LayoutState = LayoutState,
    TEventMap extends ElementEventMap = ElementEventMap
> extends Group<TState, TEventMap> {

    private _applying = false;
    private _resolvedWidth = 0;
    private _resolvedHeight = 0;
    private _requestFrame = createFrameBuffer();

    public get x(): number {
        return this.state.x ?? 0;
    }

    public set x(value: number) {
        this.setStateValue('x', value);
    }

    public get y(): number {
        return this.state.y ?? 0;
    }

    public set y(value: number) {
        this.setStateValue('y', value);
    }

    public get width(): number | undefined {
        return this.state.width;
    }

    public set width(value: number | undefined) {
        this.setStateValue('width', value as TState['width']);
    }

    public get height(): number | undefined {
        return this.state.height;
    }

    public set height(value: number | undefined) {
        this.setStateValue('height', value as TState['height']);
    }

    public get padding(): LayoutSpacing | undefined {
        return this.state.padding;
    }

    public set padding(value: LayoutSpacing | undefined) {
        this.setStateValue('padding', value as TState['padding']);
    }

    public get gap(): number {
        return this.state.gap ?? 0;
    }

    public set gap(value: number) {
        this.setStateValue('gap', value as TState['gap']);
    }

    protected constructor(type: string, options: LayoutOptions<TState>) {
        super(type, options);

        this.retain(this.on('graph', () => this.schedule()));
        this.retain(this.on('updated', event => this.onUpdated(event as Event<ElementEventMap['updated']>)));

        this.schedule();
    }

    private schedule(): void {
        this._requestFrame(() => this.reflow());
    }

    private onUpdated(event: Event<ElementEventMap['updated']>): void {
        if (this._applying) {
            return;
        }

        const key = event.data.key as string;

        if (event.target === this) {
            if (this.isRelayoutKey(key)) {
                this.schedule();
            }

            return;
        }

        // Descendant change: a child's applied transform never alters its bounding box, so
        // ignore transform-key echoes (including our own placement writes). Any other change
        // may affect a child's measured size and must trigger a relayout.
        if (!(key in TRANSFORM_DEFAULTS)) {
            this.schedule();
        }
    }

    /** Records the content size computed by a relayout pass (used by `getBoundingBox`). */
    protected setContentSize(width: number, height: number): void {
        this._resolvedWidth = width;
        this._resolvedHeight = height;
    }

    /** Resolves the container's padding into explicit per-edge values. */
    protected resolvePadding(): LayoutEdges {
        const padding = this.padding;

        if (typeIsNumber(padding)) {
            return {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            };
        }

        return {
            top: padding?.top ?? 0,
            right: padding?.right ?? 0,
            bottom: padding?.bottom ?? 0,
            left: padding?.left ?? 0,
        };
    }

    /**
     * Children sorted by their `layout.order` hint (default `0`). `children` returns a fresh array,
     * and `Array.prototype.sort` is stable, so equal-order children keep their insertion order.
     */
    protected orderedChildren(): Element[] {
        return this.children.sort((first, second) => (first.layout?.order ?? 0) - (second.layout?.order ?? 0));
    }

    /**
     * Measures a child's current bounding box — the single measurement primitive for layouts.
     * The box carries both size (`width`/`height`) and origin (`left`/`top`), so one measurement
     * feeds both track sizing and placement in a relayout pass.
     */
    protected measureChild(child: Element): Box {
        return child.getBoundingBox();
    }

    /** Places a child so the top-left of its bounding box lands at the target coordinates. */
    protected place(child: Element, targetX: number, targetY: number, box: Box = child.getBoundingBox()): void {
        // `box` may be passed by the caller to avoid re-measuring a child already measured this
        // pass. Only its top-left is used, which is unaffected by any width/height resize applied
        // between measure and placement.
        const dx = targetX - box.left;
        const dy = targetY - box.top;

        if (isLayout(child)) {
            // Nested layout is abstract, so its own translate is never applied — drive its origin.
            child.x += dx;
            child.y += dy;
            return;
        }

        if (isGroup(child)) {
            // Plain abstract group: shift every leaf descendant by the same delta (absolute,
            // so repeated reflows are idempotent). translate stays free for the user.
            child.graph(false).forEach(leaf => leaf.setLayoutOffset(dx, dy));
            return;
        }

        // Leaf shape: the offset is summed with the user's translate at render. Absolute
        // assignment keeps relayout idempotent and leaves translateX/translateY free.
        child.setLayoutOffset(dx, dy);
    }

    /** Whether a change to one of this container's own state keys requires a relayout. */
    protected isRelayoutKey(key: string): boolean {
        return key === 'x'
            || key === 'y'
            || key === 'width'
            || key === 'height'
            || key === 'padding'
            || key === 'gap';
    }

    /** Computes and applies the positions of all children. Implemented per layout mode. */
    protected abstract relayout(): void;

    /** Returns the container's own resolved box, bypassing the composite child box. */
    public getBoundingBox(): Box {
        const width = this.state.width ?? this._resolvedWidth;
        const height = this.state.height ?? this._resolvedHeight;

        return new Box(this.y, this.x, this.y + height, this.x + width);
    }

    /** Removes children, clearing the layout offset this container applied to them. */
    public remove(element: OneOrMore<Element>): void {
        valueOneOrMore(element).forEach(item => {
            if (isLayout(item)) {
                return;
            }

            if (isGroup(item)) {
                item.graph(false).forEach(leaf => leaf.setLayoutOffset(0, 0));
                return;
            }

            item.setLayoutOffset(0, 0);
        });

        super.remove(element);
    }

    /** Renders the laid-out children. Runs a synchronous relayout first so standalone
     * `layout.render(context)` (outside a scene) positions children correctly. */
    public render(context: Context): void {
        this.reflow();
        super.render(context);
    }

    /**
     * Recomputes and applies the positions of all children, then requests a repaint of the owning
     * scene. Runs synchronously — useful for tests and per-frame animated reflow. Relayout is
     * normally coalesced to one call per animation frame; this forces it immediately.
     */
    public reflow(): void {
        this._applying = true;

        try {
            this.relayout();
        } finally {
            this._applying = false;
        }

        // Position-only change: ask the owning scene (an ancestor) to repaint via a bubbling
        // event. Distinct from `graph` so no buffer rebuild/re-sort is triggered. No-op when the
        // layout is standalone (no scene ancestor listening).
        this.emit('repaint', null);
    }

}

/** Type guard that checks whether a value is a `Layout` container. */
export function isLayout(value: unknown): value is Layout {
    return value instanceof Layout;
}
