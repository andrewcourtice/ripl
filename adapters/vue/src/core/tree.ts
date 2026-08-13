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

import {
    markRaw,
    shallowRef,
} from 'vue';

import type {
    ShallowRef,
} from 'vue';

/** Resolves the group a DOM container currently stands for, so a `v-if`'d scene stays correct. */
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
 * Elements attach themselves during `setup()`, which Vue runs top-down and in template order, so
 * the initial paint order is correct without any bookkeeping. This class exists for what `setup()`
 * cannot see: a keyed `v-for` reorder moves components rather than remounting them, so the group's
 * `Set` goes stale. A hidden DOM mirror of the declarative tree is observed for child-list changes
 * and the affected group is re-ordered from it.
 */
export class RiplTree {

    private _containers = new WeakMap<HTMLElement, RiplContainerResolver>();
    private _markers = new WeakMap<HTMLElement, Element>();
    private _leaving = new Map<Group, Set<Element>>();
    private _dirty = new Set<HTMLElement>();
    private _observer?: MutationObserver;
    private _syncFrame: FrameBuffer = createFrameBuffer();
    private _paintFrame: FrameBuffer = createFrameBuffer();
    private _mounted = false;
    private _disposing = false;
    private _attached: (() => void)[] = [];

    /** The rendering context this tree draws to, once the host element has been created. */
    public readonly context: ShallowRef<Context | undefined> = shallowRef<Context>();

    /** The scene this tree draws through, when a scene component was declared. */
    public readonly scene: ShallowRef<Scene | undefined> = shallowRef<Scene>();

    /** The renderer driving this tree, when a renderer component was declared. */
    public readonly renderer: ShallowRef<Renderer | undefined> = shallowRef<Renderer>();

    /** The group that owns elements declared directly under the context, with no scene between. */
    public readonly rootGroup: Group = markRaw(createGroup());

    /** Whether the context component has mounted, which gates the `appear` transition phase. */
    public get mounted(): boolean {
        return this._mounted;
    }

    /** The group new top-level elements attach to: the scene when there is one, else the root group. */
    public get parent(): Group {
        return this.scene.value ?? this.rootGroup;
    }

    /**
     * Whether the whole tree is being torn down, in which case a leaving element should be
     * destroyed outright. Vue runs `beforeUnmount` parent-first, so the context sets this before
     * any descendant's `unmounted` hook could start a transition that the renderer, destroyed
     * moments later, would never finish.
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

        this._syncFrame(() => this._flush());
    }

    private _flush(): void {
        const containers = Array.from(this._dirty);

        this._dirty.clear();
        containers.forEach(container => this._sync(container));
    }

    private _sync(container: HTMLElement): void {
        const group = this._containers.get(container)?.();

        if (!group) {
            return;
        }

        const children = Array.from(container.children)
            .map(child => this._markers.get(child as HTMLElement))
            .filter((element): element is Element => !!element);

        // A leaving element has already unmounted, so it has no marker; re-append it or its
        // transition would be cut short by the reorder that removed it.
        const leaving = this._leaving.get(group);
        const next = leaving ? children.concat(Array.from(leaving)) : children;

        if (isSameOrder(group.children, next)) {
            return;
        }

        group.set(next);
    }

    private _paint(): void {
        const scene = this.scene.value;

        if (scene) {
            scene.render();
            return;
        }

        const context = this.context.value;

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
     * Registers work that can only run once the host element is in the document, such as reading a
     * computed style off it. Descendants mount before the context does, so they cannot do this
     * themselves.
     */
    public onAttached(handler: () => void): void {
        this._attached.push(handler);
    }

    /**
     * Marks the tree mounted, runs the deferred attach handlers, and starts observing the hidden
     * mirror for the reorders that `setup()` ordering cannot see.
     */
    public attach(graph: HTMLElement): void {
        // The mirror root stands for whichever group owns the top level, which a `v-if`'d scene
        // can change, so it resolves lazily rather than being captured here.
        this.registerContainer(graph, () => this.parent);

        this._mounted = true;
        this._attached.forEach(handler => handler());
        this._attached = [];

        if (!hasWindow || typeof MutationObserver === 'undefined') {
            return;
        }

        this._observer = new MutationObserver(mutations => this._handleMutations(mutations));
        this._observer.observe(graph, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Schedules a repaint through the highest tier available: a renderer paints on its own loop and
     * only needs waking, a scene repaints on the next frame, and a bare context repaints its root
     * group. A state-only change never wakes a stopped renderer on its own — only graph events,
     * pointer movement and transitions do — so the renderer tier restarts the loop explicitly.
     */
    public requestPaint(): void {
        const renderer = this.renderer.value;

        if (renderer) {
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
        this.rootGroup.destroy();
    }

}

/** Creates a {@link RiplTree}, the per-context coordinator for a declarative Ripl graph. */
export function createRiplTree(): RiplTree {
    return markRaw(new RiplTree());
}
