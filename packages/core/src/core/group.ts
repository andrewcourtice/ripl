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
    arrayForEach,
    OneOrMore,
} from '@ripl/utilities';

import {
    Context,
} from './context';

export interface GroupOptions extends ElementOptions {
    children?: OneOrMore<Element>;
}

function getQueryTest(query: string) {
    switch (query[0]) {
        case '#':
            return (element: Element) => element.id === query.substring(1, query.length);
        case '.':
            return (element: Element) => element.classList.has(query.substring(1, query.length));
        default:
            return (element: Element) => element.type === query;
    }
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
        this.emit('scene:graph', undefined);
    }

    public set(elements: Element[]) {
        this.#elements = new Set(elements);
        this.updateSceneGraph();
    }

    public add(element: OneOrMore<Element>) {
        const elements = ([] as Element[]).concat(element);

        if (!elements.length) {
            return;
        }

        elements.forEach(item => {
            item.parent = this;
            this.#elements.add(item);
        });

        this.updateSceneGraph();
    }

    public remove(element: OneOrMore<Element>) {
        const elements = ([] as Element[]).concat(element);

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

    public find(query: string) {
        return arrayFind(this.graph(true), getQueryTest(query));
    }

    public findAll(query: string) {
        return arrayFilter(this.graph(true), getQueryTest(query));
    }

    public getBoundingBox() {
        return getContainingBox(this.children, element => element.getBoundingBox());
    }

    public render(context: Context): void {
        arrayForEach(this.children, element => element.render(context));
    }

}