export interface VNode<TElement = unknown> {
    id: string;
    tag: string;
    element?: TElement;
    children: VNode<TElement>[];
}

export interface ParentRef {
    id: string;
    parent?: ParentRef;
}

export interface ReconcilerOptions<TElement = unknown> {
    createElement: (tag: string, id: string) => Element;
    updateElement: (domNode: Element, element: TElement) => void;
    getElementTag: (element: TElement) => string;
    excludeSelectors?: string[];
    getChildId?: (domNode: Element) => string | null;
}

function defaultGetChildId(domNode: Element): string | null {
    return domNode.getAttribute('id');
}

export function getAncestorGroupIds(element: ParentRef): string[] {
    const ids: string[] = [];
    let current = element.parent;

    while (current?.parent) {
        ids.unshift(current.id);
        current = current.parent;
    }

    return ids;
}

export function ensureGroupPath<TElement = unknown>(root: VNode<TElement>, groupIds: string[], defaultTag: string = 'g'): VNode<TElement> {
    let parent = root;

    for (const groupId of groupIds) {
        let child = parent.children.find(c => c.id === groupId);

        if (!child) {
            child = {
                id: groupId,
                tag: defaultTag,
                children: [],
            };
            parent.children.push(child);
        }

        parent = child;
    }

    return parent;
}

function isExcluded(element: Element, selectors: string[]): boolean {
    for (let i = 0; i < selectors.length; i++) {
        if (element.matches(selectors[i])) {
            return true;
        }
    }

    return false;
}

export function reconcileNode<TElement = unknown>(
    domParent: Element,
    vnode: VNode<TElement>,
    domCache: Map<string, Element>,
    options: ReconcilerOptions<TElement>
): void {
    const {
        createElement,
        updateElement,
        getElementTag,
        excludeSelectors = [],
        getChildId = defaultGetChildId,
    } = options;

    const desiredIds = new Set(vnode.children.map(c => c.id));
    const existingChildren = new Map<string, Element>();

    for (let i = domParent.children.length - 1; i >= 0; i--) {
        const child = domParent.children[i];

        if (excludeSelectors.length > 0 && isExcluded(child, excludeSelectors)) {
            continue;
        }

        const childId = getChildId(child);

        if (childId && desiredIds.has(childId)) {
            existingChildren.set(childId, child);
        } else {
            child.remove();
            if (childId) {
                domCache.delete(childId);
            }
        }
    }

    for (let i = 0; i < vnode.children.length; i++) {
        const childVNode = vnode.children[i];
        let domChild = existingChildren.get(childVNode.id) || domCache.get(childVNode.id);

        if (!domChild) {
            const tag = childVNode.element
                ? getElementTag(childVNode.element)
                : childVNode.tag;
            domChild = createElement(tag, childVNode.id);
            domCache.set(childVNode.id, domChild);
        }

        if (childVNode.element) {
            updateElement(domChild, childVNode.element);
        }

        const currentAtIndex = domParent.children[i] as Element | undefined;

        if (currentAtIndex !== domChild) {
            if (currentAtIndex) {
                domParent.insertBefore(domChild, currentAtIndex);
            } else {
                domParent.appendChild(domChild);
            }
        }

        if (childVNode.children.length > 0) {
            reconcileNode(domChild, childVNode, domCache, options);
        }
    }
}

export function createVNode<TElement = unknown>(id: string, tag: string, children: VNode<TElement>[] = [], element?: TElement): VNode<TElement> {
    return {
        id,
        tag,
        element,
        children,
    };
}
