import {
    BaseElement,
    createElement,
    Element,
    ElementOptions,
    ElementProperties,
} from './element';

import {
    arrayFilter,
    arrayFind,
    OneOrMore,
    setForEach,
} from '@ripl/utilities';

import {
    createEvent,
} from './event-bus';

export interface Group extends Element {
    set(elements: Element<any>[]): void;
    add(element: OneOrMore<Element<any>>): void;
    remove(element: OneOrMore<Element<any>>): void;
    graph(includeGroups?: boolean): Element[];
    find(query: string): Element | undefined;
    findAll(query: string): Element[];
    clear(): void;
    get elements(): Element[];
}

const TYPE = 'group';

function getQueryTest(query: string) {
    switch (query[0]) {
        case '#':
            return (element: Element) => element.id === query.substring(1, query.length);
        case '.':
            return (element: Element) => element.class === query.substring(1, query.length);
        default:
            return (element: Element) => element.type === query;
    }
}

export function isGroup(element: Element): element is Group {
    return element.type === TYPE;
}

export function createGroup(
    properties?: ElementProperties<BaseElement>,
    options?: ElementOptions<BaseElement>
): Group {
    let children = new Set<Element>();

    const el = createElement(TYPE, () => {
        return ({ context, time }) => {
            setForEach(children, ({ render }) => render(context, time));
        };
    }, {
        abstract: true,
    })(properties || {}, options);

    const group = {
        ...el,
        set,
        add,
        remove,
        clear,
        graph,
        find,
        findAll,

        get parent() {
            return el.parent;
        },

        set parent(group: Group | undefined) {
            el.parent = group;
        },

        get elements() {
            return Array.from(children);
        },
    };

    function updateSceneGraph() {
        el.emit('scenegraph', {
            element: el,
            ...createEvent(),
        });
    }

    function set(elements: Element[]) {
        children = new Set(elements);
        updateSceneGraph();
    }

    function add(element: OneOrMore<Element<any>>) {
        const elements = ([] as Element[]).concat(element);

        if (!elements.length) {
            return;
        }

        elements.forEach(item => {
            item.parent = group;
            children.add(item);
        });

        updateSceneGraph();
    }

    function remove(element: OneOrMore<Element<any>>) {
        const elements = ([] as Element[]).concat(element);

        if (!elements.length) {
            return;
        }

        elements.forEach(item => {
            item.parent = undefined;
            children.delete(item);
        });

        updateSceneGraph();
    }

    function clear() {
        remove(Array.from(children));
    }

    function graph(includeGroups?: boolean) {
        return Array.from(children).flatMap(item => {
            if (!isGroup(item)) {
                return item;
            }

            return (includeGroups
                ? [item as Element]
                : []
            ).concat(item.graph(includeGroups));
        });
    }

    function find(query: string) {
        return arrayFind(graph(true), getQueryTest(query));
    }

    function findAll(query: string) {
        return arrayFilter(graph(true), getQueryTest(query));
    }

    return group;
}