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
    arrayFilter,
    arrayFind,
    arrayFlatMap,
    arrayForEach,
    OneOrMore,
    stringEquals,
    typeIsNil,
    valueOneOrMore,
} from '@ripl/utilities';

import {
    Context,
} from '../context';

export interface GroupOptions extends ElementOptions {
    children?: OneOrMore<Element>;
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
    attribute: new RegExp(`(\\[${ELEMENT_PATTERNS.name.source}="(.*)"\\])+`, 'g'),
    combinators: new RegExp(`(\\s[${Object.values(COMBINATOR_PATTERNS).map(pattern => pattern.source).join('|')}]\\s|\\s)`),
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
        produce: element => element.parent?.children.slice(element.parent.children.indexOf(element) + 1),
    },
] as {
    pattern: RegExp;
    produce: (element: Element) => Element[];
}[];

function serialiseAttribute(value: unknown) {
    try {
        return JSON.stringify(value).replaceAll(/(^"|"$)/g, '');
    } catch {
        return String(value);
    }
}

function executeQuery(elements: Element[], segments: string[], segmentIndex: number = 0) {
    const segment = segments[segmentIndex];

    if (!segment || !elements.length) {
        return elements;
    }

    if (QUERY_PATTERNS.combinators.test(segment)) {
        const producer = arrayFind(COMBINATOR_PRODUCERS, ({ pattern }) => pattern.test(segment));

        if (!producer) {
            throw new Error('Failed to query!');
        }

        return executeQuery(arrayFlatMap(elements, element => producer.produce(element)), segments, segmentIndex + 1);
    }

    const type = segment.match(QUERY_PATTERNS.type)?.at(0);
    const id = segment.match(QUERY_PATTERNS.id)?.at(0);
    const classes = Array.from(segment.matchAll(QUERY_PATTERNS.class), match => match.at(0));
    const attributes = Array.from(segment.matchAll(QUERY_PATTERNS.attribute), match => match.at(0));

    return executeQuery(arrayFilter(elements, element => {
        const typeMatch = !type || stringEquals(element.type, type);
        const idMatch = !id || stringEquals(element.id, id.replace(ELEMENT_PATTERNS.id, ''));

        const classMatch = !classes.length || classes.every(cls => {
            return !!cls && element.classList.has(cls.replace(ELEMENT_PATTERNS.class, ''));
        });

        const attrsMatch = !attributes.length || attributes.every(attr => {
            if (!attr) {
                return false;
            }

            const [
                _m,
                _c,
                key,
                value,
            ] = Array.from(attr.matchAll(QUERY_PATTERNS.attribute)).at(0) || [];

            return !typeIsNil(key)
                && !typeIsNil(value)
                && key in element
                && serialiseAttribute(element[key]) === value;
        });

        return typeMatch
            && idMatch
            && classMatch
            && attrsMatch;
    }), segments, segmentIndex + 1);
}

export function queryAll(elements: OneOrMore<Element | Group>, selector: string) {
    const els = arrayFlatMap(([] as Element[]).concat(elements), element => {
        return isGroup(element) ? element.graph(true) : [element];
    });

    return executeQuery(els, selector.split(QUERY_PATTERNS.combinators));
}

export function query(elements: OneOrMore<Element | Group>, selector: string) {
    return queryAll(elements, selector).at(0);
}

export function isGroup(value: unknown): value is Group {
    return value instanceof Group;
}

export function createGroup(...options: ConstructorParameters<typeof Group>) {
    return new Group(...options);
}

export class Group<TEventMap extends ElementEventMap = ElementEventMap> extends Element<BaseElementState, TEventMap> {

    #elements = new Set<Element>();

    public get children() {
        return Array.from(this.#elements);
    }

    constructor({
        children = [],
        ...options
    }: GroupOptions = {}) {
        super('group', options);

        this.abstract = true;
        this.add(children);
    }

    public updateSceneGraph() {
        this.emit('graph', null);
    }

    public set(elements: Element[]) {
        this.#elements.clear();
        this.add(elements);
    }

    public add(element: OneOrMore<Element>) {
        const elements = valueOneOrMore(element);

        if (!elements.length) {
            return;
        }

        elements.forEach(item => {
            if (item.parent) {
                item.parent.remove(item);
            }

            item.parent = this;
            this.#elements.add(item);
        });

        this.updateSceneGraph();
    }

    public remove(element: OneOrMore<Element>) {
        const elements = valueOneOrMore(element);

        if (!elements.length) {
            return;
        }

        this.#elements.forEach(item => {
            item.parent = undefined;
            this.#elements.delete(item);
        });

        this.updateSceneGraph();
    }

    public clear() {
        this.remove(this.children);
    }

    public graph(includeGroups?: boolean): Element[] {
        return this.children.flatMap(item => {
            if (!isGroup(item)) {
                return item;
            }

            return (includeGroups
                ? [item as Element]
                : []
            ).concat(item.graph(includeGroups));
        });
    }

    public query(selector: string) {
        return query(this, selector);
    }

    public queryAll(selector: string) {
        return queryAll(this, selector);
    }

    public getElementByID(id: string) {
        return arrayFind(this.graph(true), element => element.id === id);
    }

    public getElementsByType(types: OneOrMore<string>) {
        const typeList = valueOneOrMore(types);
        return arrayFilter(this.graph(true), element => typeList.includes(element.type));
    }

    public getElementsByClass(classes: OneOrMore<string>) {
        const classList = valueOneOrMore(classes);
        return arrayFilter(this.graph(true), element => classList.every(cls => element.classList.has(cls)));
    }

    public getBoundingBox() {
        return getContainingBox(this.children, element => element.getBoundingBox());
    }

    public render(context: Context): void {
        context.markRenderStart();
        arrayForEach(this.children, element => element.render(context));
        context.markRenderEnd();
    }

}