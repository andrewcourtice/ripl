import {
    getMathEngine,
} from './engine';

import {
    guardNode,
    guardResult,
} from './guard';

import {
    detectParameters,
} from './params';

import type {
    MathEngine,
    MathExpressionNode,
} from './engine';

import type {
    ClassifiedExpression,
    CompiledExpression,
    ExpressionKind,
} from '../types';

/** A parsed body compiled for repeated evaluation against a reused scope. */
interface CompiledCode {
    evaluate(scope: Map<string, number>): unknown;
}

const PROBE_VARIABLE_VALUE = 0.5;
const PROBE_PARAM_VALUE = 1;
const DEFAULT_PARAM_VALUE = 1;

const TWO_BODY_KINDS: ReadonlySet<ExpressionKind> = new Set<ExpressionKind>([
    'implicit',
    'parametric',
]);

function failed(error: string): CompiledExpression {
    return {
        kind: 'invalid',
        variables: [],
        params: [],
        evaluate: () => NaN,
        error,
    };
}

function describeError(error: unknown): string {
    return error instanceof Error ? error.message : 'The expression could not be read.';
}

function toEvaluator(code: CompiledCode): (scope: Map<string, number>) => number {
    return scope => {
        try {
            const value = code.evaluate(scope);

            return typeof value === 'number' ? value : NaN;
        } catch {
            return NaN;
        }
    };
}

function buildCodes(engine: MathEngine, kind: ExpressionKind, nodes: MathExpressionNode[]): CompiledCode[] {
    if (kind !== 'implicit') {
        return nodes.map(node => node.compile());
    }

    return [new engine.OperatorNode('-', 'subtract', [nodes[0], nodes[1]]).compile()];
}

function probeCodes(codes: CompiledCode[], scope: Map<string, number>): string | undefined {
    for (const code of codes) {
        try {
            const reason = guardResult(code.evaluate(scope));

            if (reason) {
                return reason;
            }
        } catch (error) {
            return describeError(error);
        }
    }

    return undefined;
}

/**
 * Builds the scope a compiled expression is evaluated against.
 *
 * Always a `Map`: mathjs returns a `Map` scope untouched but wraps a plain object in a fresh
 * `ObjectWrappingMap` on every single call, which measured 25 to 92 percent slower.
 *
 * @param expression - The compiled expression whose parameters need binding.
 * @param params - The current parameter values; any the expression needs but the map lacks default to `1`.
 * @returns A scope holding only the parameters, ready for the sampler to set plot variables on.
 */
export function createEvaluationScope(expression: CompiledExpression, params: Map<string, number>): Map<string, number> {
    const scope = new Map<string, number>();

    for (const name of expression.params) {
        scope.set(name, params.get(name) ?? DEFAULT_PARAM_VALUE);
    }

    return scope;
}

/**
 * Compiles a classified expression into the evaluable form the samplers consume.
 *
 * Every failure is returned as an {@link CompiledExpression.error} rather than thrown, so a
 * half-typed line renders as an inline message instead of tearing down the render loop. An implicit
 * equation's scalar field is built by AST subtraction, never by splitting the source on `=`.
 *
 * @param classified - The classified input line.
 * @returns The compiled expression, or an `invalid` one carrying the reason it was rejected.
 * @example
 * ```typescript
 * const compiled = compileExpression(classifyExpression('y = a*sin(b*x)'));
 * const scope = new Map([['a', 2], ['b', 3], ['x', 0]]);
 *
 * compiled.evaluate(scope);
 * ```
 */
export function compileExpression(classified: ClassifiedExpression): CompiledExpression {
    if (classified.kind === 'invalid') {
        return failed(classified.error ?? 'The expression could not be read.');
    }

    if (classified.bodies.length < (TWO_BODY_KINDS.has(classified.kind) ? 2 : 1)) {
        return failed('The expression is missing a body to evaluate.');
    }

    let engine: MathEngine;

    try {
        engine = getMathEngine();
    } catch (error) {
        return failed(describeError(error));
    }

    const nodes: MathExpressionNode[] = [];

    for (const body of classified.bodies) {
        try {
            nodes.push(engine.parse(body));
        } catch (error) {
            return failed(describeError(error));
        }
    }

    for (const node of nodes) {
        const reason = guardNode(node);

        if (reason) {
            return failed(reason);
        }
    }

    const params = detectParameters(nodes, classified.variables);
    const codes = buildCodes(engine, classified.kind, nodes);
    const scope = new Map<string, number>();

    for (const name of params) {
        scope.set(name, PROBE_PARAM_VALUE);
    }

    for (const variable of classified.variables) {
        scope.set(variable, PROBE_VARIABLE_VALUE);
    }

    const rejected = probeCodes(codes, scope);

    if (rejected) {
        return failed(rejected);
    }

    const compiled: CompiledExpression = {
        kind: classified.kind,
        variables: [...classified.variables],
        params,
        evaluate: toEvaluator(codes[0]),
    };

    if (codes.length > 1) {
        compiled.evaluateY = toEvaluator(codes[1]);
    }

    return compiled;
}
