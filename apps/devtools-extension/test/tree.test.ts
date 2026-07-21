import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    buildContextTree,
} from '../src/panel/composables/use-devtools-store';

import {
    createDevtoolsStore,
} from '../src/panel/composables/use-devtools-store';

import {
    createContextRootNode,
    flattenTree,
    formatNodeTag,
    getNodeAttributes,
    useTree,
} from '../src/panel/composables/use-tree';

import type {
    ContextInfo,
    SerializedNode,
    SerializedProperty,
} from '@ripl/devtools';

const CONTEXT_ID = 'context-1';

function createNode(id: string, parentId: string | null, options: Partial<SerializedNode> = {}): SerializedNode {
    return {
        id,
        parentId,
        elementType: 'rect',
        classes: [],
        isGroup: false,
        properties: [],
        ...options,
    };
}

function createSampleNodes(): SerializedNode[] {
    return [
        createNode('scene-1', null, {
            elementType: 'scene',
            isGroup: true,
        }),
        createNode('group-1', 'scene-1', {
            elementType: 'group',
            isGroup: true,
        }),
        createNode('rect-1', 'group-1'),
        createNode('rect-2', 'group-1'),
        createNode('circle-1', 'scene-1', {
            elementType: 'circle',
        }),
    ];
}

describe('Devtools tree', () => {

    describe('Flatten', () => {

        test('Should show only collapsed roots by default', () => {
            const tree = buildContextTree(createSampleNodes());
            const rows = flattenTree(CONTEXT_ID, tree, new Set());

            expect(rows.length).toBe(1);
            expect(rows[0].kind).toBe('self');
            expect(rows[0].node.id).toBe('scene-1');
            expect(rows[0].hasChildren).toBe(true);
            expect(rows[0].depth).toBe(0);
        });

        test('Should emit open and close rows around expanded group children', () => {
            const tree = buildContextTree(createSampleNodes());
            const rows = flattenTree(CONTEXT_ID, tree, new Set(['scene-1']));

            expect(rows.map(row => `${row.kind}:${row.node.id}`)).toEqual([
                'open:scene-1',
                'self:group-1',
                'self:circle-1',
                'close:scene-1',
            ]);

            expect(rows[1].depth).toBe(1);
            expect(rows[3].depth).toBe(0);
        });

        test('Should keep collapsed grandchildren hidden', () => {
            const tree = buildContextTree(createSampleNodes());
            const rows = flattenTree(CONTEXT_ID, tree, new Set(['scene-1', 'group-1']));

            expect(rows.map(row => `${row.kind}:${row.node.id}`)).toEqual([
                'open:scene-1',
                'open:group-1',
                'self:rect-1',
                'self:rect-2',
                'close:group-1',
                'self:circle-1',
                'close:scene-1',
            ]);

            expect(rows[2].depth).toBe(2);
        });

        test('Should produce unique row keys including the row kind', () => {
            const tree = buildContextTree(createSampleNodes());
            const rows = flattenTree(CONTEXT_ID, tree, new Set(['scene-1', 'group-1']));
            const keys = new Set(rows.map(row => row.key));

            expect(keys.size).toBe(rows.length);
        });

    });

    describe('Attribute formatting', () => {

        test('Should format attributes for each serialized value type', () => {
            const properties: SerializedProperty[] = [
                {
                    key: 'x',
                    valueType: 'number',
                    editable: true,
                    value: 5.12345,
                },
                {
                    key: 'label',
                    valueType: 'string',
                    editable: true,
                    value: 'hello',
                },
                {
                    key: 'visible',
                    valueType: 'boolean',
                    editable: true,
                    value: true,
                },
                {
                    key: 'lineDash',
                    valueType: 'number-array',
                    editable: true,
                    value: [1, 2.5, 3],
                },
                {
                    key: 'fill',
                    valueType: 'color',
                    editable: true,
                    value: '#000000',
                },
                {
                    key: 'gradient',
                    valueType: 'opaque',
                    editable: false,
                    preview: 'LinearGradient(2 stops)',
                },
            ];

            const node = createNode('rect-1', 'root', {
                classes: ['badge', 'badge--small'],
                properties,
            });

            const attributes = getNodeAttributes(node);

            expect(attributes.map(attribute => [attribute.key, attribute.value])).toEqual([
                ['id', 'rect-1'],
                ['class', 'badge badge--small'],
                ['x', '5.123'],
                ['label', 'hello'],
                ['visible', 'true'],
                ['lineDash', '1, 2.5, 3'],
                ['fill', '#000000'],
                ['gradient', 'LinearGradient(2 stops)'],
            ]);
        });

        test('Should omit the class attribute when the node has no classes', () => {
            const attributes = getNodeAttributes(createNode('rect-1', 'root'));

            expect(attributes.map(attribute => attribute.key)).toEqual(['id']);
        });

        test('Should format a self-closing pseudo-XML tag', () => {
            const node = createNode('rect-1', 'root', {
                properties: [
                    {
                        key: 'x',
                        valueType: 'number',
                        editable: true,
                        value: 5,
                    },
                    {
                        key: 'fill',
                        valueType: 'color',
                        editable: true,
                        value: '#000000',
                    },
                ],
            });

            expect(formatNodeTag(node)).toBe('<rect id="rect-1" x="5" fill="#000000"/>');
        });

        test('Should format an opening pseudo-XML tag', () => {
            const node = createNode('group-1', 'scene-1', {
                elementType: 'group',
                isGroup: true,
            });

            expect(formatNodeTag(node, false)).toBe('<group id="group-1">');
        });

    });

    describe('Scene-less context root', () => {

        function createContextInfo(overrides: Partial<ContextInfo> = {}): ContextInfo {
            return {
                contextId: 'context-1',
                label: 'Canvas',
                contextType: 'canvas',
                width: 800.4,
                height: 600.6,
                hasScene: false,
                hasRenderer: false,
                ...overrides,
            };
        }

        test('Should synthesise a context root node with id, type, and rounded size', () => {
            const node = createContextRootNode(createContextInfo());

            expect(node.parentId).toBe(null);
            expect(node.elementType).toBe('context');
            expect(node.isGroup).toBe(false);

            const attributes = getNodeAttributes(node);

            expect(attributes.map(attribute => [attribute.key, attribute.value])).toEqual([
                ['id', 'context-1'],
                ['type', 'canvas'],
                ['width', '800'],
                ['height', '601'],
            ]);
        });

        test('Should format the context root as a self-closing tag', () => {
            const node = createContextRootNode(createContextInfo());

            expect(formatNodeTag(node)).toBe('<context id="context-1" type="canvas" width="800" height="601"/>');
        });

        test('Should emit one root row for a scene-less context and the full tree for a scene-ful one', () => {
            const store = createDevtoolsStore(() => undefined);

            store.handleMessage({
                kind: 'context:added',
                context: createContextInfo({
                    contextId: 'ctx-scene',
                    hasScene: true,
                }),
            });

            store.handleMessage({
                kind: 'context:added',
                context: createContextInfo({
                    contextId: 'ctx-bare',
                    hasScene: false,
                }),
            });

            const sceneNodes: SerializedNode[] = [
                createNode('scene-1', null, {
                    elementType: 'scene',
                    isGroup: true,
                }),
                createNode('rect-1', 'scene-1'),
            ];

            store.handleMessage({
                kind: 'tree:snapshot-begin',
                contextId: 'ctx-scene',
                snapshotId: 1,
                nodeCount: sceneNodes.length,
            });
            store.handleMessage({
                kind: 'tree:chunk',
                contextId: 'ctx-scene',
                snapshotId: 1,
                seq: 0,
                nodes: sceneNodes,
            });
            store.handleMessage({
                kind: 'tree:snapshot-end',
                contextId: 'ctx-scene',
                snapshotId: 1,
            });

            const tree = useTree(store);
            const rows = tree.rows.value;

            const bareRows = rows.filter(row => row.contextId === 'ctx-bare');
            const sceneRows = rows.filter(row => row.contextId === 'ctx-scene');

            expect(bareRows.length).toBe(1);
            expect(bareRows[0].node.elementType).toBe('context');
            expect(bareRows[0].node.id).toBe('ctx-bare');
            expect(bareRows[0].hasChildren).toBe(false);

            expect(sceneRows.length).toBe(1);
            expect(sceneRows[0].node.id).toBe('scene-1');
            expect(sceneRows[0].hasChildren).toBe(true);
        });

    });

});
