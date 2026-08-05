import type {
    MathExpressionNode,
} from './engine';

/** A node carrying a callee, which is a symbol name on a `FunctionNode` and an operator name on an `OperatorNode`. */
type CallableNode = MathExpressionNode & {
    fn?: string | {
        name?: string;
    };
};

/**
 * The scalar functions an expression may call.
 *
 * An allowlist is the primary defence rather than an afterthought. The expression language has no
 * loops, so the only way to hang the page is allocation: `zeros(1e8)`, `ones(...)` and
 * `combinations(1e9, 5e8)` are all a single call away otherwise.
 */
export const ALLOWED_FUNCTIONS: ReadonlySet<string> = new Set([
    'abs',
    'acos',
    'acosh',
    'acot',
    'acoth',
    'acsc',
    'acsch',
    'add',
    'asec',
    'asech',
    'asin',
    'asinh',
    'atan',
    'atan2',
    'atanh',
    'cbrt',
    'ceil',
    'cos',
    'cosh',
    'cot',
    'coth',
    'csc',
    'csch',
    'cube',
    'divide',
    'erf',
    'exp',
    'expm1',
    'fix',
    'floor',
    'gamma',
    'gcd',
    'hypot',
    'lcm',
    'lgamma',
    'log',
    'log10',
    'log1p',
    'log2',
    'max',
    'min',
    'mod',
    'multiply',
    'norm',
    'nthRoot',
    'pow',
    'round',
    'sec',
    'sech',
    'sign',
    'sin',
    'sinh',
    'sqrt',
    'square',
    'subtract',
    'tan',
    'tanh',
    'unaryMinus',
    'unaryPlus',
]);

/**
 * The ceiling on an expression's AST size.
 *
 * Every node is re-evaluated at every sample, so a deeply nested expression multiplies the sampler's
 * evaluation budget by its own depth. Anything past this is pasted, not typed.
 */
export const MAX_NODE_COUNT = 512;

const COMPARISON_MESSAGE = 'Comparisons and logic operators are not supported.';

const REJECTED_NODE_TYPES = new Map<string, string>([
    ['AccessorNode', 'Property and index access is not supported.'],
    ['ArrayNode', 'Arrays are not supported.'],
    ['AssignmentNode', 'Assignments are not supported inside an expression.'],
    ['BlockNode', 'Only one expression per line is supported.'],
    ['FunctionAssignmentNode', 'Function definitions are not supported.'],
    ['IndexNode', 'Property and index access is not supported.'],
    ['ObjectNode', 'Objects are not supported.'],
    ['RangeNode', 'Ranges are not supported.'],
    ['RelationalNode', COMPARISON_MESSAGE],
]);

const REJECTED_OPERATORS = new Set([
    'and',
    'equal',
    'larger',
    'largerEq',
    'not',
    'or',
    'smaller',
    'smallerEq',
    'unequal',
    'xor',
]);

function readCalleeName(node: MathExpressionNode): string | undefined {
    const { fn } = node as CallableNode;

    if (typeof fn === 'string') {
        return fn;
    }

    return fn?.name;
}

function rejectNode(node: MathExpressionNode): string | undefined {
    const rejected = REJECTED_NODE_TYPES.get(node.type);

    if (rejected) {
        return rejected;
    }

    const callee = readCalleeName(node);

    if (node.type === 'OperatorNode' && callee && REJECTED_OPERATORS.has(callee)) {
        return COMPARISON_MESSAGE;
    }

    if (node.type === 'FunctionNode' && (!callee || !ALLOWED_FUNCTIONS.has(callee))) {
        return `${callee ?? 'That function'} is not available here.`;
    }

    return undefined;
}

/**
 * Walks a parsed expression and reports the first construct the calculator refuses to evaluate.
 *
 * @param node - The parsed expression.
 * @returns The rejection reason, or `undefined` when the whole tree is safe to compile.
 * @example
 * ```typescript
 * guardNode(engine.parse('1:1e9')); // 'Ranges are not supported.'
 * ```
 */
export function guardNode(node: MathExpressionNode): string | undefined {
    let reason: string | undefined;
    let count = 0;

    node.traverse(child => {
        count++;
        reason ??= rejectNode(child);
    });

    if (count > MAX_NODE_COUNT) {
        return 'The expression is too complex to plot.';
    }

    return reason;
}

/**
 * Checks the result of the probe evaluation that backs {@link guardNode}.
 *
 * The AST allowlist cannot see through a symbol that resolves to something other than a number, so
 * every compiled expression is evaluated once before it is accepted.
 *
 * @param value - The probe result.
 * @returns The rejection reason, or `undefined` when the expression produced a number.
 */
export function guardResult(value: unknown): string | undefined {
    if (typeof value === 'number') {
        return undefined;
    }

    return 'The expression does not evaluate to a number.';
}
