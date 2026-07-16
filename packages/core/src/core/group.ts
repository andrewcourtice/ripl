import type {
    BaseElementState,
    ElementEventMap,
    ElementOptions,
} from './element';

import {
    Element,
} from './element';

import {
    query,
    queryAll,
} from './query';

import type {
    Queryable,
} from './query';

import {
    getContainingBox,
} from '../math';

import type {
    OneOrMore,
} from '@ripl/utilities';

import {
    valueOneOrMore,
} from '@ripl/utilities';

import type {
    Context,
} from '../context';

/** Options for constructing a group, extending element options with an optional initial set of children. */
export interface GroupOptions extends ElementOptions {
    /** One or more child elements to add to the group on construction. */
    children?: OneOrMore<Element>;
}

/** Type guard that checks whether a value is a `Group` instance. */
export function isGroup(value: unknown): value is Group {
    return value instanceof Group;
}

/** Factory function that creates a new `Group` instance. */
export function createGroup(...options: ConstructorParameters<typeof Group>) {
    return new Group(...options);
}

/** A container element that manages child elements, providing scenegraph traversal, CSS-like querying, and composite bounding boxes. */
export class Group<TEventMap extends ElementEventMap = ElementEventMap> extends Element<BaseElementState, TEventMap> implements Queryable {

    private _elements = new Set<Element>();

    /** Returns a snapshot array of this group's direct child elements. */
    public get children() {
        return Array.from(this._elements);
    }

    constructor({
        children = [],
        ...options
    }: GroupOptions = {}) {
        super('group', options);

        this.abstract = true;
        this.add(children);
    }

    /** Emits a `graph` event to notify the scene that the element tree has changed. */
    public updateSceneGraph() {
        this.emit('graph', null);
    }

    /** Replaces all children with the given elements, detaching the previous children. */
    public set(elements: Element[]) {
        this.clear();
        this.add(elements);
    }

    /** Adds one or more elements as children, re-parenting them if necessary. */
    public add(element: OneOrMore<Element>) {
        const elements = valueOneOrMore(element);

        if (!elements.length) {
            return;
        }

        elements.forEach(item => {
            if (item.parent) {
                item.parent.remove(item);
            }

            item.parent = this as unknown as Group;
            this._elements.add(item);
        });

        this.updateSceneGraph();
    }

    /** Removes one or more child elements from this group. */
    public remove(element: OneOrMore<Element>) {
        const elements = valueOneOrMore(element);

        if (!elements.length) {
            return;
        }

        elements.forEach(item => {
            item.parent = undefined;
            this._elements.delete(item);
        });

        this.updateSceneGraph();
    }

    /** Removes all children from this group. */
    public clear() {
        this.remove(this.children);
    }

    /** Returns a flattened array of all descendant elements, optionally including intermediate groups. */
    public graph(includeGroups?: boolean): Element[] {
        return this.children.flatMap(item => {
            if (!isGroup(item)) {
                return [item];
            }

            return (includeGroups
                ? [item as Element]
                : []
            ).concat(item.graph(includeGroups));
        });
    }

    /** Returns the first descendant matching the CSS-like selector, or `undefined`. */
    public query<TElement extends Element = Element>(selector: string) {
        return query<TElement>(this, selector);
    }

    /** Returns all descendants matching the CSS-like selector. */
    public queryAll<TElement extends Element = Element>(selector: string) {
        return queryAll<TElement>(this, selector);
    }

    /** Finds a descendant element by its unique id, or `undefined` if none match. */
    public getElementById<TElement extends Element = Element>(id: string) {
        return this.graph(true).find(element => element.id === id) as TElement | undefined;
    }

    /** Returns all descendant elements whose type matches one of the given type names. */
    public getElementsByType<TElement extends Element = Element>(types: OneOrMore<string>) {
        const typeList = new Set(valueOneOrMore(types));
        return this.graph(true).filter(element => typeList.has(element.type)) as TElement[];
    }

    /** Returns all descendant elements that have all of the given CSS class names. */
    public getElementsByClass<TElement extends Element = Element>(classes: OneOrMore<string>) {
        const classList = valueOneOrMore(classes);
        return this.graph(true).filter(element => classList.every(cls => element.classList.has(cls))) as TElement[];
    }

    /**
     * Returns the composite bounding box enclosing all children: their on-screen (world) boxes by
     * default, or their raw local boxes when `local` is `true`.
     * @param local - when `true`, unions the children's untransformed local geometry instead of their world boxes.
     */
    public getBoundingBox(local = false) {
        return getContainingBox(this.children, element => element.getBoundingBox(local));
    }

    /** @internal Composite raw local-space box enclosing all children's untransformed geometry. */
    public _getLocalBoundingBox() {
        return getContainingBox(this.children, element => element._getLocalBoundingBox());
    }

    /** Detaches all children (clearing their parent), then destroys this group. */
    public destroy(): void {
        this.clear();
        super.destroy();
    }

    /** Renders all child elements in ascending z-index order within this group's boundary. */
    public render(context: Context): void {
        context.markRenderStart();
        context.pushGroup(this as unknown as Element);

        // `children` returns a fresh array, so this sort is safe. Rendering scene-less (a group drawn
        // directly to a context) must honour z-index and the group's own transform just as `Scene`
        // does via its instruction stream; the sort is stable, so equal-z-index siblings keep
        // insertion order.
        this.children
            .sort((ea, eb) => ea.zIndex - eb.zIndex)
            .forEach(element => element.render(context));

        context.popGroup();
        context.markRenderEnd();
    }

}
