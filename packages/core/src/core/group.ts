import {
    EVENTS,
} from './constants';

import {
    BaseElement,
    Element,
    element,
    ElementOptions,
    ElementProperties,
} from './element';

import {
    OneOrMore,
    setForEach,
} from '@ripl/utilities';

export interface Group extends Element {
    set(elements: Element<any>[]): void;
    add(element: OneOrMore<Element<any>>): void;
    remove(element: OneOrMore<Element<any>>): void;
    query(query: string): Element[] | undefined;
    get elements(): Set<Element>;
}

export function group(
    properties?: ElementProperties<BaseElement>,
    options?: ElementOptions<BaseElement>
): Group {
    let children = new Set<Element>();

    const el = element({
        name: 'group',
        renderless: true,
        onRender({ context, time }) {
            setForEach(children, ({ render }) => render(context, time));
        },
    })(properties || {}, options);

    function notify() {
        el.eventBus.emit(EVENTS.groupUpdated, el.id);
    }

    function getGroupElements() {
        return new Set(Array.from(children).flatMap(item => {
            if (item.name === 'group') {
                return Array.from((item as Group).elements);
            }

            return item;
        }));
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

    function query(query: string) {
        let matches: Element[] | undefined;

        // for (const element of getGroupElements()) {

        // }

        return matches;
    }

    return {
        ...el,
        set,
        add,
        remove,
        query,

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