import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    arrayDifference,
    arrayGroup,
    arrayIntersection,
    arrayJoin,
    arrayMapRange,
    objectForEach,
    objectMap,
    objectReduce,
} from '../src';

describe('Utilities', () => {

    describe('Array', () => {

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

        describe('arrayMapRange', () => {
            test('Should map over a range of indices', () => {
                const result = arrayMapRange(3, i => i * 2);
                expect(result).toEqual([0, 2, 4]);
            });

            test('Should handle zero length', () => {
                const result = arrayMapRange(0, i => i);
                expect(result).toEqual([]);
            });
        });

        describe('arrayJoin', () => {
            test('Should perform a full join with key predicate', () => {
                const left = [
                    {
                        id: 1,
                        name: 'A',
                    },
                    {
                        id: 2,
                        name: 'B',
                    },
                ];
                const right = [
                    {
                        id: 2,
                        name: 'C',
                    },
                    {
                        id: 3,
                        name: 'D',
                    },
                ];

                const result = arrayJoin(left, right, 'id');
                expect(result.left).toHaveLength(1);
                expect(result.inner).toHaveLength(1);
                expect(result.right).toHaveLength(1);
                expect(result.left[0].id).toBe(1);
                expect(result.inner[0][0].id).toBe(2);
                expect(result.inner[0][1].id).toBe(2);
                expect(result.right[0].id).toBe(3);
            });

            test('Should perform a full join with function predicate', () => {
                const left = [
                    {
                        id: 1,
                        name: 'A',
                    },
                    {
                        id: 2,
                        name: 'B',
                    },
                ];
                const right = [
                    {
                        id: 2,
                        name: 'C',
                    },
                    {
                        id: 3,
                        name: 'D',
                    },
                ];

                const result = arrayJoin(left, right, (l, r) => l.id === r.id);
                expect(result.left).toHaveLength(1);
                expect(result.inner).toHaveLength(1);
                expect(result.right).toHaveLength(1);
                expect(result.left[0].id).toBe(1);
                expect(result.inner[0][0].id).toBe(2);
                expect(result.right[0].id).toBe(3);
            });

            test('Should handle empty arrays', () => {
                const result = arrayJoin([], [1, 2], (l, r) => l === r);
                expect(result.left).toHaveLength(0);
                expect(result.inner).toHaveLength(0);
                expect(result.right).toHaveLength(2);
            });
        });

        describe('arrayGroup', () => {
            test('Should group by key', () => {
                const items = [
                    {
                        type: 'a',
                        value: 1,
                    },
                    {
                        type: 'b',
                        value: 2,
                    },
                    {
                        type: 'a',
                        value: 3,
                    },
                ];

                const groups = arrayGroup(items, 'type');
                expect(groups['a']).toHaveLength(2);
                expect(groups['b']).toHaveLength(1);
            });

            test('Should group by function', () => {
                const items = [1, 2, 3, 4, 5];
                const groups = arrayGroup(items, v => v % 2 === 0 ? 'even' : 'odd');
                expect(groups['even']).toEqual([2, 4]);
                expect(groups['odd']).toEqual([1, 3, 5]);
            });
        });

        describe('Object utilities', () => {
            test('objectForEach should iterate over object entries', () => {
                const obj = {
                    a: 1,
                    b: 2,
                    c: 3,
                };
                const keys: string[] = [];
                const values: number[] = [];

                objectForEach(obj, (key, value) => {
                    keys.push(key as string);
                    values.push(value as number);
                });

                expect(keys).toEqual(['a', 'b', 'c']);
                expect(values).toEqual([1, 2, 3]);
            });

            test('objectMap should map object values', () => {
                const obj = {
                    a: 1,
                    b: 2,
                };

                const result = objectMap(obj, (_, value) => (value as number) * 2);
                expect(result).toEqual({
                    a: 2,
                    b: 4,
                });
            });

            test('objectReduce should reduce object entries', () => {
                const obj = {
                    a: 1,
                    b: 2,
                    c: 3,
                };

                const sum = objectReduce(obj, (acc, _, value) => acc + (value as number), 0);
                expect(sum).toBe(6);
            });
        });

    });

});