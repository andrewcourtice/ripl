import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    applyFields,
    collectChangedProps,
    normalizeClass,
    readBoundProps,
    resolveClassNames,
} from '@ripl/adapters';

import {
    createCircle,
} from '@ripl/web';

const KEYS = [
    'class',
    'cx',
    'cy',
];

describe('@ripl/adapters', () => {

    describe('Class names', () => {

        test('Should flatten every binding form to the same string', () => {
            expect(normalizeClass('  a b  ')).toBe('a b');
            expect(normalizeClass(['a', ['b', 'c']])).toBe('a b c');
            expect(normalizeClass({
                a: true,
                b: false,
                c: 1,
            })).toBe('a c');
        });

        test('Should leave an already normalised value untouched', () => {
            const once = normalizeClass({
                a: true,
                b: true,
            });

            expect(normalizeClass(once)).toBe(once);
        });

        test('Should split a binding into individual names', () => {
            expect(resolveClassNames(['a', {
                b: true,
            }])).toEqual(['a', 'b']);

            expect(resolveClassNames(undefined)).toEqual([]);
        });

    });

    describe('Bound props', () => {

        test('Should leave an unbound prop out so a Ripl default survives', () => {
            expect(readBoundProps({
                cx: 1,
                cy: undefined,
            }, KEYS)).toEqual({
                cx: 1,
            });
        });

        test('Should report nothing changed when the props are the same', () => {
            const applied = readBoundProps({
                cx: 1,
            }, KEYS);

            expect(collectChangedProps({
                cx: 1,
            }, KEYS, applied)).toBeUndefined();
        });

        // A class object literal is a fresh object every render, so an un-normalised comparison
        // would report it as changed on every single tick.
        test('Should compare a class binding by its normalised value', () => {
            const applied = readBoundProps({
                class: {
                    active: true,
                },
            }, KEYS);

            const changed = collectChangedProps({
                class: {
                    active: true,
                },
                cx: 2,
            }, KEYS, applied);

            expect(changed).toEqual({
                cx: 2,
            });
        });

    });

    describe('Class key', () => {

        // The prop carrying class names differs per framework — `class` in a template language,
        // `className` in JSX — so every read and write takes the key rather than assuming one.
        test('Should read and write class names through the key it is given', () => {
            const applied = readBoundProps({
                className: 'segment active',
                cx: 1,
            }, ['className', 'cx'], 'className');

            expect(applied).toEqual({
                className: 'segment active',
                cx: 1,
            });

            const element = createCircle({
                cx: 0,
                cy: 0,
                radius: 1,
            });

            applyFields(element, {
                className: 'segment active',
            }, undefined, 'className');

            expect(Array.from(element.classList)).toEqual([
                'segment',
                'active',
            ]);
        });

        test('Should treat the other framework class prop as a plain field', () => {
            const element = createCircle({
                cx: 0,
                cy: 0,
                radius: 1,
            });

            applyFields(element, {
                id: 'named',
            }, undefined, 'className');

            expect(element.id).toBe('named');
            expect(Array.from(element.classList)).toEqual([]);
        });

    });

});
