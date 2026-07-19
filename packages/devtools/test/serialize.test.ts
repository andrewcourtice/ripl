import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    TREE_CHUNK_SIZE,
} from '../src/constants';

import {
    chunkNodes,
    serializeElement,
    serializeElementProperties,
    serializeProperty,
    serializeTree,
} from '../src/serialize';

import {
    createGroup,
    createRect,
    createScene,
    factory,
} from '@ripl/core';

import type {
    Scene,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Serialize', () => {

    describe('serializeProperty', () => {

        test('Should serialize a finite number as an editable number', () => {
            const property = serializeProperty('x', 42);

            expect(property.valueType).toBe('number');
            expect(property.editable).toBe(true);
            expect(property.value).toBe(42);
        });

        test('Should serialize color strings as editable colors', () => {
            expect(serializeProperty('fill', '#000000').valueType).toBe('color');
            expect(serializeProperty('fill', '#abc').valueType).toBe('color');
            expect(serializeProperty('fill', '#AABBCCDD').valueType).toBe('color');
            expect(serializeProperty('fill', 'rgb(1, 2, 3)').valueType).toBe('color');
            expect(serializeProperty('fill', 'rgba(1, 2, 3, 0.5)').valueType).toBe('color');
            expect(serializeProperty('fill', 'hsl(120, 50%, 50%)').valueType).toBe('color');
            expect(serializeProperty('fill', 'hsla(120, 50%, 50%, 0.5)').valueType).toBe('color');
            expect(serializeProperty('fill', '#000000').editable).toBe(true);
        });

        test('Should serialize non-color strings as editable strings', () => {
            const property = serializeProperty('font', '12px sans-serif');

            expect(property.valueType).toBe('string');
            expect(property.editable).toBe(true);
            expect(property.value).toBe('12px sans-serif');
        });

        test('Should serialize booleans as editable booleans', () => {
            const property = serializeProperty('visible', true);

            expect(property.valueType).toBe('boolean');
            expect(property.editable).toBe(true);
            expect(property.value).toBe(true);
        });

        test('Should serialize arrays of finite numbers as editable number arrays', () => {
            const property = serializeProperty('lineDash', [4, 2]);

            expect(property.valueType).toBe('number-array');
            expect(property.editable).toBe(true);
            expect(property.value).toEqual([4, 2]);
        });

        test('Should serialize a function as a non-editable opaque value with a preview', () => {
            const property = serializeProperty('fill', function customFill() {});

            expect(property.valueType).toBe('opaque');
            expect(property.editable).toBe(false);
            expect(property.value).toBeUndefined();
            expect(property.preview).toContain('customFill');
        });

        test('Should serialize non-finite and mixed values as opaque', () => {
            expect(serializeProperty('x', NaN).valueType).toBe('opaque');
            expect(serializeProperty('x', Infinity).valueType).toBe('opaque');
            expect(serializeProperty('lineDash', [1, NaN]).valueType).toBe('opaque');
            expect(serializeProperty('data', {
                a: 1,
            }).valueType).toBe('opaque');
            expect(serializeProperty('data', undefined).valueType).toBe('opaque');
        });

        test('Should truncate long opaque previews', () => {
            const property = serializeProperty('data', {
                toString: () => 'y'.repeat(200),
            });

            expect(property.valueType).toBe('opaque');
            expect(property.preview?.length).toBeLessThanOrEqual(61);
        });

        test('Should use the constructor name as the opaque preview for class instances', () => {
            class LinearGradient {}

            const property = serializeProperty('fill', new LinearGradient());

            expect(property.valueType).toBe('opaque');
            expect(property.preview).toBe('LinearGradient');
        });

    });

    describe('Tree serialization', () => {

        let el: HTMLDivElement;
        let scene: Scene;

        beforeEach(() => {
            mockCanvasContext();
            factory.set({
                createContext,
            });
            el = document.createElement('div');
            document.body.appendChild(el);
            scene = createScene(el);
        });

        afterEach(() => {
            scene.destroy();
            el.remove();
            factory.set({
                createContext: undefined,
            });
            vi.restoreAllMocks();
        });

        test('Should serialize only set state keys on a rect', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                fill: '#000000',
            });

            const properties = serializeElementProperties(rect);
            const keys = properties.map(property => property.key);

            expect(keys).toContain('x');
            expect(keys).toContain('y');
            expect(keys).toContain('width');
            expect(keys).toContain('height');
            expect(keys).toContain('fill');
            expect(keys).not.toContain('stroke');
            expect(keys).not.toContain('lineWidth');

            const fill = properties.find(property => property.key === 'fill');

            expect(fill?.valueType).toBe('color');
            expect(fill?.editable).toBe(true);
        });

        test('Should serialize groups with correct parentId links and a scene root', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            });

            const group = createGroup({
                children: [rect],
            });

            const sibling = createRect({
                x: 5,
                y: 5,
                width: 5,
                height: 5,
            });

            scene.add([group, sibling]);

            const nodes = serializeTree(scene);
            const root = nodes[0];
            const groupNode = nodes.find(node => node.id === group.id);
            const rectNode = nodes.find(node => node.id === rect.id);
            const siblingNode = nodes.find(node => node.id === sibling.id);

            expect(nodes.length).toBe(4);
            expect(root.id).toBe(scene.id);
            expect(root.parentId).toBeNull();
            expect(root.elementType).toBe('scene');
            expect(root.isGroup).toBe(true);
            expect(groupNode?.isGroup).toBe(true);
            expect(groupNode?.parentId).toBe(scene.id);
            expect(rectNode?.isGroup).toBe(false);
            expect(rectNode?.parentId).toBe(group.id);
            expect(siblingNode?.parentId).toBe(scene.id);
        });

        test('Should serialize a standalone element with the given parentId', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                class: 'bar',
            });

            const node = serializeElement(rect, 'parent-id');

            expect(node.id).toBe(rect.id);
            expect(node.parentId).toBe('parent-id');
            expect(node.elementType).toBe('rect');
            expect(node.classes).toEqual(['bar']);
        });

        test('Should chunk a 1000 element scene into ordered chunks that reassemble', () => {
            const rects = Array.from({
                length: 1000,
            }, (_, index) => createRect({
                x: index,
                y: index,
                width: 1,
                height: 1,
            }));

            scene.add(rects);

            const nodes = serializeTree(scene);
            const chunks = chunkNodes(nodes);
            const reassembled = chunks.flat();

            expect(nodes.length).toBe(1001);
            expect(chunks.length).toBeGreaterThanOrEqual(3);
            expect(chunks.every(chunk => chunk.length <= TREE_CHUNK_SIZE)).toBe(true);
            expect(reassembled).toEqual(nodes);
        });

        test('Should produce no chunks for an empty node list', () => {
            expect(chunkNodes([])).toEqual([]);
        });

    });

});
