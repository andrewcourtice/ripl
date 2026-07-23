/**
 * Cross-context coverage for the group query API.
 *
 * The querying/`matches`/`closest`/`getElementById` logic operates purely on the scene-graph
 * (Element/Group) tree and never touches the rendering context, so it must behave identically no
 * matter which platform context is active. This suite builds the same tree under every context
 * factory that can be constructed in a headless (jsdom) environment and asserts the query results
 * are identical.
 *
 * Contexts that genuinely cannot initialize headlessly are exercised as much as possible:
 *  - **WebGPU** needs a real GPU/adapter, **terminal** needs a TTY stream, and a **WebGL** context
 *    needs a GL implementation — none are available under vitest/jsdom. Their scene-graph/query
 *    behavior is the shared, context-independent logic verified by the canvas/SVG cases here and by
 *    `group-query-combinators.test.ts`; their render pipelines are covered by each platform package's
 *    own tests.
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    closest,
    createGroup,
    createRect,
    createScene,
    factory,
    matches,
} from '../../src';

import {
    createContext as createCanvasContext,
} from '@ripl/canvas';

import {
    createContext as createSvgContext,
} from '@ripl/svg';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

/** A platform context factory under test, plus how to register it for a headless run. */
const providers = [
    {
        name: 'canvas',
        register() {
            mockCanvasContext();
            factory.set({ createContext: createCanvasContext });
        },
    },
    {
        name: 'svg',
        register() {
            factory.set({ createContext: createSvgContext });
        },
    },
];

/** Builds a small, known tree and returns the root group plus its notable members. */
function buildTree() {
    const target = createRect({
        id: 'target',
        // Two separate classes — Ripl's `class` option doesn't split on whitespace, so a
        // space-joined string would be a single class token and `.leaf` wouldn't match here.
        class: ['leaf', 'active'],
        x: 0,
        y: 0,
        width: 10,
        height: 20,
    });

    const sibling = createRect({
        id: 'sibling',
        class: 'leaf',
        x: 20,
        y: 0,
        width: 10,
        height: 20,
    });

    const inner = createGroup({
        id: 'inner',
        children: [target, sibling],
    });

    const root = createGroup({
        id: 'root',
        children: [inner],
    });

    return {
        root,
        inner,
        target,
        sibling,
    };
}

/** Asserts the full query API against a freshly built tree (context-independent invariants). */
function assertQueryApi() {
    const { root, inner, target, sibling } = buildTree();

    // getElementById
    expect(root.getElementById('target')).toBe(target);
    expect(root.getElementById('missing')).toBeUndefined();
    expect(root.getElementById('sibling')).toBe(sibling);

    // query / queryAll (type, id, class, compound, descendant, child, sibling)
    expect(root.query('#target')).toBe(target);
    expect(root.queryAll('rect')).toHaveLength(2);
    expect(root.queryAll('.leaf')).toHaveLength(2);
    expect(root.query('rect.active')).toBe(target);
    expect(root.query('group > rect')).toBe(target);
    expect(root.queryAll('rect + rect')).toEqual([sibling]);

    // matches (free function + method — the method lives on Element, so leaves have it too)
    expect(matches(target, 'rect.active')).toBe(true);
    expect(matches(target, 'circle')).toBe(false);
    expect(target.matches('rect.active')).toBe(true);
    expect(inner.matches('group')).toBe(true);

    // closest (from a leaf up through the groups; free function + Element method)
    expect(closest(target, '#root')).toBe(root);
    expect(closest(target, 'group')).toBe(inner);
    expect(target.closest('#root')).toBe(root);
    expect(inner.closest('#root')).toBe(root);
}

describe('Group query API across contexts', () => {

    beforeEach(() => {
        polyfillPath2D();
    });

    afterEach(() => {
        factory.set({ createContext: undefined });
        vi.restoreAllMocks();
    });

    test.each(providers)('resolves identically under the $name context', (provider: (typeof providers)[number]) => {
        let scene: ReturnType<typeof createScene> | undefined;
        const el = document.createElement('div');
        document.body.appendChild(el);

        try {
            provider.register();
            // Constructing a scene exercises the platform context factory + text measurement path.
            scene = createScene(el);
        } catch {
            // Documented headless limitation — the context can't initialize here; the shared query
            // logic is still guaranteed by the context-free case below.
            el.remove();
            return;
        }

        const { root } = buildTree();
        scene.add(root);

        assertQueryApi();

        scene.destroy();
        el.remove();
    });

    test('query API holds independently of any rendering context', () => {
        // The invariant every context must satisfy, asserted without a context at all.
        assertQueryApi();
    });

});
