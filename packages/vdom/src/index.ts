/** A virtual DOM node representing an element in the reconciled tree. */
export interface VNode<TElement = unknown> {
    id: string;
    tag: string;
    element?: TElement;
    children: VNode<TElement>[];
}

/** A linked-list reference to an element's parent chain, used to resolve ancestor group paths. */
export interface ParentRef {
    id: string;
    parent?: ParentRef;
}

/** Configuration for the DOM reconciler, providing element lifecycle callbacks and filtering. */
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

/** Walks the parent chain of an element and collects group IDs from root to leaf (excluding the scene root). */
export function getAncestorGroupIds(element: ParentRef): string[] {
    const ids: string[] = [];
    let current = element.parent;

    while (current?.parent) {
        ids.unshift(current.id);
        current = current.parent;
    }

    return ids;
}

/** Ensures that a nested group path exists in the virtual tree, creating missing intermediate nodes as needed. */
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

/** Reconciles a virtual node tree against the live DOM, creating, updating, reordering, and removing child elements as needed. */
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

/** Creates a new virtual node with the given id, tag, optional children, and optional backing element. */
export function createVNode<TElement = unknown>(id: string, tag: string, children: VNode<TElement>[] = [], element?: TElement): VNode<TElement> {
    return {
        id,
        tag,
        element,
        children,
    };
}
