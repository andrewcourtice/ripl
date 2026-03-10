import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createGroup,
    createRect,
} from '../../src';

import {
    query,
    queryAll,
} from '../../src/core/group';

describe('Group.query / Group.queryAll', () => {

    test('Should query by type', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect],
        });

        const results = group.queryAll('rect');

        expect(results).toContain(rect);
        expect(results.length).toBe(1);
    });

    test('Should query by id', () => {
        const rect = createRect({
            id: 'my-rect',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect],
        });

        const result = group.query('#my-rect');

        expect(result).toBe(rect);
    });

    test('Should query by class', () => {
        const rect = createRect({
            class: 'highlight',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const other = createRect({
            x: 20,
            y: 20,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect, other],
        });

        const results = group.queryAll('.highlight');

        expect(results).toContain(rect);
        expect(results).not.toContain(other);
    });

    test('Should query by compound selector (type + class)', () => {
        const rect = createRect({
            class: 'active',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect],
        });

        const results = group.queryAll('rect.active');

        expect(results).toContain(rect);
    });

    test('Should return empty array for no matches', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect],
        });

        const results = group.queryAll('.nonexistent');

        expect(results).toEqual([]);
    });

    test('Should return undefined from query() for no match', () => {
        const group = createGroup();

        const result = group.query('#missing');

        expect(result).toBeUndefined();
    });

    test('Should query nested descendants', () => {
        const rect = createRect({
            id: 'deep-rect',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const innerGroup = createGroup({
            children: [rect],
        });

        const outerGroup = createGroup({
            children: [innerGroup],
        });

        const result = outerGroup.query('#deep-rect');

        expect(result).toBe(rect);
    });

    test('Should query multiple matching elements', () => {
        const rect1 = createRect({
            class: 'item',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const rect2 = createRect({
            class: 'item',
            x: 20,
            y: 20,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect1, rect2],
        });

        const results = group.queryAll('.item');

        expect(results.length).toBe(2);
        expect(results).toContain(rect1);
        expect(results).toContain(rect2);
    });

});

describe('queryAll / query (standalone)', () => {

    test('Should work with a single element', () => {
        const rect = createRect({
            id: 'standalone',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const results = queryAll(rect, '#standalone');

        expect(results).toContain(rect);
    });

    test('Should work with an array of elements', () => {
        const rect1 = createRect({
            class: 'a',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const rect2 = createRect({
            class: 'b',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect1, rect2],
        });

        const results = queryAll(group, '.a');

        expect(results).toContain(rect1);
        expect(results).not.toContain(rect2);
    });

    test('query should return first match', () => {
        const rect1 = createRect({
            class: 'item',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const rect2 = createRect({
            class: 'item',
            x: 20,
            y: 20,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect1, rect2],
        });

        const result = query(group, '.item');

        expect(result).toBe(rect1);
    });

});
