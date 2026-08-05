import type {
    ClassifiedExpression,
    ExpressionKind,
    PlotVariable,
} from '../types';

/** A left-hand side that names the plotted quantity, such as the `y` of `y = sin(x)`. */
interface AssignedForm {
    /** The kind the equation takes. */
    kind: ExpressionKind;
    /** The variables the body is swept over. */
    variables: PlotVariable[];
}

/** The position and width of the equals sign an equation splits on. */
interface EqualitySplit {
    /** The index of the first character of the operator. */
    index: number;
    /** The operator's width, `1` for `=` and `2` for `==`. */
    length: number;
}

const SYMBOL_PATTERN = /[A-Za-z_][A-Za-z_0-9]*/g;

const ASSIGNED_FORMS = new Map<string, AssignedForm>([
    ['y', {
        kind: 'explicit-y',
        variables: ['x'],
    }],
    ['x', {
        kind: 'explicit-x',
        variables: ['y'],
    }],
    ['r', {
        kind: 'polar',
        variables: ['theta'],
    }],
    ['z', {
        kind: 'surface',
        variables: ['x', 'y'],
    }],
]);

function invalid(error: string): ClassifiedExpression {
    return {
        kind: 'invalid',
        bodies: [],
        variables: [],
        error,
    };
}

function normalizeSource(source: string): string {
    return source.replace(/θ/g, 'theta').trim();
}

function readSymbols(source: string): Set<string> {
    const symbols = new Set<string>();

    for (const match of source.matchAll(SYMBOL_PATTERN)) {
        let next = match.index + match[0].length;

        while (source[next] === ' ') {
            next++;
        }

        if (source[next] !== '(') {
            symbols.add(match[0]);
        }
    }

    return symbols;
}

function findMatchingParen(source: string): number {
    let depth = 0;

    for (let i = 0; i < source.length; i++) {
        if (source[i] === '(') {
            depth++;
        }

        if (source[i] === ')' && --depth === 0) {
            return i;
        }
    }

    return -1;
}

function splitTopLevel(source: string, separator: string): string[] {
    const parts: string[] = [];

    let depth = 0;
    let start = 0;

    for (let i = 0; i < source.length; i++) {
        const char = source[i];

        if (char === '(' || char === '[') {
            depth++;
        }

        if (char === ')' || char === ']') {
            depth--;
        }

        if (char === separator && depth === 0) {
            parts.push(source.slice(start, i));
            start = i + 1;
        }
    }

    parts.push(source.slice(start));

    return parts;
}

function findTopLevelEquality(source: string): EqualitySplit | null {
    let depth = 0;

    for (let i = 0; i < source.length; i++) {
        const char = source[i];

        if (char === '(' || char === '[') {
            depth++;
            continue;
        }

        if (char === ')' || char === ']') {
            depth--;
            continue;
        }

        if (char !== '=' || depth > 0) {
            continue;
        }

        // `<=`, `>=`, `!=` and the tail of `==` are comparisons, not the equation's equals sign.
        if (i > 0 && '<>!='.includes(source[i - 1])) {
            continue;
        }

        return {
            index: i,
            length: source[i + 1] === '=' ? 2 : 1,
        };
    }

    return null;
}

function classifyParametric(source: string): ClassifiedExpression | null {
    if (!source.startsWith('(') || findMatchingParen(source) !== source.length - 1) {
        return null;
    }

    const components = splitTopLevel(source.slice(1, -1), ',');

    if (components.length === 1) {
        return null;
    }

    if (components.length !== 2 || components.some(component => !component.trim())) {
        return invalid('A parametric curve needs exactly two components, like (cos(t), sin(t)).');
    }

    return {
        kind: 'parametric',
        bodies: components.map(component => component.trim()),
        variables: ['t'],
    };
}

function classifyBare(source: string): ClassifiedExpression {
    const symbols = readSymbols(source);

    if (symbols.has('x') && symbols.has('y')) {
        return {
            kind: 'implicit',
            bodies: [source, '0'],
            variables: ['x', 'y'],
        };
    }

    if (symbols.has('theta') && !symbols.has('x')) {
        return {
            kind: 'polar',
            bodies: [source],
            variables: ['theta'],
        };
    }

    if (symbols.has('y')) {
        return {
            kind: 'explicit-x',
            bodies: [source],
            variables: ['y'],
        };
    }

    return {
        kind: 'explicit-y',
        bodies: [source],
        variables: ['x'],
    };
}

/**
 * Turns a raw input line into a {@link ClassifiedExpression}.
 *
 * Classification is textual and runs before any parse, because mathjs rejects `x^2 + y^2 = 4`
 * outright: its left-hand side is not a valid assignment target. The split is still structural
 * rather than a naive `split('=')`, so `x >= 2` and `x == 2` are read as the comparison and the
 * equation they are.
 *
 * Recognized forms are `y = f(x)`, `x = f(y)`, `r = f(theta)` (accepting `theta` or `θ`),
 * `z = f(x, y)`, `(f(t), g(t))`, an equation in both `x` and `y`, and a bare expression, which is
 * treated as an implied `y =` unless its free symbols say otherwise.
 *
 * @param source - The raw text the user typed.
 * @returns The classification, with {@link ClassifiedExpression.error} set when the form is not supported.
 * @example
 * ```typescript
 * classifyExpression('r = cos(3 theta)'); // { kind: 'polar', bodies: ['cos(3 theta)'], variables: ['theta'] }
 * ```
 */
export function classifyExpression(source: string): ClassifiedExpression {
    const normalized = normalizeSource(source);

    if (!normalized) {
        return invalid('Enter an equation to plot.');
    }

    const parametric = classifyParametric(normalized);

    if (parametric) {
        return parametric;
    }

    const equality = findTopLevelEquality(normalized);

    if (!equality) {
        return classifyBare(normalized);
    }

    const lhs = normalized.slice(0, equality.index).trim();
    const rhs = normalized.slice(equality.index + equality.length).trim();

    if (!lhs || !rhs) {
        return invalid('An equation needs an expression on both sides of the equals sign.');
    }

    const assigned = ASSIGNED_FORMS.get(lhs.toLowerCase());

    if (assigned) {
        return {
            kind: assigned.kind,
            bodies: [rhs],
            variables: [...assigned.variables],
        };
    }

    const symbols = new Set([...readSymbols(lhs), ...readSymbols(rhs)]);

    if (symbols.has('x') && symbols.has('y')) {
        return {
            kind: 'implicit',
            bodies: [lhs, rhs],
            variables: ['x', 'y'],
        };
    }

    return invalid('Unsupported equation. Use y =, x =, r =, z =, or an equation in x and y.');
}
