import {
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    createDevtoolsStore,
} from '../src/panel/composables/use-devtools-store';

import type {
    DevtoolsStore,
} from '../src/panel/composables/use-devtools-store';

import type {
    ContextInfo,
    ExtensionMessage,
    SerializedNode,
    SerializedProperty,
} from '@ripl/devtools';

const CONTEXT_ID = 'context-1';

function createContextInfo(contextId: string = CONTEXT_ID): ContextInfo {
    return {
        contextId,
        label: 'Test context',
        contextType: 'canvas',
        width: 400,
        height: 300,
        hasScene: true,
        hasRenderer: true,
    };
}

function createNode(id: string, parentId: string | null, properties: SerializedProperty[] = []): SerializedNode {
    return {
        id,
        parentId,
        elementType: parentId === null ? 'scene' : 'rect',
        classes: [],
        isGroup: parentId === null,
        properties,
    };
}

function sendSnapshot(store: DevtoolsStore, contextId: string, snapshotId: number, nodes: SerializedNode[]): void {
    store.handleMessage({
        kind: 'tree:snapshot-begin',
        contextId,
        snapshotId,
        nodeCount: nodes.length,
    });

    store.handleMessage({
        kind: 'tree:chunk',
        contextId,
        snapshotId,
        seq: 0,
        nodes,
    });

    store.handleMessage({
        kind: 'tree:snapshot-end',
        contextId,
        snapshotId,
    });
}

describe('Devtools store', () => {

    let sent: ExtensionMessage[];
    let store: DevtoolsStore;

    beforeEach(() => {
        sent = [];
        store = createDevtoolsStore(message => sent.push(message));
    });

    describe('Contexts', () => {

        test('Should register a context and request its tree', () => {
            store.handleMessage({
                kind: 'context:added',
                context: createContextInfo(),
            });

            expect(store.contexts.size).toBe(1);
            expect(store.hasContexts.value).toBe(true);
            expect(sent).toContainEqual({
                kind: 'tree:request',
                contextId: CONTEXT_ID,
            });
        });

        test('Should not re-request the tree on context updates', () => {
            store.handleMessage({
                kind: 'context:added',
                context: createContextInfo(),
            });

            store.handleMessage({
                kind: 'context:updated',
                context: {
                    ...createContextInfo(),
                    width: 800,
                },
            });

            const requests = sent.filter(message => message.kind === 'tree:request');

            expect(requests.length).toBe(1);
            expect(store.contexts.get(CONTEXT_ID)?.width).toBe(800);
        });

    });

    describe('Snapshot assembly', () => {

        test('Should assemble chunks in seq order regardless of arrival order', () => {
            store.handleMessage({
                kind: 'tree:snapshot-begin',
                contextId: CONTEXT_ID,
                snapshotId: 1,
                nodeCount: 3,
            });

            store.handleMessage({
                kind: 'tree:chunk',
                contextId: CONTEXT_ID,
                snapshotId: 1,
                seq: 1,
                nodes: [
                    createNode('child-2', 'root'),
                ],
            });

            store.handleMessage({
                kind: 'tree:chunk',
                contextId: CONTEXT_ID,
                snapshotId: 1,
                seq: 0,
                nodes: [
                    createNode('root', null),
                    createNode('child-1', 'root'),
                ],
            });

            store.handleMessage({
                kind: 'tree:snapshot-end',
                contextId: CONTEXT_ID,
                snapshotId: 1,
            });

            const tree = store.getTree(CONTEXT_ID);

            expect(tree).toBeDefined();
            expect(tree?.rootIds).toEqual(['root']);
            expect(tree?.childrenByParent.get('root')).toEqual(['child-1', 'child-2']);
            expect(tree?.nodes.size).toBe(3);
        });

        test('Should discard chunks and ends belonging to a superseded snapshot', () => {
            store.handleMessage({
                kind: 'tree:snapshot-begin',
                contextId: CONTEXT_ID,
                snapshotId: 1,
                nodeCount: 1,
            });

            store.handleMessage({
                kind: 'tree:chunk',
                contextId: CONTEXT_ID,
                snapshotId: 1,
                seq: 0,
                nodes: [
                    createNode('stale', null),
                ],
            });

            store.handleMessage({
                kind: 'tree:snapshot-begin',
                contextId: CONTEXT_ID,
                snapshotId: 2,
                nodeCount: 1,
            });

            // Late traffic for the superseded snapshot must be ignored.
            store.handleMessage({
                kind: 'tree:chunk',
                contextId: CONTEXT_ID,
                snapshotId: 1,
                seq: 1,
                nodes: [
                    createNode('stale-2', 'stale'),
                ],
            });

            store.handleMessage({
                kind: 'tree:snapshot-end',
                contextId: CONTEXT_ID,
                snapshotId: 1,
            });

            expect(store.getTree(CONTEXT_ID)).toBeUndefined();

            store.handleMessage({
                kind: 'tree:chunk',
                contextId: CONTEXT_ID,
                snapshotId: 2,
                seq: 0,
                nodes: [
                    createNode('fresh', null),
                ],
            });

            store.handleMessage({
                kind: 'tree:snapshot-end',
                contextId: CONTEXT_ID,
                snapshotId: 2,
            });

            const tree = store.getTree(CONTEXT_ID);

            expect(tree?.nodes.has('fresh')).toBe(true);
            expect(tree?.nodes.has('stale')).toBe(false);
        });

        test('Should ignore a snapshot begin older than the committed snapshot', () => {
            sendSnapshot(store, CONTEXT_ID, 5, [createNode('root', null)]);

            store.handleMessage({
                kind: 'tree:snapshot-begin',
                contextId: CONTEXT_ID,
                snapshotId: 3,
                nodeCount: 1,
            });

            store.handleMessage({
                kind: 'tree:chunk',
                contextId: CONTEXT_ID,
                snapshotId: 3,
                seq: 0,
                nodes: [
                    createNode('old-root', null),
                ],
            });

            store.handleMessage({
                kind: 'tree:snapshot-end',
                contextId: CONTEXT_ID,
                snapshotId: 3,
            });

            expect(store.getTree(CONTEXT_ID)?.nodes.has('root')).toBe(true);
            expect(store.getTree(CONTEXT_ID)?.nodes.has('old-root')).toBe(false);
        });

    });

    describe('Property updates', () => {

        test('Should patch existing properties and append new ones', () => {
            const revisionBefore = store.treeRevision.value;

            sendSnapshot(store, CONTEXT_ID, 1, [
                createNode('root', null),
                createNode('rect-1', 'root', [
                    {
                        key: 'x',
                        valueType: 'number',
                        editable: true,
                        value: 5,
                    },
                ]),
            ]);

            store.handleMessage({
                kind: 'tree:props',
                contextId: CONTEXT_ID,
                updates: [
                    {
                        elementId: 'rect-1',
                        properties: [
                            {
                                key: 'x',
                                valueType: 'number',
                                editable: true,
                                value: 25,
                            },
                            {
                                key: 'fill',
                                valueType: 'color',
                                editable: true,
                                value: '#ff0000',
                            },
                        ],
                    },
                ],
            });

            const node = store.getTree(CONTEXT_ID)?.nodes.get('rect-1');
            const propertyX = node?.properties.find(property => property.key === 'x');
            const fill = node?.properties.find(property => property.key === 'fill');

            expect(propertyX?.value).toBe(25);
            expect(fill?.value).toBe('#ff0000');
            expect(store.treeRevision.value).toBeGreaterThan(revisionBefore);
        });

        test('Should patch the selected detail when props target the selection', () => {
            sendSnapshot(store, CONTEXT_ID, 1, [
                createNode('root', null),
                createNode('rect-1', 'root'),
            ]);

            store.selectElement(CONTEXT_ID, 'rect-1');

            store.handleMessage({
                kind: 'element:detail',
                contextId: CONTEXT_ID,
                elementId: 'rect-1',
                properties: [
                    {
                        key: 'x',
                        valueType: 'number',
                        editable: true,
                        value: 5,
                    },
                ],
                events: [],
                boundingBox: {
                    left: 0,
                    top: 0,
                    width: 10,
                    height: 10,
                },
            });

            store.handleMessage({
                kind: 'tree:props',
                contextId: CONTEXT_ID,
                updates: [
                    {
                        elementId: 'rect-1',
                        properties: [
                            {
                                key: 'x',
                                valueType: 'number',
                                editable: true,
                                value: 99,
                            },
                        ],
                    },
                ],
            });

            const propertyX = store.selectedDetail.value?.properties.find(property => property.key === 'x');

            expect(propertyX?.value).toBe(99);
        });

    });

    describe('Selection', () => {

        test('Should send element:inspect when selecting an element', () => {
            store.selectElement(CONTEXT_ID, 'rect-1');

            expect(store.selection.value).toEqual({
                contextId: CONTEXT_ID,
                elementId: 'rect-1',
            });

            expect(sent).toContainEqual({
                kind: 'element:inspect',
                contextId: CONTEXT_ID,
                elementId: 'rect-1',
            });
        });

        test('Should apply element:detail only for the current selection', () => {
            store.selectElement(CONTEXT_ID, 'rect-1');

            store.handleMessage({
                kind: 'element:detail',
                contextId: CONTEXT_ID,
                elementId: 'other-element',
                properties: [],
                events: [],
                boundingBox: {
                    left: 0,
                    top: 0,
                    width: 1,
                    height: 1,
                },
            });

            expect(store.selectedDetail.value).toBeNull();

            store.handleMessage({
                kind: 'element:detail',
                contextId: CONTEXT_ID,
                elementId: 'rect-1',
                properties: [],
                events: [
                    {
                        type: 'click',
                        hasListeners: true,
                    },
                ],
                boundingBox: {
                    left: 0,
                    top: 0,
                    width: 1,
                    height: 1,
                },
            });

            expect(store.selectedDetail.value?.events[0]?.hasListeners).toBe(true);
        });

        test('Should clear the selection when its context is removed', () => {
            store.handleMessage({
                kind: 'context:added',
                context: createContextInfo(),
            });

            store.selectElement(CONTEXT_ID, 'rect-1');

            store.handleMessage({
                kind: 'context:removed',
                contextId: CONTEXT_ID,
            });

            expect(store.selection.value).toBeNull();
            expect(store.selectedDetail.value).toBeNull();
            expect(store.getTree(CONTEXT_ID)).toBeUndefined();
        });

        test('Should clear the selection when a new snapshot drops the element', () => {
            sendSnapshot(store, CONTEXT_ID, 1, [
                createNode('root', null),
                createNode('rect-1', 'root'),
            ]);

            store.selectElement(CONTEXT_ID, 'rect-1');

            sendSnapshot(store, CONTEXT_ID, 2, [
                createNode('root', null),
            ]);

            expect(store.selection.value).toBeNull();
        });

        test('Should keep the selection when a new snapshot still contains the element', () => {
            sendSnapshot(store, CONTEXT_ID, 1, [
                createNode('root', null),
                createNode('rect-1', 'root'),
            ]);

            store.selectElement(CONTEXT_ID, 'rect-1');

            sendSnapshot(store, CONTEXT_ID, 2, [
                createNode('root', null),
                createNode('rect-1', 'root'),
            ]);

            expect(store.selection.value?.elementId).toBe('rect-1');
        });

    });

    describe('Lifecycle', () => {

        test('Should clear all state on bridge:bye', () => {
            store.handleMessage({
                kind: 'context:added',
                context: createContextInfo(),
            });

            sendSnapshot(store, CONTEXT_ID, 1, [createNode('root', null)]);
            store.selectElement(CONTEXT_ID, 'root');

            store.handleMessage({
                kind: 'bridge:bye',
            });

            expect(store.contexts.size).toBe(0);
            expect(store.getTree(CONTEXT_ID)).toBeUndefined();
            expect(store.selection.value).toBeNull();
            expect(store.hasContexts.value).toBe(false);
        });

    });

    describe('Outbound actions', () => {

        test('Should send the full debug triple for renderer:set-debug', () => {
            store.setRendererDebug(CONTEXT_ID, {
                fps: true,
                elementCount: false,
                boundingBoxes: true,
            });

            expect(sent).toContainEqual({
                kind: 'renderer:set-debug',
                contextId: CONTEXT_ID,
                debug: {
                    fps: true,
                    elementCount: false,
                    boundingBoxes: true,
                },
            });
        });

        test('Should send element:set-property for the current selection', () => {
            store.selectElement(CONTEXT_ID, 'rect-1');
            store.setSelectedProperty('x', 42);

            expect(sent).toContainEqual({
                kind: 'element:set-property',
                contextId: CONTEXT_ID,
                elementId: 'rect-1',
                key: 'x',
                value: 42,
            });
        });

    });

});
