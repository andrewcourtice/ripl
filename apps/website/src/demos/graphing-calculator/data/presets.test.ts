import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    PRESETS,
} from './presets';

import {
    parse,
} from 'mathjs/number';

import type {
    MathNode,
} from 'mathjs';

const PLOT_VARIABLES = new Set([
    'x',
    'y',
    'z',
    't',
    'theta',
]);

const CONSTANTS = new Set([
    'pi',
    'e',
    'tau',
    'phi',
]);

const EXPLICIT_BINDING = /^[xyzr]$/;

/** Splits a preset source into the expression bodies that have to compile on their own. */
function bodiesOf(source: string): string[] {
    const trimmed = source.trim();

    if (trimmed.startsWith('(') && trimmed.endsWith(')') && !trimmed.includes('=')) {
        return splitParametric(trimmed.slice(1, -1));
    }

    const equals = trimmed.indexOf('=');

    if (equals === -1) {
        return [trimmed];
    }

    const lhs = trimmed.slice(0, equals).trim();
    const rhs = trimmed.slice(equals + 1).trim();

    return EXPLICIT_BINDING.test(lhs)
        ? [rhs]
        : [
            lhs,
            rhs,
        ];
}

/** Splits `f(t), g(t)` at the comma that sits outside every bracket. */
function splitParametric(inner: string): string[] {
    let depth = 0;

    for (let index = 0; index < inner.length; index++) {
        const char = inner[index];

        if (char === '(') {
            depth++;
        } else if (char === ')') {
            depth--;
        } else if (char === ',' && depth === 0) {
            return [
                inner.slice(0, index),
                inner.slice(index + 1),
            ];
        }
    }

    return [inner];
}

/** Collects the symbols a preset expects the user to control with a slider. */
function freeSymbols(node: MathNode): Set<string> {
    const found = new Set<string>();

    node.traverse((child, path, parent) => {
        if (child.type !== 'SymbolNode') {
            return;
        }

        // A FunctionNode reports its own callee as a SymbolNode, which is not a free variable.
        if (parent?.type === 'FunctionNode' && path === 'fn') {
            return;
        }

        const name = (child as unknown as { name: string }).name;

        if (PLOT_VARIABLES.has(name) || CONSTANTS.has(name)) {
            return;
        }

        found.add(name);
    });

    return found;
}

describe('graphing calculator presets', () => {

    test('Should offer presets in both modes', () => {
        expect(PRESETS.some(preset => preset.mode === '2d')).toBe(true);
        expect(PRESETS.some(preset => preset.mode === '3d')).toBe(true);
    });

    test('Should give every preset a unique label', () => {
        const labels = PRESETS.map(preset => preset.label);

        expect(new Set(labels).size).toBe(labels.length);
    });

    test.each(PRESETS.map(preset => [preset.label, preset] as const))('Should compile and evaluate every body of %s', (_label, preset) => {
        for (const source of preset.expressions) {
            for (const body of bodiesOf(source)) {
                const node = parse(body);
                const scope = new Map<string, number>();

                for (const name of PLOT_VARIABLES) {
                    scope.set(name, 0.7);
                }

                for (const name of freeSymbols(node)) {
                    scope.set(name, preset.params?.[name] ?? 1.3);
                }

                expect(typeof node.compile().evaluate(scope)).toBe('number');
            }
        }
    });

    test.each(PRESETS.map(preset => [preset.label, preset] as const))('Should declare exactly the sliders %s uses', (_label, preset) => {
        const used = new Set<string>();

        for (const source of preset.expressions) {
            for (const body of bodiesOf(source)) {
                for (const name of freeSymbols(parse(body))) {
                    used.add(name);
                }
            }
        }

        expect([...used].sort()).toEqual(Object.keys(preset.params ?? {}).sort());
    });

    test.each(PRESETS.map(preset => [preset.label, preset] as const))('Should frame %s with a non-degenerate viewport', (_label, preset) => {
        if (!preset.viewport) {
            return;
        }

        expect(preset.viewport.xMax).toBeGreaterThan(preset.viewport.xMin);
        expect(preset.viewport.yMax).toBeGreaterThan(preset.viewport.yMin);
    });

});
