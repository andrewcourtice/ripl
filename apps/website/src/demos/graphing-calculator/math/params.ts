import type {
    MathExpressionNode,
} from './engine';

/** A node carrying a symbol name. */
type NamedNode = MathExpressionNode & {
    name?: string;
};

/**
 * The names the expression parser resolves on its own, which must never become sliders.
 *
 * The tempting test is `name in math`, and it is wrong: it would swallow a parameter innocently
 * named `size`, `map`, `mode` or `version`, all of which mathjs happily lets a scope shadow.
 */
export const MATH_CONSTANTS: ReadonlySet<string> = new Set([
    'E',
    'Infinity',
    'LN10',
    'LN2',
    'LOG10E',
    'LOG2E',
    'NaN',
    'PI',
    'SQRT1_2',
    'SQRT2',
    'e',
    'phi',
    'pi',
    'tau',
]);

/**
 * Collects the free symbols of one or more parsed expressions, which the UI surfaces as sliders.
 *
 * A `FunctionNode` emits its own callee as a `SymbolNode`, so `sin(x)` would otherwise report `sin`
 * as a parameter; those are excluded by their `fn` path rather than by name.
 *
 * @param nodes - The parsed bodies of a single expression, so a parametric curve shares one set.
 * @param variables - The plot variables the expression is swept over, which are never parameters.
 * @returns The parameter names, deduplicated and sorted.
 * @example
 * ```typescript
 * detectParameters([engine.parse('a*sin(b*x)')], ['x']); // ['a', 'b']
 * ```
 */
export function detectParameters(nodes: readonly MathExpressionNode[], variables: readonly string[]): string[] {
    const excluded = new Set(variables);
    const params = new Set<string>();

    for (const node of nodes) {
        node.traverse((child, path, parent) => {
            const { name } = child as NamedNode;

            if (child.type !== 'SymbolNode' || !name) {
                return;
            }

            if (path === 'fn' || parent?.type === 'AccessorNode') {
                return;
            }

            if (!MATH_CONSTANTS.has(name) && !excluded.has(name)) {
                params.add(name);
            }
        });
    }

    return [...params].sort();
}
