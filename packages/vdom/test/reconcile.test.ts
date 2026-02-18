import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createVNode,
    ensureGroupPath,
    getAncestorGroupIds,
    reconcileNode,
    ReconcilerOptions,
    VNode,
} from '../src';

function createDOMElement(tag: string, id?: string): Element {
    const el = document.createElement(tag);
    if (id) {
        el.setAttribute('id', id);
    }
    return el;
}

interface TestElement {
    tag: string;
    attributes: Record<string, string>;
    textContent?: string;
}

function createTestOptions(updates: Map<string, Record<string, string>> = new Map()): ReconcilerOptions<TestElement> {
    return {
        createElement(tag: string, id: string): Element {
            const el = document.createElement(tag);
            el.setAttribute('id', id);
            return el;
        },
        updateElement(domNode: Element, element: TestElement): void {
            for (const [key, value] of Object.entries(element.attributes)) {
                domNode.setAttribute(key, value);
            }
            if (element.textContent) {
                domNode.textContent = element.textContent;
            }
            updates.set(domNode.getAttribute('id')!, element.attributes);
        },
        getElementTag(element: TestElement): string {
            return element.tag;
        },
    };
}

describe('VDOM', () => {

    describe('getAncestorGroupIds', () => {

        test('should return empty array for element with no parent', () => {
            const element = { id: 'child' };
            expect(getAncestorGroupIds(element)).toEqual([]);
        });

        test('should return empty array for element with single parent (root)', () => {
            const root = { id: 'root' };
            const element = {
                id: 'child',
                parent: root,
            };
            expect(getAncestorGroupIds(element)).toEqual([]);
        });

        test('should return intermediate ancestor ids', () => {
            const root = { id: 'root' };
            const group1 = {
                id: 'group-1',
                parent: root,
            };
            const group2 = {
                id: 'group-2',
                parent: group1,
            };
            const element = {
                id: 'child',
                parent: group2,
            };
            expect(getAncestorGroupIds(element)).toEqual(['group-1', 'group-2']);
        });

        test('should return deeply nested ancestor ids in order', () => {
            const root = { id: 'root' };
            const a = {
                id: 'a',
                parent: root,
            };
            const b = {
                id: 'b',
                parent: a,
            };
            const c = {
                id: 'c',
                parent: b,
            };
            const d = {
                id: 'd',
                parent: c,
            };
            expect(getAncestorGroupIds(d)).toEqual(['a', 'b', 'c']);
        });

    });

    describe('ensureGroupPath', () => {

        test('should return root when groupIds is empty', () => {
            const root = createVNode('root', 'div');
            const result = ensureGroupPath(root, []);
            expect(result).toBe(root);
        });

        test('should create a single group child', () => {
            const root = createVNode('root', 'div');
            const result = ensureGroupPath(root, ['group-1']);

            expect(root.children).toHaveLength(1);
            expect(root.children[0].id).toBe('group-1');
            expect(root.children[0].tag).toBe('g');
            expect(result).toBe(root.children[0]);
        });

        test('should create nested group path', () => {
            const root = createVNode('root', 'div');
            const result = ensureGroupPath(root, ['group-1', 'group-2', 'group-3']);

            expect(root.children).toHaveLength(1);
            expect(root.children[0].id).toBe('group-1');
            expect(root.children[0].children).toHaveLength(1);
            expect(root.children[0].children[0].id).toBe('group-2');
            expect(root.children[0].children[0].children).toHaveLength(1);
            expect(root.children[0].children[0].children[0].id).toBe('group-3');
            expect(result.id).toBe('group-3');
        });

        test('should reuse existing group nodes', () => {
            const root = createVNode('root', 'div');

            ensureGroupPath(root, ['group-1', 'group-2']);
            const existingGroup1 = root.children[0];

            ensureGroupPath(root, ['group-1', 'group-3']);

            expect(root.children).toHaveLength(1);
            expect(root.children[0]).toBe(existingGroup1);
            expect(root.children[0].children).toHaveLength(2);
            expect(root.children[0].children[0].id).toBe('group-2');
            expect(root.children[0].children[1].id).toBe('group-3');
        });

        test('should use custom default tag', () => {
            const root = createVNode('root', 'div');
            ensureGroupPath(root, ['group-1'], 'section');

            expect(root.children[0].tag).toBe('section');
        });

    });

    describe('reconcileNode', () => {

        test('should add new children to empty parent', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        children: [],
                    },
                    {
                        id: 'child-2',
                        tag: 'p',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children).toHaveLength(2);
            expect(parent.children[0].getAttribute('id')).toBe('child-1');
            expect(parent.children[1].getAttribute('id')).toBe('child-2');
        });

        test('should remove stale children', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const child1 = createDOMElement('span', 'child-1');
            const child2 = createDOMElement('span', 'child-2');
            parent.appendChild(child1);
            parent.appendChild(child2);

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children).toHaveLength(1);
            expect(parent.children[0].getAttribute('id')).toBe('child-1');
        });

        test('should remove stale children from domCache', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const child1 = createDOMElement('span', 'child-1');
            const child2 = createDOMElement('span', 'child-2');
            parent.appendChild(child1);
            parent.appendChild(child2);
            domCache.set('child-1', child1);
            domCache.set('child-2', child2);

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(domCache.has('child-1')).toBe(true);
            expect(domCache.has('child-2')).toBe(false);
        });

        test('should reorder children to match vnode order', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const child1 = createDOMElement('span', 'child-1');
            const child2 = createDOMElement('span', 'child-2');
            const child3 = createDOMElement('span', 'child-3');
            parent.appendChild(child1);
            parent.appendChild(child2);
            parent.appendChild(child3);

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-3',
                        tag: 'span',
                        children: [],
                    },
                    {
                        id: 'child-1',
                        tag: 'span',
                        children: [],
                    },
                    {
                        id: 'child-2',
                        tag: 'span',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children[0].getAttribute('id')).toBe('child-3');
            expect(parent.children[1].getAttribute('id')).toBe('child-1');
            expect(parent.children[2].getAttribute('id')).toBe('child-2');
        });

        test('should update element attributes via updateElement callback', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const updates = new Map<string, Record<string, string>>();
            const options = createTestOptions(updates);

            const testElement: TestElement = {
                tag: 'span',
                attributes: {
                    'data-value': '42',
                },
                textContent: 'hello',
            };

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        element: testElement,
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children[0].getAttribute('data-value')).toBe('42');
            expect(parent.children[0].textContent).toBe('hello');
            expect(updates.get('child-1')).toEqual({ 'data-value': '42' });
        });

        test('should use getElementTag when element is present', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const testElement: TestElement = {
                tag: 'article',
                attributes: {},
            };

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        element: testElement,
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children[0].tagName.toLowerCase()).toBe('article');
        });

        test('should use vnode tag when no element is present', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'section',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children[0].tagName.toLowerCase()).toBe('section');
        });

        test('should populate domCache for new elements', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(domCache.has('child-1')).toBe(true);
            expect(domCache.get('child-1')).toBe(parent.children[0]);
        });

        test('should reuse elements from domCache', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const cachedElement = createDOMElement('span', 'child-1');
            domCache.set('child-1', cachedElement);

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children[0]).toBe(cachedElement);
        });

        test('should reconcile nested children recursively', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'group-1',
                        tag: 'div',
                        children: [
                            {
                                id: 'nested-1',
                                tag: 'span',
                                children: [],
                            },
                            {
                                id: 'nested-2',
                                tag: 'span',
                                children: [],
                            },
                        ],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children).toHaveLength(1);
            expect(parent.children[0].getAttribute('id')).toBe('group-1');
            expect(parent.children[0].children).toHaveLength(2);
            expect(parent.children[0].children[0].getAttribute('id')).toBe('nested-1');
            expect(parent.children[0].children[1].getAttribute('id')).toBe('nested-2');
        });

        test('should skip excluded elements via excludeSelectors', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options: ReconcilerOptions<TestElement> = {
                ...createTestOptions(),
                excludeSelectors: ['defs', '.protected'],
            };

            const defsEl = document.createElement('defs');
            const protectedEl = document.createElement('div');
            protectedEl.classList.add('protected');
            parent.appendChild(defsEl);
            parent.appendChild(protectedEl);

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            const childIds = Array.from(parent.children).map(c => c.tagName.toLowerCase());
            expect(childIds).toContain('defs');
            expect(parent.querySelector('.protected')).not.toBeNull();
            expect(parent.querySelector('#child-1')).not.toBeNull();
        });

        test('should handle mixed add, remove, and reorder in one pass', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            const existing1 = createDOMElement('span', 'a');
            const existing2 = createDOMElement('span', 'b');
            const existing3 = createDOMElement('span', 'c');
            parent.appendChild(existing1);
            parent.appendChild(existing2);
            parent.appendChild(existing3);

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'c',
                        tag: 'span',
                        children: [],
                    },
                    {
                        id: 'd',
                        tag: 'span',
                        children: [],
                    },
                    {
                        id: 'a',
                        tag: 'span',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children).toHaveLength(3);
            expect(parent.children[0].getAttribute('id')).toBe('c');
            expect(parent.children[1].getAttribute('id')).toBe('d');
            expect(parent.children[2].getAttribute('id')).toBe('a');
            expect(parent.children[0]).toBe(existing3);
            expect(parent.children[2]).toBe(existing1);
        });

        test('should remove all children when vnode has no children', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options = createTestOptions();

            parent.appendChild(createDOMElement('span', 'child-1'));
            parent.appendChild(createDOMElement('span', 'child-2'));
            domCache.set('child-1', parent.children[0]);
            domCache.set('child-2', parent.children[1]);

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children).toHaveLength(0);
            expect(domCache.has('child-1')).toBe(false);
            expect(domCache.has('child-2')).toBe(false);
        });

        test('should support custom getChildId', () => {
            const parent = createDOMElement('div');
            const domCache = new Map<string, Element>();
            const options: ReconcilerOptions<TestElement> = {
                ...createTestOptions(),
                getChildId: (el) => el.getAttribute('data-key'),
            };

            const child1 = createDOMElement('span');
            child1.setAttribute('data-key', 'child-1');
            parent.appendChild(child1);

            const vnode: VNode<TestElement> = {
                id: 'root',
                tag: 'div',
                children: [
                    {
                        id: 'child-1',
                        tag: 'span',
                        children: [],
                    },
                ],
            };

            reconcileNode(parent, vnode, domCache, options);

            expect(parent.children).toHaveLength(1);
            expect(parent.children[0]).toBe(child1);
        });

    });

});
