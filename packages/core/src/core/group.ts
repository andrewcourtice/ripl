import {
    EVENTS,
} from './constants';

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

export interface Group extends Element {
    set(elements: Element<any>[]): void;
    add(element: OneOrMore<Element<any>>): void;
    remove(element: OneOrMore<Element<any>>): void;
    find(query: string): Element | undefined;
    findAll(query: string): Element[] | undefined;
    clear(): void;
    get elements(): Element[];
}

const TYPE = 'group';

function getQueryTest(query: string) {
    switch (query[0]) {
        case '#':
            return (element: Element) => element.id === query;
        case '.':
            return (element: Element) => element.class === query;
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

    function notify() {
        el.eventBus.emit(EVENTS.groupUpdated, el.id);
    }

    function getGroupElements() {
        return Array.from(children).flatMap(item => {
            if (isGroup(item)) {
                return Array.from((item as Group).elements);
            }

            return item;
        });
    }

    function set(elements: Element[]) {
        children = new Set(elements);
        notify();
    }

    function add(element: OneOrMore<Element<any>>) {
        ([] as Element[]).concat(element).forEach(item => {
            item.parent = el;
            children.add(item);
        });
        notify();
    }

    function remove(element: OneOrMore<Element<any>>) {
        ([] as Element[]).concat(element).forEach(item => {
            item.parent = undefined;
            children.delete(item);
        });
        notify();
    }

    function clear() {
        children.forEach(item => item.parent = undefined);
        children.clear();
        notify();
    }

    function find(query: string) {
        return arrayFind(getGroupElements(), getQueryTest(query));
    }

    function findAll(query: string) {
        return arrayFilter(getGroupElements(), getQueryTest(query));
    }

    return {
        ...el,
        set,
        add,
        remove,
        clear,
        find,
        findAll,

        get parent() {
            return el.parent;
        },
        set parent(par) {
            el.parent = par;
        },

        get eventBus() {
            return el.eventBus;
        },
        set eventBus(bus) {
            el.eventBus = bus;
        },

        get elements() {
            return getGroupElements();
        },
    };
}