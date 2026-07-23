import type {
    OneOrMore,
} from '@ripl/utilities';

import {
    typeIsBoolean,
    typeIsFunction,
    typeIsNil,
    typeIsNumber,
    typeIsString,
} from '@ripl/utilities';

import type {
    Element,
} from './element';

/**
 * The structural contract the CSS-like query engine operates on, implemented by every `Element`.
 * Container elements (`Group`) additionally provide `children` and a flattened descendant `graph`
 * so combinators can traverse the scene tree. Typing the engine against this interface (rather than
 * the concrete classes) lets `Element`, `Group`, and the engine live in separate modules without
 * import cycles.
 */
export interface Queryable {
    /** The element's type name (e.g. `'circle'`, `'group'`). */
    type: string;
    /** The element's unique id. */
    id: string;
    /** The set of CSS-like class names assigned to the element. */
    classList: Set<string>;
    /** The element's parent container, if attached. */
    parent?: Queryable;
    /** Present on container elements (e.g. `Group`): a snapshot of direct children. */
    children?: Queryable[];
    /** Present on container elements (e.g. `Group`): the flattened descendant graph. */
    graph?(includeGroups?: boolean): Queryable[];
}

/** A `Queryable` that can produce descendants (a container such as `Group`). */
type QueryableContainer = Queryable & {
    graph(includeGroups?: boolean): Queryable[];
};

function isQueryableContainer(value: Queryable): value is QueryableContainer {
    return typeIsFunction(value.graph);
}

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
        produce: element => isQueryableContainer(element) ? element.graph(true) : [],
    },
    {
        pattern: COMBINATOR_PATTERNS.child,
        produce: element => element.children ?? [],
    },
    {
        pattern: COMBINATOR_PATTERNS.nextSibling,
        produce: element => {
            const siblings = element.parent?.children;
            return siblings ? siblings.slice(siblings.indexOf(element) + 1) : [];
        },
    },
] as {
    pattern: RegExp;
    produce: (element: Queryable) => Queryable[];
}[];

function serializeAttribute(value: unknown) {
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

/** Tests whether a single (combinator-free) selector segment matches the element. */
function matchesSegment(element: Queryable, segment: string): boolean {
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
            && serializeAttribute((element as unknown as Record<string, unknown>)[key]) === value;
    });

    return typeMatch
        && idMatch
        && classMatch
        && attrsMatch;
}

function executeQuery(elements: Queryable[], segments: string[], segmentIndex: number = 0): Queryable[] {
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

function runQuery(elements: OneOrMore<Queryable>, selector: string): Queryable[] {
    const els = ([] as Queryable[]).concat(elements).flatMap(element => {
        return isQueryableContainer(element) ? element.graph(true) : [element];
    });

    const normalizedSelector = selector.trim().replace(/\s+/g, ' ');

    return executeQuery(els, normalizedSelector.split(QUERY_PATTERNS.combinators));
}

/** Queries all elements matching a CSS-like selector across the given element(s) and their descendants. */
export function queryAll<TElement extends Element = Element>(elements: OneOrMore<Queryable>, selector: string) {
    return runQuery(elements, selector) as TElement[];
}

/** Returns the first element matching a CSS-like selector, or `undefined` if none match. */
export function query<TElement extends Element = Element>(elements: OneOrMore<Queryable>, selector: string) {
    return queryAll<TElement>(elements, selector).at(0);
}

/** Tests whether an element matches a CSS-like selector. */
export function matches(element: Queryable, selector: string): boolean {
    const segments = selector.trim().replace(/\s+/g, ' ').split(QUERY_PATTERNS.combinators).filter(Boolean);

    if (!segments.length) {
        return false;
    }

    // A single simple segment can be tested directly; multi-segment selectors (with combinators)
    // are resolved against the element's root so ancestor/sibling constraints are honored.
    if (segments.length === 1) {
        return matchesSegment(element, segments[0]);
    }

    let root: Queryable = element;

    while (root.parent) {
        root = root.parent;
    }

    return runQuery(root, selector).includes(element);
}

/** Returns the closest ancestor (including the element itself) matching a CSS-like selector, or `undefined`. */
export function closest<TElement extends Element = Element>(element: Queryable, selector: string): TElement | undefined {
    let current: Queryable | undefined = element;

    while (current) {
        if (matches(current, selector)) {
            return current as TElement;
        }

        current = current.parent;
    }

    return undefined;
}
