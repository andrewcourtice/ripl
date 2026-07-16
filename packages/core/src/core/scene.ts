import type {
    Element,
    ElementEventMap,
} from './element';

import type {
    Context,
} from '../context';

import {
    typeIsContext,
} from '../context';

import {
    factory,
} from './factory';

import {
    createFrameBuffer,
} from '../animation';

import {
    Group,
    isGroup,
} from './group';

import type {
    GroupOptions,
} from './group';

import {
    typeIsNil,
} from '@ripl/utilities';


/**
 * Event map for the scene. Resize is deliberately *not* re-emitted here — listen for it on the
 * scene's `context` instead (`scene.context.on('resize', …)`), the single source of truth.
 */
export type SceneEventMap = ElementEventMap;

/** The kind of a {@link RenderInstruction}: enter a group boundary, draw a leaf, or exit a group boundary. */
export type RenderInstructionType = 'push' | 'draw' | 'pop';

/**
 * A single entry in a {@link Scene}'s flat render instruction stream. `push`/`pop` bracket a
 * group so its transform and any group-scoped clip apply to the leaves drawn between them;
 * `draw` renders a leaf element. Groups are contiguous (stacking-context ordering), so each
 * group contributes exactly one `push`/`pop` pair.
 */
export interface RenderInstruction {
    /** Whether this instruction opens a group, draws a leaf, or closes a group. */
    type: RenderInstructionType;
    /** The group element for `push`/`pop`, or the leaf element for `draw`. */
    element: Element;
}

/** Render-instruction dispatch keyed by instruction type: open a group boundary, draw a leaf, or close a group boundary. */
const RENDER_OPERATIONS: Record<RenderInstructionType, (context: Context, element: Element) => void> = {
    push: (context, element) => context.pushGroup(element),
    pop: (context, element) => {
        context.popGroup();
        element.$reset();
    },
    draw: (context, element) => element.render(context),
};

/** Options for constructing a scene, extending group options with an optional auto-render-on-resize flag. */
export interface SceneOptions extends GroupOptions {
    /** Whether the scene re-renders automatically when its context is resized. Defaults to `true`. */
    renderOnResize?: boolean;
    /** Whether the scene re-renders automatically when an element's state is updated. */
    renderOnUpdate?: boolean;
}

/** The top-level group bound to a rendering context, maintaining a hoisted flat instruction stream for O(n) rendering. */
export class Scene<TContext extends Context = Context> extends Group<SceneEventMap> {

    /** The rendering {@link Context} this scene draws to. */
    public context: TContext;

    private _instructions: RenderInstruction[] = [];

    /**
     * The flat, group-aware render instruction stream in paint order (stacking-context
     * z-ordering), driving the {@link Renderer} and {@link Scene.render}. Each entry is a
     * `push`/`draw`/`pop` {@link RenderInstruction}; groups are bracketed by `push`/`pop` so
     * their transform and any group-scoped clip apply to the leaves drawn between them.
     */
    public get instructions(): RenderInstruction[] {
        return this._instructions;
    }

    /** The flat list of renderable leaf descendants in paint order — the `draw` targets of {@link Scene.instructions}. */
    public get buffer(): Element[] {
        return this._instructions
            .filter(instruction => instruction.type === 'draw')
            .map(instruction => instruction.element);
    }

    /** The pixel width of the scene's rendering context. */
    public get width() {
        return this.context.width;
    }

    /** The pixel height of the scene's rendering context. */
    public get height() {
        return this.context.height;
    }

    constructor(target: Context | string | HTMLElement, options?: SceneOptions) {
        const {
            renderOnResize = true,
            // renderOnUpdate = true,
            ...groupOptions
        } = options || {};

        let context: TContext;

        if (typeIsContext(target)) {
            context = target as TContext;
        } else if (factory.createContext) {
            context = factory.createContext(target) as TContext;
        } else {
            throw new Error('Scene requires a Context instance or factory.createContext to be set. Use @ripl/web or call factory.set() with a createContext implementation.');
        }

        context.buffer = false;

        const font = !typeIsNil(globalThis.HTMLElement) && context.element instanceof globalThis.HTMLElement
            ? factory.getComputedStyle(context.element).font
            : undefined;

        super({
            ...font ? { font } : {},
            ...groupOptions,
        });

        this.context = context;
        this._rebuild();

        const requestFrame = createFrameBuffer();

        this.retain(context.on('resize', () => {
            if (renderOnResize && !!this.buffer.length) {
                this.render();
            }
        }));

        this.on('graph', () => requestFrame(() => {
            this._rebuild();
            context.invalidateTrackedElements();
        }));

        // A z-index change reorders the instruction stream, so re-sort. Interpolated
        // animations write state directly (no `updated` event), so this only fires on explicit
        // z-index assignments — and the rebuild is debounced to once per frame.
        this.on('updated', event => {
            if (event.data.key !== 'zIndex') {
                return;
            }

            requestFrame(() => {
                this._rebuild();
                context.invalidateTrackedElements();
            });
        });
    }

    private _rebuild() {
        const instructions: RenderInstruction[] = [];

        this._collectInstructions(this, instructions);

        this._instructions = instructions;
    }

    /**
     * Depth-first walk that flattens the scene graph into the render instruction stream.
     * Each group's direct children are sorted by z-index (stable, so equal-z-index siblings
     * keep insertion order) — sorting siblings by the additive {@link Element.zIndex} is
     * equivalent to sorting by their own z-index, since they share the same parent offset.
     * Groups are emitted as a contiguous `push` … `pop` pair (stacking-context ordering).
     */
    private _collectInstructions(group: Group, instructions: RenderInstruction[]) {
        group.children
            .sort((ea, eb) => ea.zIndex - eb.zIndex)
            .forEach(element => {
                if (isGroup(element)) {
                    instructions.push({
                        type: 'push',
                        element,
                    });
                    this._collectInstructions(element, instructions);
                    instructions.push({
                        type: 'pop',
                        element,
                    });
                    return;
                }

                instructions.push({
                    type: 'draw',
                    element,
                });
            });
    }

    /** Destroys the scene (and optionally the context), removing all children and cleaning up event subscriptions. */
    public destroy(includeContext: boolean = false): void {
        this.clear();

        if (includeContext) {
            this.context.destroy();
        }

        super.destroy();
    }

    /** Clears the context and renders the entire instruction stream in paint order, honouring group boundaries. */
    public render(): void {
        const context = this.context;

        context.batch(() => {
            this._instructions.forEach(({ type, element }) => {
                RENDER_OPERATIONS[type](context, element);
            });
        });

        // Leaves clear their own flags in `Element.render` and groups at their `pop`; the root is
        // not part of its own instruction stream, so reset it explicitly here.
        this.$reset();
    }

}

/** Factory function that creates a new `Scene` instance from a context, selector, or element. */
export function createScene(...options: ConstructorParameters<typeof Scene>) {
    return new Scene(...options);
}
