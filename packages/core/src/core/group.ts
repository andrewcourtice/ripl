import {
    BaseElementState,
    Element,
    ElementEventMap,
    ElementOptions,
} from './element';

import {
    getContainingBox,
} from '../math';

import {
    OneOrMore,
    typeIsBoolean,
    typeIsNil,
    typeIsNumber,
    typeIsString,
    valueOneOrMore,
} from '@ripl/utilities';

import type {
    Context,
} from '../context';

/** Options for constructing a group, extending element options with an optional initial set of children. */
export type GroupOptions<TState extends BaseElementState = BaseElementState> = ElementOptions<TState> & {
    children?: OneOrMore<Element>;
};

const ELEMENT_PATTERNS = {
    id: /#/,
    class: /\./,
    name: /([a-zA-Z\d\-_]+)/,
};

const COMBINATOR_PATTERNS = {
    child: />/,
    nextSibling: /\+/,
};

const QUERY_PATTERNS = {
    type: new RegExp(`^${ELEMENT_PATTERNS.name.source}`),
    id: new RegExp(`${ELEMENT_PATTERNS.id.source}${ELEMENT_PATTERNS.name.source}`),
    class: new RegExp(`${ELEMENT_PATTERNS.class.source}${ELEMENT_PATTERNS.name.source}`, 'g'),
    attribute: new RegExp(`(\\[${ELEMENT_PATTERNS.name.source}="([^"]*)"\\])+`, 'g'),
    combinators: new RegExp(`(\\s(?:${Object.values(COMBINATOR_PATTERNS).map(pattern => pattern.source).join('|')})\\s|\\s)`),
};

const COMBINATOR_PRODUCERS = [
    {
        pattern: /^\s$/,
        produce: element => isGroup(element) ? element.graph(true) : [],
    },
    {
        pattern: COMBINATOR_PATTERNS.child,
        produce: element => isGroup(element) ? element.children : [],
    },
    {
        pattern: COMBINATOR_PATTERNS.nextSibling,
        produce: element => element.parent?.children.slice(element.parent.children.indexOf(element) + 1) ?? [],
    },
] as {
    pattern: RegExp;
    produce: (element: Element) => Element[];
}[];

function serialiseAttribute(value: unknown) {
    if (typeIsString(value)) {
        return value;
    }

    if (typeIsNumber(value) || typeIsBoolean(value)) {
        return String(value);
    }

    try {
        return JSON.stringify(value).replaceAll(/(^"|"$)/g, '');
    } catch {
        return String(value);
    }
}

function matchesSegment(element: Element, segment: string): boolean {
    const type = segment.match(QUERY_PATTERNS.type)?.at(0);
    const id = segment.match(QUERY_PATTERNS.id)?.at(0);
    const classes = Array.from(segment.matchAll(QUERY_PATTERNS.class), match => match.at(0));
    const attributes = Array.from(segment.matchAll(QUERY_PATTERNS.attribute), match => match.at(0));

    const typeMatch = !type || element.type === type;
    const idMatch = !id || element.id === id.replace(ELEMENT_PATTERNS.id, '');

    const classMatch = !classes.length || classes.every(cls => {
        return !!cls && element.classList.has(cls.replace(ELEMENT_PATTERNS.class, ''));
    });

    const attrsMatch = !attributes.length || attributes.every(attr => {
        if (!attr) {
            return false;
        }

        const [
            ,
            ,
            key,
            value,
        ] = Array.from(attr.matchAll(QUERY_PATTERNS.attribute)).at(0) || [];

        return !typeIsNil(key)
            && !typeIsNil(value)
            && key in element
            && serialiseAttribute((element as unknown as Record<string, unknown>)[key]) === value;
    });

    return typeMatch
        && idMatch
        && classMatch
        && attrsMatch;
}

function executeQuery(elements: Element[], segments: string[], segmentIndex: number = 0) {
    if (segmentIndex >= segments.length || !elements.length) {
        return elements;
    }

    const segment = segments[segmentIndex];

    if (!segment) {
        return executeQuery(elements, segments, segmentIndex + 1);
    }

    if (QUERY_PATTERNS.combinators.test(segment)) {
        const producer = COMBINATOR_PRODUCERS.find(({ pattern }) => pattern.test(segment));

        if (!producer) {
            throw new Error('Failed to query!');
        }

        return executeQuery(elements.flatMap(element => producer.produce(element)), segments, segmentIndex + 1);
    }

    return executeQuery(elements.filter(element => matchesSegment(element, segment)), segments, segmentIndex + 1);
}

/** Queries all elements matching a CSS-like selector across the given element(s) and their descendants. */
export function queryAll<TElement extends Element = Element>(elements: OneOrMore<Element | Group>, selector: string) {
    const els = ([] as Element[]).concat(elements).flatMap(element => {
        return isGroup(element) ? element.graph(true) : [element];
    });

    const normalisedSelector = selector.trim().replace(/\s+/g, ' ');

    return executeQuery(els, normalisedSelector.split(QUERY_PATTERNS.combinators)) as TElement[];
}

/** Returns the first element matching a CSS-like selector, or `undefined` if none match. */
export function query<TElement extends Element = Element>(elements: OneOrMore<Element | Group>, selector: string) {
    return queryAll<TElement>(elements, selector).at(0);
}

/** Tests whether an element matches a CSS-like selector. */
export function matches(element: Element, selector: string): boolean {
    const segments = selector.trim().replace(/\s+/g, ' ').split(QUERY_PATTERNS.combinators).filter(Boolean);

    if (!segments.length) {
        return false;
    }

    if (segments.length === 1) {
        return matchesSegment(element, segments[0]);
    }

    let root: Element = element;

    while (root.parent) {
        root = root.parent;
    }

    return queryAll(root, selector).includes(element);
}

/** Returns the closest ancestor (including the element itself) matching a CSS-like selector, or `undefined`. */
export function closest<TElement extends Element = Element>(element: Element, selector: string): TElement | undefined {
    let current: Element | undefined = element;

    while (current) {
        if (matches(current, selector)) {
            return current as TElement;
        }

        current = current.parent;
    }

    return undefined;
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
export class Group<
    TState extends BaseElementState = BaseElementState,
    TEventMap extends ElementEventMap = ElementEventMap
> extends Element<TState, TEventMap> {

    private _elements = new Set<Element>();

    /** Returns a snapshot array of this group's direct child elements. */
    public get children() {
        return Array.from(this._elements);
    }

    constructor(type: string, options?: GroupOptions<TState>);
    constructor(options?: GroupOptions<TState>);
    constructor(typeOrOptions?: string | GroupOptions<TState>, maybeOptions?: GroupOptions<TState>) {
        const type = typeIsString(typeOrOptions) ? typeOrOptions : 'group';

        const {
            children = [],
            ...options
        } = (typeIsString(typeOrOptions) ? maybeOptions : typeOrOptions) ?? {};

        super(type, options as ElementOptions<TState>);

        this.abstract = true;
        this.add(children);
    }

    /** Emits a `graph` event to notify the scene that the element tree has changed. */
    public updateSceneGraph() {
        this.emit('graph', null);
    }

    /** Replaces all children with the given elements, detaching the previous children. */
    public set(elements: Element[]) {
        this.remove(this.children);
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

    /** Tests whether this group matches the CSS-like selector. */
    public matches(selector: string): boolean {
        return matches(this as unknown as Element, selector);
    }

    /** Returns the closest ancestor (including this group) matching the CSS-like selector, or `undefined`. */
    public closest<TElement extends Element = Element>(selector: string) {
        return closest<TElement>(this as unknown as Element, selector);
    }

    /** Finds a descendant element by its unique id, or `undefined` if none match. */
    public getElementById<TElement extends Element = Element>(id: string) {
        return this.graph(true).find(element => element.id === id) as TElement | undefined;
    }

    /** @deprecated Use {@link getElementById}. */
    public getElementByID<TElement extends Element = Element>(id: string) {
        return this.getElementById<TElement>(id);
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

    /** Returns the composite bounding box enclosing all children. */
    public getBoundingBox() {
        return getContainingBox(this.children, element => element.getBoundingBox());
    }

    /** Detaches all children (clearing their parent), then destroys this group. */
    public destroy(): void {
        this.clear();
        super.destroy();
    }

    /** Renders all child elements in z-index order within a save/restore context. */
    public render(context: Context): void {
        context.save();
        context.markRenderStart();

        this.children
            .sort((first, second) => first.zIndex - second.zIndex)
            .forEach(element => element.render(context));

        context.markRenderEnd();
        context.restore();
    }

}
