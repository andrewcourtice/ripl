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
    arrayReduce,
    OneOrMore,
    stringEquals,
} from '@ripl/utilities';

import {
    Context,
} from '../context';

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


function query(root: Group, value: string) {
    const ID = /#/;
    const CLASS = /\./;
    const NAME = /([a-zA-Z\d\-_]+)/;
    const SIBLINGS = /(\s[~|>|\+]\s|\s)/;
    const TAG_NAME = new RegExp(`^${NAME.source}`);
    const ID_NAME = new RegExp(`${ID.source}${NAME.source}`);
    const CLASS_NAME = new RegExp(`${CLASS.source}${NAME.source}`, 'g');
    const ATTR = new RegExp(`(\\[${NAME.source}="(.*)"\\])+`, 'g');
    const QUERY = new RegExp(`^(((${ID.source}|${CLASS.source})?${NAME.source})+${SIBLINGS.source}?)+`, 'g');

    // if (!QUERY.test(value)) {
    //     throw new Error('Invalid query selector');
    // }

    const segments = value.split(SIBLINGS);

    let refElements = [root] as Element[];
    let refPool = root.graph(true);

    arrayForEach(segments, segment => {
        if (!refElements.length) {
            return;
        }

        arrayForEach(refElements, refEl => {
            if (SIBLINGS.test(segment) && isGroup(refEl)) {
                refPool = /^\s$/.test(segment)
                    ? refEl.graph(true)
                    : refEl.children;

                return;
            }

            const tag = segment.match(TAG_NAME)?.at(0);
            const id = segment.match(ID_NAME)?.at(0);
            const classes = Array.from(segment.matchAll(CLASS_NAME), match => match.at(0));
            const attrs = Array.from(segment.matchAll(ATTR), match => match.at(0));

            refElements = arrayFilter(refPool, element => {
                const tagMatch = !tag || stringEquals(element.type, tag);
                const idMatch = !id || stringEquals(element.id, id.replace(ID, ''));
                const classMatch = !classes.length || classes.every(cls => !!cls && element.classList.has(cls.replace(CLASS, '')));

                const attrsMatch = !attrs.length || attrs.every(attr => {
                    if (!attr) {
                        return false;
                    }

                    const [
                        _m,
                        _c,
                        key,
                        value,
                    ] = Array.from(attr.matchAll(ATTR)).at(0) || [];

                    return !!(key && value) && JSON.stringify(element[key]).replaceAll(/(^"|"$)/g, '') === value;
                });

                return tagMatch
                    && idMatch
                    && classMatch
                    && attrsMatch;
            });
        });
    });

    return refElements;
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

    public query(value: string) {
        return query(this, value);
    }

    public getBoundingBox() {
        return getContainingBox(this.children, element => element.getBoundingBox());
    }

    public render(context: Context): void {
        arrayForEach(this.children, element => element.render(context));
    }

}