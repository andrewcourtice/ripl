/** A virtual DOM node representing an element in the reconciled tree. */
export interface VNode<TElement = unknown> {
    /** Unique identifier used to match this node against a live DOM element. */
    id: string;
    /** Tag name used when creating the backing DOM element. */
    tag: string;
    /** Optional source element whose state is applied to the DOM node. */
    element?: TElement;
    /** Child virtual nodes in render order. */
    children: VNode<TElement>[];
}

/** A linked-list reference to an element's parent chain, used to resolve ancestor group paths. */
export interface ParentRef {
    /** Identifier of this node within the parent chain. */
    id: string;
    /** Reference to the parent node, or undefined at the root. */
    parent?: ParentRef;
}

/** Configuration for the DOM reconciler, providing element lifecycle callbacks and filtering. */
export interface ReconcilerOptions<TElement = unknown> {
    /** Creates a DOM element for the given tag and id. */
    createElement: (tag: string, id: string) => Element;
    /** Applies a source element's state to its backing DOM node. */
    updateElement: (domNode: Element, element: TElement) => void;
    /** Resolves the DOM tag name to use for a source element. */
    getElementTag: (element: TElement) => string;
    /** CSS selectors for existing DOM children to leave untouched during reconciliation. */
    excludeSelectors?: string[];
    /** Resolves the reconciliation id of a DOM child (defaults to its `id` attribute). */
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
