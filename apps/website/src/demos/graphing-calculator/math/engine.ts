import type {
    MathNode,
    OperatorNodeCtor,
} from 'mathjs/number';

/** A parsed mathjs expression tree, as produced by {@link MathEngine.parse}. */
export type MathExpressionNode = MathNode;

/**
 * The slice of the `mathjs/number` build the graphing calculator uses.
 *
 * The number-only entry is deliberate: it evaluates `sqrt(-1)` and `log(-1)` to `NaN` through the
 * raw `Math.*` functions, where the full build returns complex numbers that would silently plot as
 * garbage.
 */
export interface MathEngine {
    /**
     * The AST operator node constructor.
     *
     * An implicit equation's scalar field is built as `new OperatorNode('-', 'subtract', [lhs, rhs])`
     * rather than by string manipulation, because `parse('x^2+y^2 = 4')` throws outright.
     */
    readonly OperatorNode: OperatorNodeCtor;
    /**
     * Parses an expression into an AST.
     *
     * @param source - The expression text, without any `y =` style prefix.
     * @returns The parsed tree.
     * @throws When the source is not valid mathjs syntax.
     */
    parse(source: string): MathExpressionNode;
}

const NOT_LOADED_MESSAGE = 'The math engine has not been loaded yet; await loadMathEngine() first.';

let engine: MathEngine | null = null;
let loading: Promise<MathEngine> | null = null;

/**
 * Loads the number-only mathjs build, memoizing the module across calls.
 *
 * The import is dynamic on purpose. VitePress server-renders every page and `<ClientOnly>` stops the
 * render rather than the module evaluation, so a static import would drag the whole expression
 * parser into the SSR graph for a module the server never needs.
 *
 * @returns The engine, resolved once per page load.
 * @example
 * ```typescript
 * await loadMathEngine();
 *
 * const compiled = compileExpression(classifyExpression('y = a*sin(b*x)'));
 * ```
 */
export async function loadMathEngine(): Promise<MathEngine> {
    loading ??= import('mathjs/number').then(({ OperatorNode, parse }) => {
        engine = {
            OperatorNode,
            parse,
        };

        return engine;
    });

    return loading;
}

/**
 * Returns the already-loaded engine for the synchronous parts of the pipeline.
 *
 * @returns The engine.
 * @throws When {@link loadMathEngine} has not resolved yet.
 */
export function getMathEngine(): MathEngine {
    if (!engine) {
        throw new Error(NOT_LOADED_MESSAGE);
    }

    return engine;
}
