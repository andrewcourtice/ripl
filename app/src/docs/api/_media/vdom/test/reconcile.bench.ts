import {
    bench,
    describe,
} from 'vitest';

import {
    ensureGroupPath,
    reconcileNode,
    ReconcilerOptions,
    VNode,
} from '../src';

interface BenchElement {
    tag: string;
    attributes: Record<string, string>;
}

function createBenchOptions(): ReconcilerOptions<BenchElement> {
    return {
        createElement(tag: string, id: string): Element {
            const el = document.createElement(tag);
            el.setAttribute('id', id);
            return el;
        },
        updateElement(domNode: Element, element: BenchElement): void {
            for (const [key, value] of Object.entries(element.attributes)) {
                domNode.setAttribute(key, value);
            }
        },
        getElementTag(element: BenchElement): string {
            return element.tag;
        },
    };
}

function createFlatVNode(count: number): VNode<BenchElement> {
    const children: VNode<BenchElement>[] = [];

    for (let i = 0; i < count; i++) {
        children.push({
            id: `node-${i}`,
            tag: 'div',
            element: {
                tag: 'div',
                attributes: { 'data-index': i.toString() },
            },
            children: [],
        });
    }

    return {
        id: 'root',
        tag: 'div',
        children,
    };
}

function createDeepVNode(depth: number, breadth: number): VNode<BenchElement> {
    function buildLevel(level: number, prefix: string): VNode<BenchElement>[] {
        if (level >= depth) {
            return [];
        }

        const children: VNode<BenchElement>[] = [];

        for (let i = 0; i < breadth; i++) {
            const id = `${prefix}-${level}-${i}`;
            children.push({
                id,
                tag: 'div',
                element: {
                    tag: 'div',
                    attributes: { 'data-level': level.toString() },
                },
                children: buildLevel(level + 1, id),
            });
        }

        return children;
    }

    return {
        id: 'root',
        tag: 'div',
        children: buildLevel(0, 'node'),
    };
}

function createReorderedVNode(count: number): VNode<BenchElement> {
    const children: VNode<BenchElement>[] = [];

    for (let i = count - 1; i >= 0; i--) {
        children.push({
            id: `node-${i}`,
            tag: 'div',
            children: [],
        });
    }

    return {
        id: 'root',
        tag: 'div',
        children,
    };
}

function createPartialUpdateVNode(total: number, removeCount: number, addCount: number): VNode<BenchElement> {
    const children: VNode<BenchElement>[] = [];

    for (let i = removeCount; i < total; i++) {
        children.push({
            id: `node-${i}`,
            tag: 'div',
            children: [],
        });
    }

    for (let i = 0; i < addCount; i++) {
        children.push({
            id: `new-node-${i}`,
            tag: 'div',
            element: {
                tag: 'div',
                attributes: { 'data-new': 'true' },
            },
            children: [],
        });
    }

    return {
        id: 'root',
        tag: 'div',
        children,
    };
}

interface DOMSetup {
    parent: Element;
    domCache: Map<string, Element>;
}

function setupDOMWithChildren(count: number): DOMSetup {
    const parent = document.createElement('div');
    const domCache = new Map<string, Element>();

    for (let i = 0; i < count; i++) {
        const child = document.createElement('div');
        child.setAttribute('id', `node-${i}`);
        parent.appendChild(child);
        domCache.set(`node-${i}`, child);
    }

    return {
        parent,
        domCache,
    };
}

describe('reconcileNode benchmarks', () => {

    describe('flat nodes - initial render', () => {

        bench('100 nodes', () => {
            const parent = document.createElement('div');
            const domCache = new Map<string, Element>();
            reconcileNode(parent, createFlatVNode(100), domCache, createBenchOptions());
        });

        bench('1000 nodes', () => {
            const parent = document.createElement('div');
            const domCache = new Map<string, Element>();
            reconcileNode(parent, createFlatVNode(1000), domCache, createBenchOptions());
        });

        bench('10000 nodes', () => {
            const parent = document.createElement('div');
            const domCache = new Map<string, Element>();
            reconcileNode(parent, createFlatVNode(10000), domCache, createBenchOptions());
        });

    });

    describe('flat nodes - update (no changes)', () => {

        bench('100 nodes', () => {
            const { parent, domCache } = setupDOMWithChildren(100);
            reconcileNode(parent, createFlatVNode(100), domCache, createBenchOptions());
        });

        bench('1000 nodes', () => {
            const { parent, domCache } = setupDOMWithChildren(1000);
            reconcileNode(parent, createFlatVNode(1000), domCache, createBenchOptions());
        });

    });

    describe('reorder', () => {

        bench('100 nodes reversed', () => {
            const { parent, domCache } = setupDOMWithChildren(100);
            reconcileNode(parent, createReorderedVNode(100), domCache, createBenchOptions());
        });

        bench('1000 nodes reversed', () => {
            const { parent, domCache } = setupDOMWithChildren(1000);
            reconcileNode(parent, createReorderedVNode(1000), domCache, createBenchOptions());
        });

    });

    describe('partial update (remove + add)', () => {

        bench('100 total, remove 20, add 20', () => {
            const { parent, domCache } = setupDOMWithChildren(100);
            reconcileNode(parent, createPartialUpdateVNode(100, 20, 20), domCache, createBenchOptions());
        });

        bench('1000 total, remove 200, add 200', () => {
            const { parent, domCache } = setupDOMWithChildren(1000);
            reconcileNode(parent, createPartialUpdateVNode(1000, 200, 200), domCache, createBenchOptions());
        });

    });

    describe('deep nested tree', () => {

        bench('depth 4, breadth 5 (780 nodes)', () => {
            const parent = document.createElement('div');
            const domCache = new Map<string, Element>();
            reconcileNode(parent, createDeepVNode(4, 5), domCache, createBenchOptions());
        });

        bench('depth 3, breadth 10 (1110 nodes)', () => {
            const parent = document.createElement('div');
            const domCache = new Map<string, Element>();
            reconcileNode(parent, createDeepVNode(3, 10), domCache, createBenchOptions());
        });

    });

    describe('ensureGroupPath benchmarks', () => {

        bench('create 10 levels deep', () => {
            const root: VNode = {
                id: 'root',
                tag: 'div',
                children: [],
            };
            const ids = Array.from({ length: 10 }, (_, i) => `group-${i}`);
            ensureGroupPath(root, ids);
        });

        bench('reuse 10 levels deep', () => {
            const root: VNode = {
                id: 'root',
                tag: 'div',
                children: [],
            };
            const ids = Array.from({ length: 10 }, (_, i) => `group-${i}`);
            ensureGroupPath(root, ids);
            ensureGroupPath(root, ids);
        });

    });

});
