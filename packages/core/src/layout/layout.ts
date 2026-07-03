import {
    Element,
    Group,
    isGroup,
    Scene,
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

import {
    typeIsNumber,
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

/** Intrinsic size of a child measured for layout. */
export interface LayoutSize {
    width: number;
    height: number;
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
 * Abstract base for dynamic layout containers (flex, grid). A `Layout` is an abstract `Group`
 * that positions its children by writing concrete positions onto them: leaf shapes via
 * `translateX/translateY`, and nested layouts via their own `x/y` origin. It reacts to child
 * and configuration changes, coalescing relayout into a single animation frame.
 */
export abstract class Layout<
    TState extends LayoutState = LayoutState,
    TEventMap extends ElementEventMap = ElementEventMap
> extends Group<TState, TEventMap> {

    #applying = false;
    #resolvedWidth = 0;
    #resolvedHeight = 0;
    #requestFrame = createFrameBuffer();

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

        this.retain(this.on('graph', () => this.#schedule()));
        this.retain(this.on('updated', event => this.#onUpdated(event as Event<ElementEventMap['updated']>)));

        this.#schedule();
    }

    #schedule(): void {
        this.#requestFrame(() => this.#runRelayout());
    }

    #runRelayout(): void {
        this.#applying = true;

        try {
            this.relayout();
        } finally {
            this.#applying = false;
        }

        this.#repaint();
    }

    #onUpdated(event: Event<ElementEventMap['updated']>): void {
        if (this.#applying) {
            return;
        }

        const key = event.data.key as string;

        if (event.target === this) {
            if (this.isRelayoutKey(key)) {
                this.#schedule();
            }

            return;
        }

        // Descendant change: a child's applied transform never alters its bounding box, so
        // ignore transform-key echoes (including our own placement writes). Any other change
        // may affect a child's measured size and must trigger a relayout.
        if (!(key in TRANSFORM_DEFAULTS)) {
            this.#schedule();
        }
    }

    #repaint(): void {
        this.#findScene()?.render();
    }

    #findScene(): Scene | undefined {
        let current: Element | undefined = this as unknown as Element;

        while (current) {
            if (current instanceof Scene) {
                return current;
            }

            current = current.parent;
        }

        return undefined;
    }

    /** Records the content size computed by a relayout pass (used by `getBoundingBox`). */
    protected setContentSize(width: number, height: number): void {
        this.#resolvedWidth = width;
        this.#resolvedHeight = height;
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

    /** Measures a child's intrinsic size from its bounding box. */
    protected measureChild(child: Element): LayoutSize {
        const box = child.getBoundingBox();

        return {
            width: box.width,
            height: box.height,
        };
    }

    /** Places a child so the top-left of its bounding box lands at the target coordinates. */
    protected place(child: Element, targetX: number, targetY: number): void {
        const box = child.getBoundingBox();
        const dx = targetX - box.left;
        const dy = targetY - box.top;

        if (isLayout(child)) {
            // Nested layout is abstract, so its own translate is never applied — drive its origin.
            child.x += dx;
            child.y += dy;
            return;
        }

        if (isGroup(child)) {
            // Plain abstract group: offset every leaf descendant's translate by the delta.
            child.graph(false).forEach(leaf => {
                leaf.translateX = (leaf.translateX ?? 0) + dx;
                leaf.translateY = (leaf.translateY ?? 0) + dy;
            });
            return;
        }

        // Leaf shape: translate is applied at render. Absolute assignment keeps relayout idempotent.
        child.translateX = dx;
        child.translateY = dy;
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
        const width = this.state.width ?? this.#resolvedWidth;
        const height = this.state.height ?? this.#resolvedHeight;

        return new Box(this.y, this.x, this.y + height, this.x + width);
    }

    /** Forces a synchronous relayout (useful for tests and per-frame animated reflow). */
    public reflow(): void {
        this.#runRelayout();
    }

}

/** Type guard that checks whether a value is a `Layout` container. */
export function isLayout(value: unknown): value is Layout {
    return value instanceof Layout;
}
