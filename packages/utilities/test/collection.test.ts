import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    arrayDifference,
    arrayFind,
    arrayForEach,
    arrayIntersection,
    arrayMap,
} from '../src';

describe('Utilities', () => {

    describe('Array', () => {
        const source = Array.from({ length: 10 }, (_, i) => ({
            id: `item-${i + 1}`,
            label: `Item ${i + 1}`,
            mod: (i + 1) % 3,
        }));

        test('Should iterate over an array', () => {
            let tagged = 0;

            arrayForEach(source, () => tagged++);

            expect(tagged).toBe(source.length);
        });

        test('Should iterate over an array in reverse', () => {
            const indexes = [] as number[];

            arrayForEach(source, (_, i) => indexes.push(i), -1);

            expect(indexes.length).toBe(source.length);
            expect(indexes[0]).toBe(source.length - 1);
            expect(indexes[indexes.length - 1]).toBe(0);
        });

        test('Should map an array to a new value', () => {
            const mapped = arrayMap(source, value => ({
                tag: Math.random(),
                value,
            }));

            expect(mapped.length).toBe(source.length);
            expect(mapped[0]).toHaveProperty('tag');
            expect(mapped[0]).toHaveProperty('value');
        });

        test('Should find a value in an array', () => {
            const result1 = arrayFind(source, value => value.id === 'item-8');
            const result2 = arrayFind(source, value => value.id === 'item-85');

            expect(result1).toBeDefined();
            expect(result2).toBeUndefined();
            expect(result1?.id).toBe('item-8');
        });

        test('Should find a value in an array in reverse', () => {
            const result = arrayFind(source, value => value.mod === 0, -1);

            expect(result).toBe(source[source.length - 2]);
        });

        test('Should find the intersection of 2 arrays', () => {
            const leftBasic = [0, 3, 6, 2, 8];
            const rightBasic = [2, 7, 1, 3, 5, 6, 4];

            const leftKey = [{
                id: 1,
                name: 'Bill',
            }, {
                id: 2,
                name: 'Jane',
            }];

            const rightKey = [{
                id: 1,
                name: 'Rob',
            }, {
                id: 4,
                name: 'Sally',
            }];

            const intersectionBasic = arrayIntersection(leftBasic, rightBasic);
            const intersectionKey = arrayIntersection(leftKey, rightKey, 'id');
            const intersectionPred = arrayIntersection(leftKey, rightKey, (left, right) => left.id === right.id);

            expect(intersectionBasic).toHaveLength(3);
            expect(intersectionKey).toHaveLength(1);
            expect(intersectionPred).toHaveLength(1);
            expect(intersectionBasic).toEqual(expect.arrayContaining([2, 3, 6]));
            expect(intersectionKey).toEqual(expect.arrayContaining([leftKey[0]]));
            expect(intersectionPred).toEqual(expect.arrayContaining([leftKey[0]]));
        });

        test('Should find the difference of 2 arrays', () => {
            const leftBasic = [0, 3, 6, 2, 8];
            const rightBasic = [2, 7, 1, 3, 5, 6, 4];

            const leftKey = [{
                id: 1,
                name: 'Bill',
            }, {
                id: 2,
                name: 'Jane',
            }];

            const rightKey = [{
                id: 1,
                name: 'Rob',
            }, {
                id: 4,
                name: 'Sally',
            }];

            const diffBasic = arrayDifference(leftBasic, rightBasic);
            const diffKey = arrayDifference(leftKey, rightKey, 'id');
            const diffPred = arrayDifference(leftKey, rightKey, (left, right) => left.id === right.id);

            expect(diffBasic).toHaveLength(2);
            expect(diffKey).toHaveLength(1);
            expect(diffPred).toHaveLength(1);
            expect(diffBasic).toEqual(expect.arrayContaining([0, 8]));
            expect(diffKey).toEqual(expect.arrayContaining([leftKey[1]]));
            expect(diffPred).toEqual(expect.arrayContaining([leftKey[1]]));
        });

    });

});