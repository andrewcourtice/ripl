import {
    createEvent,
} from './event-bus';

import {
    defineElement,
} from './element';

import {
    getContainingBox,
} from '../math';

import {
    arrayFilter,
    arrayFind,
    OneOrMore,
    setForEach,
} from '@ripl/utilities';

import type {
    BaseElementState,
    Element,
    ElementOptions,
    Group,
} from './types';

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

export function createGroup(options?: ElementOptions<BaseElementState>): Group {
    let children = new Set<Element>();

    const el = defineElement(TYPE, ({ setBoundingBoxHandler }) => {
        setBoundingBoxHandler(() => {
            return getContainingBox(Array.from(children), el => el.getBoundingBox());
        });

        return ({ context, time }) => {
            setForEach(children, ({ render }) => render(context, time));
        };
    }, {
        abstract: true,
    })(options);

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
        el.emit('scene:graph', {
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