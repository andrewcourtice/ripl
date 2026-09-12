import {
    hasWindow,
} from '@ripl/dom';

import {
    createFrameBuffer,
    createGroup,
} from '@ripl/web';

import type {
    Context,
    Element,
    FrameBuffer,
    Group,
    Renderer,
    Scene,
} from '@ripl/web';

/** Resolves the group a DOM container currently stands for, so a conditionally rendered scene stays correct. */
type RiplContainerResolver = () => Group | undefined;

// `Group.set` detaches and re-adds every child, rebuilding the scene buffer twice — and the mirror
// is observed for plain mounts too, which already left the order correct.
function isSameOrder(current: readonly Element[], next: readonly Element[]): boolean {
    return current.length === next.length && current.every((element, index) => element === next[index]);
}

/**
 * Coordinates one context's declarative tree: which group each element belongs to, which paint
 * tier is in effect, and when to repaint.
 *
 * A hidden DOM mirror of the declarative tree is observed for child-list changes, and the affected
 * group is re-ordered from it. That is what keeps paint order tracking the declaration when a
 * framework cannot supply it directly: a keyed list reorder moves components rather than
 * remounting them, so the group's `Set` goes stale, and effects that run children-first attach in
 * the wrong order to begin with.
 */
export class RiplTree {

    private _containers = new WeakMap<HTMLElement, RiplContainerResolver>();
    private _markers = new WeakMap<HTMLElement, Element>();
    private _leaving = new Map<Group, Set<Element>>();
    private _dirty = new Set<HTMLElement>();
    private _entering: (() => void)[] = [];
    private _observer?: MutationObserver;
    private _syncFrame: FrameBuffer = createFrameBuffer();
    private _paintFrame: FrameBuffer = createFrameBuffer();
    private _mounted = false;
    private _disposing = false;
    private _enterScheduled = false;
    private _attachHandlers: (() => void)[] = [];

    /** The rendering context this tree draws to, once the host element has been created. */
    public context?: Context;

    /** The scene this tree draws through, when a scene component was declared. */
    public scene?: Scene;

    /** The renderer driving this tree, when a renderer component was declared. */
    public renderer?: Renderer;

    /** The group that owns elements declared directly under the context, with no scene between. */
    public readonly rootGroup: Group = createGroup();

    /** Whether the host element is in the document, so work deferred for it can run. */
    public get mounted(): boolean {
        return this._mounted;
    }

    /** The group new top-level elements attach to: the scene when there is one, else the root group. */
    public get parent(): Group {
        return this.scene ?? this.rootGroup;
    }

    /**
     * Whether the whole tree is being torn down, in which case a leaving element should be
     * destroyed outright. A framework tears a tree down parent-first, so the context marks this
     * before any descendant could start a transition that the renderer, destroyed moments later,
     * would never finish.
     */
    public get disposing(): boolean {
        return this._disposing;
    }

    private _handleMutations(mutations: MutationRecord[]): void {
        mutations.forEach(({ target }) => {
            if (this._containers.has(target as HTMLElement)) {
                this._dirty.add(target as HTMLElement);
            }
        });

        if (!this._dirty.size) {
            return;
        }

        this._syncFrame(() => this.flush());
    }

    private _sync(container: HTMLElement): boolean {
        const group = this._containers.get(container)?.();

        if (!group) {
            return false;
        }

        const children = Array.from(container.children)
            .map(child => this._markers.get(child as HTMLElement))
            .filter((element): element is Element => !!element);

        // A leaving element has already unmounted, so it has no marker; re-append it or its
        // transition would be cut short by the reorder that removed it.
        const leaving = this._leaving.get(group);
        const next = leaving ? children.concat(Array.from(leaving)) : children;

        if (isSameOrder(group.children, next)) {
            return false;
        }

        group.set(next);

        return true;
    }

    private _paint(): void {
        const scene = this.scene;

        if (scene) {
            scene.render();
            return;
        }

        const context = this.context;

        if (!context) {
            return;
        }

        context.batch(() => this.rootGroup.render(context));
    }

    /**
     * Maps a DOM container in the hidden mirror onto the group it represents.
     *
     * @param container - The marker element whose children mirror the group's children.
     * @param resolve - Resolves the group, re-evaluated on each sync.
     */
    public registerContainer(container: HTMLElement, resolve: RiplContainerResolver): void {
        this._containers.set(container, resolve);
    }

    /** Drops a container registration, so a removed group stops being synced. */
    public releaseContainer(container: HTMLElement): void {
        this._containers.delete(container);
        this._dirty.delete(container);
    }

    /** Associates an element's marker node with the element, keying the reorder sync. */
    public registerMarker(marker: HTMLElement, element: Element): void {
        this._markers.set(marker, element);
    }

    /** Drops a marker registration. */
    public releaseMarker(marker: HTMLElement): void {
        this._markers.delete(marker);
    }

    /** Marks a container's group as needing its order replayed from the mirror on the next frame. */
    public invalidateContainer(container: HTMLElement): void {
        this._dirty.add(container);
        this._syncFrame(() => this.flush());
    }

    /**
     * Replays the mirror's order onto every group marked dirty since the last flush, repainting if
     * any of them actually moved.
     *
     * The repaint is not redundant: under a scene, `Group.set` emits `graph` and the scene rebuilds
     * itself, but a bare context has nothing listening, so a reorder landing after that frame's
     * paint would otherwise show stale order until something unrelated changed.
     */
    public flush(): void {
        const containers = Array.from(this._dirty);

        this._dirty.clear();

        const changed = containers.reduce((result, container) => this._sync(container) || result, false);

        if (changed) {
            this.requestPaint();
        }
    }

    /**
     * Defers an element's enter phase until every sibling committed in the same batch has
     * registered with the transition scope, which is what makes a staggered `delay: index / length`
     * span the whole set. Flushed on a microtask, so it still lands before any frame-buffered paint.
     */
    public queueEnter(handler: () => void): void {
        this._entering.push(handler);

        if (this._enterScheduled) {
            return;
        }

        this._enterScheduled = true;
        queueMicrotask(() => this.flushEnters());
    }

    /** Runs every enter phase queued since the last flush. */
    public flushEnters(): void {
        const handlers = this._entering;

        this._entering = [];
        this._enterScheduled = false;

        handlers.forEach(handler => handler());
    }

    /**
     * Registers work that can only run once the host element is in the document, such as reading a
     * computed style off it. Descendants may mount before the context does, so they cannot do this
     * themselves — and a descendant that mounts *after* it runs the work straight away.
     */
    public onAttached(handler: () => void): void {
        if (this._mounted) {
            handler();
            return;
        }

        this._attachHandlers.push(handler);
    }

    /**
     * Marks the host element mounted, runs the deferred attach handlers, and starts observing the
     * hidden mirror for the reorders declaration order cannot account for.
     */
    public attach(graph: HTMLElement): void {
        // The mirror root stands for whichever group owns the top level, which a conditionally
        // rendered scene can change, so it resolves lazily rather than being captured here.
        this.registerContainer(graph, () => this.parent);

        this._mounted = true;
        this._attachHandlers.forEach(handler => handler());
        this._attachHandlers = [];

        if (!hasWindow || typeof MutationObserver === 'undefined') {
            return;
        }

        this._observer = new MutationObserver(mutations => this._handleMutations(mutations));
        this._observer.observe(graph, {
            childList: true,
            subtree: true,
        });
    }

    /** Holds an unmounted element in its group until its leave transition finishes. */
    public retainLeaving(group: Group, element: Element): void {
        const elements = this._leaving.get(group) ?? new Set<Element>();

        elements.add(element);
        this._leaving.set(group, elements);
    }

    /** Releases an element held for a leave transition. */
    public releaseLeaving(group: Group, element: Element): void {
        const elements = this._leaving.get(group);

        if (!elements) {
            return;
        }

        elements.delete(element);

        if (!elements.size) {
            this._leaving.delete(group);
        }
    }

    /**
     * Schedules a repaint through the highest tier available: a renderer paints on its own loop and
     * only needs waking, a scene repaints on the next frame, and a bare context repaints its root
     * group. A state-only change never wakes a stopped renderer on its own — only graph events,
     * pointer movement and transitions do — so the renderer tier restarts the loop explicitly.
     */
    public requestPaint(): void {
        const renderer = this.renderer;

        if (renderer) {
            // Waking the loop is not enough on its own: the renderer skips the paint on a frame
            // where nothing is dirty, and a plain field carries no state change to dirty it with.
            this.scene?.invalidate();
            renderer.start();
            return;
        }

        this._paintFrame(() => this._paint());
    }

    /** Marks the tree as tearing down, so leaving elements skip their transition. */
    public dispose(): void {
        this._disposing = true;
    }

    /** Tears down the observer, pending frames and the root group. */
    public destroy(): void {
        this._observer?.disconnect();
        this._observer = undefined;
        this._syncFrame.cancel();
        this._paintFrame.cancel();
        this._dirty.clear();
        this._leaving.clear();
        this._entering = [];
        this.rootGroup.destroy();
    }

}

/** Creates a {@link RiplTree}, the per-context coordinator for a declarative Ripl graph. */
export function createRiplTree(): RiplTree {
    return new RiplTree();
}
