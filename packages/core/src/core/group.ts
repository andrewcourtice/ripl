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

export interface Group extends Element<any> {
    set: (elements: Element<any>[]) => void;
    add: (element: Element<any> | Element<any>[]) => void;
    remove: (element: Element<any> | Element<any>[]) => void;
    get elements(): Set<Element<any>>;
}

function getGroupElements(elements: Set<Element<any>>) {
    return new Set(Array.from(elements).flatMap(item => {
        if (item.name === 'group') {
            return Array.from((item as Group).elements);
        }

        return item;
    }));
}

export function group(
    elements?: Element<any>[],
    properties?: ElementProperties<BaseElement>,
    options?: ElementOptions<BaseElement>
): Group {
    let children = new Set(elements);

    const el = element({
        name: 'group',
        renderless: true,
        onRender(context, { time }) {
            for (const child of children) {
                child.render(context, time);
            }
        },
    })(properties || {}, options);


    elements?.forEach(element => element.parent = el);

    function notify() {
        el.eventBus.emit(EVENTS.groupUpdated, el.id);
    }

    function set(elements: Element<any>[]) {
        children = new Set(elements);
        notify();
    }

    function add(element: Element<any> | Element<any>[]) {
        ([] as Element<any>[]).concat(element).forEach(item => {
            item.parent = el;
            children.add(item);
        });
        notify();
    }

    function remove(element: Element<any> | Element<any>[]) {
        ([] as Element<any>[]).concat(element).forEach(item => {
            item.parent = undefined;
            children.delete(item);
        });
        notify();
    }

    return {
        ...el,
        set,
        add,
        remove,

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
            return getGroupElements(children);
        },
    };
}