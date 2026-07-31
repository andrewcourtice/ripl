/**
 * Generates the events block on every chart docs page, and checks the hand-written examples against
 * the chart source.
 *
 * The examples are hand-written because a type does not imply a good value and a coherent
 * configuration needs values that agree across options. Four checks keep them honest: every option
 * named must exist, every option the chart has must be named somewhere on its page, every example
 * must compile against the library source, and every page must link to Shared Options.
 *
 * Each page marks the generated region with `<!-- events:start -->` / `<!-- events:end -->`;
 * everything outside the markers is hand-written and left alone.
 *
 *   node scripts/generate-chart-options.mjs           # rewrite the generated regions
 *   node scripts/generate-chart-options.mjs --check   # fail if a rewrite would change anything
 */

import {
    fileURLToPath,
} from 'node:url';

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(dirname, '..');
const repoRoot = path.resolve(websiteRoot, '../..');
const chartsEntry = path.join(repoRoot, 'packages/charts/src/index.ts');
const chartDocsDir = path.join(websiteRoot, 'src/charts');

/**
 * The generated regions on each page.
 *
 * Only the events block is generated. An event map maps onto a subscription example with no values to
 * invent, so it can be derived. The option examples cannot: a type does not imply a good value, and a
 * useful example needs values that agree across options — a series' `value` naming a field that is in
 * the mock data, its `yAxis` naming an axis that is in `axis.y`. Those are written by hand and kept
 * honest by {@link validateSnippets} instead, which checks both that every option named exists and
 * that every option the chart has is named.
 */
const REGIONS = ['events'];

/**
 * Members every `EventBus` carries. They are not part of a chart's own surface, so repeating them on
 * all 25 pages is noise; Shared Options covers them once.
 */
const BASE_EVENT_BUS_MEMBERS = new Set(['destroyed']);

/** Creates a program over the charts package so inherited members resolve. */
function createProgram() {
    const configPath = path.join(repoRoot, 'packages/charts/tsconfig.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));

    return ts.createProgram([chartsEntry], {
        ...parsed.options,
        noEmit: true,
    });
}

/**
 * The first paragraph of a symbol's JSDoc, collapsed onto one line. `{@link X}` is a TypeDoc
 * construct that means nothing inside a fenced code block, so it is reduced to the symbol name.
 */
function summaryOf(symbol, checker) {
    const parts = symbol.getDocumentationComment(checker);
    const text = ts.displayPartsToString(parts).trim();

    if (!text) {
        return '';
    }

    return text
        .split(/\n\s*\n/)[0]
        .replace(/\s*\n\s*/g, ' ')
        .replace(/\{@link\s+([^}|\s]+)(?:\s*\|\s*([^}]+))?\}/g, (_, target, label) => `\`${(label ?? target).trim()}\``)
        .replace(/`+([^`]+)`+/g, '`$1`')
        .trim();
}

/** The declared type of a property, as written in the source rather than as expanded by the checker. */
function typeTextOf(symbol) {
    const declaration = symbol.declarations?.[0];

    if (declaration && ts.isPropertySignature(declaration) && declaration.type) {
        return declaration.type.getText().replace(/\s*\n\s*/g, ' ');
    }

    return 'unknown';
}

/** The name of the interface a property is declared on, used to group inherited members. */
function ownerOf(symbol) {
    const parent = symbol.declarations?.[0]?.parent;

    return parent && ts.isInterfaceDeclaration(parent) ? parent.name.text : '';
}

function isOptional(symbol) {
    const declaration = symbol.declarations?.[0];

    return !!declaration && ts.isPropertySignature(declaration) && !!declaration.questionToken;
}

/** Every property of an exported interface, including inherited ones, grouped by declaring interface. */
function readInterface(checker, moduleExports, name) {
    const symbol = moduleExports.find(item => item.getName() === name);

    if (!symbol) {
        return null;
    }

    const declaration = symbol.declarations?.find(ts.isInterfaceDeclaration);

    if (!declaration) {
        return null;
    }

    const type = checker.getDeclaredTypeOfSymbol(symbol);
    const typeParameters = declaration.typeParameters
        ? `<${declaration.typeParameters.map(parameter => parameter.name.text).join(', ')}>`
        : '';

    const properties = checker.getPropertiesOfType(type)
        .filter(property => !BASE_EVENT_BUS_MEMBERS.has(property.getName()))
        .map(property => ({
            name: property.getName(),
            optional: isOptional(property),
            type: typeTextOf(property),
            summary: summaryOf(property, checker),
            owner: ownerOf(property),
        }));

    return {
        name,
        typeParameters,
        properties,
    };
}

/**
 * Renders a subscription example covering every event the chart emits. Event maps were previously
 * undocumented on all but one page, so the events a chart offered were invisible unless you read the
 * source.
 *
 * A handler receives an `Event` wrapper, not the payload — the payload is `event.data` (see
 * `Event` in `packages/core/src/core/event-bus.ts`). The examples destructure it, so the type
 * annotation cannot be mistaken for the handler's own argument type.
 */
function renderEventsBlock(shape) {
    if (!shape) {
        return [
            'This chart emits no events.',
        ].join('\n');
    }

    const events = shape.properties;
    const width = events.reduce((longest, event) => Math.max(longest, event.name.length), 0);

    const lines = events.flatMap(event => [
        ...(event.summary ? [`// ${event.summary}`] : []),
        `chart.on('${event.name}',${' '.repeat(width - event.name.length)} event => console.log(event.data)); // event.data: ${event.type}`,
    ]);

    return [
        '<!-- eslint-skip -->',
        '```ts',
        ...lines,
        '```',
    ].join('\n');
}


/**
 * Every fenced `ts`/`typescript` block in a markdown file, with the line it starts on.
 */
function codeBlocksOf(contents) {
    const blocks = [];
    const lines = contents.split('\n');

    let current = null;

    lines.forEach((line, index) => {
        if (current) {
            if (line.trim() === '```') {
                blocks.push(current);
                current = null;
                return;
            }

            current.code.push(line);
            return;
        }

        if (/^```(ts|typescript)\s*$/.test(line.trim())) {
            current = {
                line: index + 2,
                code: [],
            };
        }
    });

    return blocks.map(block => ({
        line: block.line,
        code: block.code.join('\n'),
    }));
}

/**
 * Every `<script setup lang="ts">` block in a markdown or `.vue` file, with the line it starts on.
 *
 * The live demo on each chart page — and every full-page demo under `src/demos` — lives in one of
 * these, not in a fenced snippet. A validator that only read fences therefore never saw the code the
 * site actually runs, which is how three renamed option keys went on being passed silently: an
 * unknown key is ignored, so each one just fell back to a default.
 */
function scriptBlocksOf(contents) {
    const blocks = [];
    const lines = contents.split('\n');

    let current = null;

    lines.forEach((line, index) => {
        if (current) {
            if (line.trim() === '</script>') {
                blocks.push(current);
                current = null;
                return;
            }

            current.code.push(line);
            return;
        }

        // Attribute order varies between markdown demos and `.vue` components, so match on presence, not order.
        if (/^<script(?=[^>]*\blang="ts")(?=[^>]*\bsetup\b)[^>]*>$/.test(line.trim())) {
            current = {
                line: index + 2,
                code: [],
            };
        }
    });

    return blocks.map(block => ({
        line: block.line,
        code: block.code.join('\n'),
    }));
}

/** Strips the wrappers that sit between a reference and the literal it stands for. */
function unwrapExpression(expression) {
    let node = expression;

    while (node && (ts.isParenthesizedExpression(node)
        || ts.isAsExpression(node)
        || ts.isSatisfiesExpression(node)
        || ts.isNonNullExpression(node))) {
        node = node.expression;
    }

    return node;
}

/**
 * The expression a function hands back: the body of an expression-bodied arrow, or the first
 * top-level `return`. Nested functions are not descended into, so a callback's own `return` cannot be
 * mistaken for the outer function's.
 */
function returnedExpression(fn) {
    if (!fn?.body) {
        return undefined;
    }

    if (!ts.isBlock(fn.body)) {
        return fn.body;
    }

    return fn.body.statements.find(ts.isReturnStatement)?.expression;
}

/** Marks a name that is declared more than once with different values, so it resolves to nothing. */
const AMBIGUOUS = Symbol('ambiguous');

/**
 * Indexes a script's local `const`/`let` initializers and function declarations by name, so a
 * reference can be followed back to the literal behind it.
 *
 * Scoping is deliberately flat — a demo script holds one chart, so a name is unambiguous in practice.
 * Where it is not, the name is recorded as {@link AMBIGUOUS} and resolves to nothing: a missed check
 * is acceptable, a check against the wrong interface is not.
 */
function scopeOf(source) {
    const variables = new Map();
    const functions = new Map();

    const record = (map, name, value) => {
        map.set(name, map.has(name) ? AMBIGUOUS : value);
    };

    const visit = node => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
            record(variables, node.name.text, node.initializer);
        }

        if (ts.isFunctionDeclaration(node) && node.name) {
            record(functions, node.name.text, returnedExpression(node));
        }

        ts.forEachChild(node, visit);
    };

    visit(source);

    return {
        variables,
        functions,
    };
}

/** Follows an identifier to its initializer, or a call of a local function to what it returns. */
function resolveReference(node, scope) {
    const lookup = (map, name) => {
        const value = map.get(name);

        return value === AMBIGUOUS ? undefined : value;
    };

    if (ts.isIdentifier(node)) {
        return lookup(scope.variables, node.text);
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        return lookup(scope.functions, node.expression.text);
    }

    return undefined;
}

/**
 * The object literals that make up an expression's value, following a local `const`, a call to a
 * local function, and object spreads.
 *
 * No demo hands a fresh literal straight to its factory — each builds one in a helper
 * (`const options = { … }`, `{ ...buildOptions() }`) and passes that. Following the reference is what
 * lets a name check reach them, and it is also why TypeScript cannot do this job: excess-property
 * checking needs a fresh literal contextually typed at the call site, and the freshness is gone by
 * the time the helper's result arrives.
 */
function collectLiterals(expression, scope, seen = new Set()) {
    const node = unwrapExpression(expression);

    if (!node || seen.has(node)) {
        return [];
    }

    seen.add(node);

    if (ts.isObjectLiteralExpression(node)) {
        const spreads = node.properties
            .filter(ts.isSpreadAssignment)
            .flatMap(spread => collectLiterals(spread.expression, scope, seen));

        return [node, ...spreads];
    }

    return collectLiterals(resolveReference(node, scope), scope, seen);
}

/**
 * The object literals describing the entries of an array-valued option (`series`), following the same
 * references as {@link collectLiterals} plus `items.map(item => ({ … }))` — the shape every demo uses
 * to build its series from a metadata list.
 */
function collectEntryLiterals(expression, scope, seen = new Set()) {
    const node = unwrapExpression(expression);

    if (!node || seen.has(node)) {
        return [];
    }

    seen.add(node);

    if (ts.isArrayLiteralExpression(node)) {
        return node.elements.flatMap(element => collectLiterals(element, scope, seen));
    }

    if (ts.isCallExpression(node)
        && ts.isPropertyAccessExpression(node.expression)
        && node.expression.name.text === 'map') {
        const callback = node.arguments.find(argument => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument));

        return collectLiterals(returnedExpression(callback), scope, seen);
    }

    return collectEntryLiterals(resolveReference(node, scope), scope, seen);
}

/**
 * Checks the code on a page: every option passed to a `createXChart(...)` call must
 * exist on that chart's options interface, and every property of a `series` entry must exist on its
 * series interface.
 *
 * This is the guard against the drift that made these pages untrustworthy — a documented option that
 * had never existed, and renamed options still documented under their old names. The generated blocks
 * cannot drift by construction; the hand-written Usage and Variants snippets can, so they are checked.
 *
 * `series` is checked explicitly because a stale key nested one level down is *silently* ignored at
 * runtime rather than erroring: renaming the series axis binding to `yAxis` left snippets passing the
 * old `axis`, every series quietly fell back to the primary axis, and the secondary axis rendered
 * with nothing bound to it.
 */
function validateBlocks(label, blocks, optionNamesByFactory, seriesNamesByFactory, declared) {
    const problems = [];

    // Records names the page used so the caller can also check every option the chart has is named somewhere.
    const record = name => declared?.add(name);

    blocks.forEach(block => {
        const source = ts.createSourceFile('block.ts', block.code, ts.ScriptTarget.Latest, true);
        const scope = scopeOf(source);

        const report = (property, name, owner) => {
            const { line } = source.getLineAndCharacterOfPosition(property.getStart(source));

            problems.push(`${label}:${block.line + line}: \`${name}\` is not ${owner}`);
        };

        const checkLiteral = (literal, known, owner) => {
            literal.properties.forEach(property => {
                if (!property.name || !ts.isIdentifier(property.name)) {
                    return;
                }

                if (known.has(property.name.text)) {
                    record(property.name.text);
                    return;
                }

                report(property, property.name.text, owner);
            });
        };

        const visit = node => {
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
                const factory = node.expression.text;
                const known = optionNamesByFactory.get(factory);
                // Options may be a literal, a local `const`, or a helper's return, so resolve every argument.
                const literals = known
                    ? node.arguments.flatMap(argument => collectLiterals(argument, scope))
                    : [];

                literals.forEach(literal => checkLiteral(literal, known, `an option of ${factory}`));

                const seriesNames = seriesNamesByFactory.get(factory);
                const series = literals
                    .flatMap(literal => literal.properties)
                    .find(property => ts.isPropertyAssignment(property)
                        && ts.isIdentifier(property.name)
                        && property.name.text === 'series');

                if (seriesNames && series) {
                    collectEntryLiterals(series.initializer, scope)
                        .forEach(entry => checkLiteral(entry, seriesNames, `a series option of ${factory}`));
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(source);
    });

    return problems;
}

/**
 * Validates both halves of a docs page: the hand-written fenced snippets, and the `<script setup>`
 * block holding the live demo.
 */
function validateSnippets(page, contents, optionNamesByFactory, seriesNamesByFactory, declared) {
    return validateBlocks(
        `${page}.md`,
        [...codeBlocksOf(contents), ...scriptBlocksOf(contents)],
        optionNamesByFactory,
        seriesNamesByFactory,
        declared
    );
}

/**
 * Checks that a page's examples reach every option the chart actually has.
 *
 * Only the chart's *own* options are required. The ones every chart shares (`BaseChartOptions`) and
 * every cartesian chart shares (`CartesianChartOptions`) are documented once on Shared Options, so
 * repeating them in 25 examples would be the noise this reference exists to remove — they are allowed
 * to appear, never required to.
 *
 * Coverage is per *page*, not per block. Some options cannot be shown together — a bar chart honours
 * multiple y-axes only when it is neither stacked nor horizontal — so the full-configuration example
 * shows one and a Variants example shows the other. Either satisfies the requirement.
 */
function validateCoverage(page, shapes, seriesNames, declared) {
    const own = (shapes[0]?.properties ?? [])
        .filter(property => property.owner === shapes[0].name)
        .map(property => property.name);

    const required = [...new Set([...own, ...(seriesNames ?? [])])];
    const missing = required.filter(name => !declared.has(name));

    return missing.map(name => `${page}.md: \`${name}\` never appears in an example on this page`);
}

/** Whether a page points the reader at the options every chart shares. */
function linksToSharedOptions(contents) {
    return contents.includes('/charts/shared-options');
}

/**
 * Diagnostics for names the examples never define. The mock data an example reads from is shown in
 * the page's own Data Format section rather than restated in every block, so `data` and friends are
 * deliberately free here — an unresolved name is the fixture, not a mistake.
 */
const UNRESOLVED_NAME_DIAGNOSTICS = new Set([
    2304,
    2552,
    18004,
]);

/** Where the synthesized example files pretend to live, so the relative import below resolves. */
const EXAMPLE_DIR = path.join(repoRoot, '.chart-examples');

/**
 * Type-checks every example on every page against the library source.
 *
 * {@link validateSnippets} checks that an option *exists* and {@link validateCoverage} that it is
 * *shown*, but neither looks at the value: `maxRadiusRatio: 0.9` on a scale that tops out at 0.5, or
 * a `lineType` misspelt as `'monotone'`, both read as fine. Compiling the examples closes that gap —
 * a value of the wrong shape, a misspelt enum member, or an `axis.y` entry missing its `id` fails
 * here rather than in the reader's browser.
 */
function validateExampleTypes(pages) {
    // Imported by relative path so no `paths` mapping is needed; each block is scoped so examples can't collide.
    const entry = path.relative(EXAMPLE_DIR, chartsEntry).replace(/\.ts$/, '');
    const sources = new Map();

    pages.forEach(({ page, contents }) => {
        const blocks = [...contents.matchAll(/```ts\n([\s\S]*?)```/g)]
            .map(match => match[1])
            .filter(block => /\bcreate[A-Za-z]+Chart\(/.test(block))
            .map(block => block
                .replace(/^import[\s\S]*?from\s+'[^']*';\n/gm, '')
                // An elided dataset would infer `TData` as `never` and fail every accessor.
                .replace(/\[\s*\/\* \.\.\. \*\/\s*\]/g, 'data')
                .replace(/\bcreate([A-Za-z]+)Chart\(/g, 'charts.create$1Chart('))
            .map(block => `{\n${block}\n}`);

        if (blocks.length > 0) {
            sources.set(path.join(EXAMPLE_DIR, `${page}.ts`), `import * as charts from '${entry}';\n\n${blocks.join('\n\n')}\n`);
        }
    });

    const configPath = path.join(repoRoot, 'packages/charts/tsconfig.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));

    const options = {
        ...parsed.options,
        noEmit: true,
        // The examples are fragments spliced into one file, not modules of their own.
        isolatedModules: false,
        verbatimModuleSyntax: false,
    };

    const host = ts.createCompilerHost(options, true);
    const readFile = host.readFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    const getSourceFile = host.getSourceFile.bind(host);

    host.readFile = file => sources.get(file) ?? readFile(file);
    host.fileExists = file => sources.has(file) || fileExists(file);
    host.getSourceFile = (file, version, onError) => (sources.has(file)
        ? ts.createSourceFile(file, sources.get(file), version, true)
        : getSourceFile(file, version, onError));

    const program = ts.createProgram([...sources.keys()], options, host);

    return ts.getPreEmitDiagnostics(program)
        .filter(diagnostic => diagnostic.file && sources.has(diagnostic.file.fileName))
        .filter(diagnostic => !UNRESOLVED_NAME_DIAGNOSTICS.has(diagnostic.code))
        .map(diagnostic => {
            const page = path.basename(diagnostic.file.fileName, '.ts');
            const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
            const text = diagnostic.file.text.split('\n')[line].trim();
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');

            return `${page}.md: \`${text}\` does not type-check — ${message}`;
        });
}

/**
 * Every `.vue` file under the demo and component roots. The full-page demos build their charts here
 * rather than on a docs page, so they need the same check — two of the three stale option keys this
 * validator was extended to catch were in these files, not in the markdown.
 */
function demoComponentFiles() {
    const roots = [
        path.join(websiteRoot, 'src/demos'),
        path.join(websiteRoot, 'src/.vitepress/components'),
    ];

    const files = [];

    const walk = dir => {
        if (!fs.existsSync(dir)) {
            return;
        }

        fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            const full = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(full);
                return;
            }

            if (entry.name.endsWith('.vue')) {
                files.push(full);
            }
        });
    };

    roots.forEach(walk);

    return files.sort();
}

/**
 * Cross-checks the page → factory mapping against the sidebar/landing data in
 * `.vitepress/data/charts.ts`, which drives the "Available Charts" table. Two independent lists of
 * factory names is exactly how the docs drifted before, so they are compared rather than trusted.
 */
function validateChartData(charts) {
    const file = path.join(websiteRoot, 'src/.vitepress/data/charts.ts');
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const declared = new Map();

    const visit = node => {
        if (ts.isObjectLiteralExpression(node)) {
            const read = name => {
                const property = node.properties.find(item => ts.isPropertyAssignment(item)
                    && ts.isIdentifier(item.name)
                    && item.name.text === name);

                return property && ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)
                    ? property.initializer.text
                    : undefined;
            };

            const link = read('link');
            const factory = read('factory');

            if (link && factory) {
                declared.set(link.replace('/charts/', ''), factory);
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(source);

    const problems = [];

    charts.forEach(chart => {
        const factory = declared.get(chart.page);

        if (!factory) {
            problems.push(`data/charts.ts has no entry for /charts/${chart.page}`);
            return;
        }

        if (factory !== chart.factory) {
            problems.push(`data/charts.ts lists ${factory} for /charts/${chart.page}, expected ${chart.factory}`);
        }
    });

    declared.forEach((_, page) => {
        if (!charts.some(chart => chart.page === page)) {
            problems.push(`data/charts.ts lists /charts/${page}, which has no generated options block`);
        }
    });

    return problems;
}

/** The interfaces documented for a chart page, in the order they appear in the block. */
function shapesFor(checker, moduleExports, chart) {
    return [
        readInterface(checker, moduleExports, chart.options),
        ...(chart.extras ?? []).map(name => readInterface(checker, moduleExports, name)),
        chart.events ? readInterface(checker, moduleExports, chart.events) : null,
    ];
}

/**
 * The chart pages and the interfaces each documents. Kept explicit rather than inferred so a page
 * that needs an extra interface (a series shape, a node/link datum) can say so.
 */
const CHARTS = [
    {
        page: 'arc-diagram',
        factory: 'createArcDiagramChart',
        options: 'ArcDiagramChartOptions',
        extras: ['ArcDiagramNode', 'ArcDiagramLink'],
        events: 'ArcDiagramChartEventMap',
    },
    {
        page: 'area',
        factory: 'createAreaChart',
        options: 'AreaChartOptions',
        extras: ['AreaChartSeriesOptions'],
        events: 'AreaChartEventMap',
    },
    {
        page: 'bar',
        factory: 'createBarChart',
        options: 'BarChartOptions',
        extras: ['BarChartSeriesOptions'],
        events: 'BarChartEventMap',
    },
    {
        page: 'box-plot',
        factory: 'createBoxPlotChart',
        options: 'BoxPlotChartOptions',
        events: 'BoxPlotChartEventMap',
    },
    {
        page: 'chord',
        factory: 'createChordChart',
        options: 'ChordChartOptions',
        events: 'ChordChartEventMap',
    },
    {
        page: 'force-directed',
        factory: 'createForceDirectedChart',
        options: 'ForceDirectedChartOptions',
        extras: ['ForceNetworkNode', 'ForceNetworkLink'],
        events: 'ForceDirectedChartEventMap',
    },
    {
        page: 'funnel',
        factory: 'createFunnelChart',
        options: 'FunnelChartOptions',
        events: 'FunnelChartEventMap',
    },
    {
        page: 'gantt',
        factory: 'createGanttChart',
        options: 'GanttChartOptions',
        events: 'GanttChartEventMap',
    },
    {
        page: 'gauge',
        factory: 'createGaugeChart',
        options: 'GaugeChartOptions',
        events: 'GaugeChartEventMap',
    },
    {
        page: 'heatmap',
        factory: 'createHeatmapChart',
        options: 'HeatmapChartOptions',
        events: 'HeatmapChartEventMap',
    },
    {
        page: 'histogram',
        factory: 'createHistogramChart',
        options: 'HistogramChartOptions',
        events: 'HistogramChartEventMap',
    },
    {
        page: 'line',
        factory: 'createLineChart',
        options: 'LineChartOptions',
        extras: ['LineChartSeriesOptions'],
        events: 'LineChartEventMap',
    },
    {
        page: 'packed-circle',
        factory: 'createPackedCircleChart',
        options: 'PackedCircleChartOptions',
        events: 'PackedCircleChartEventMap',
    },
    {
        page: 'pie',
        factory: 'createPieChart',
        options: 'PieChartOptions',
        events: 'PieChartEventMap',
    },
    {
        page: 'polar-area',
        factory: 'createPolarAreaChart',
        options: 'PolarAreaChartOptions',
        events: 'PolarAreaChartEventMap',
    },
    {
        page: 'polar-scatter',
        factory: 'createPolarScatterChart',
        options: 'PolarScatterChartOptions',
        extras: ['PolarScatterSeriesOptions'],
        events: 'PolarScatterChartEventMap',
    },
    {
        page: 'radar',
        factory: 'createRadarChart',
        options: 'RadarChartOptions',
        extras: ['RadarChartSeriesOptions'],
        events: 'RadarChartEventMap',
    },
    {
        page: 'radial-bar',
        factory: 'createRadialBarChart',
        options: 'RadialBarChartOptions',
        events: 'RadialBarChartEventMap',
    },
    {
        page: 'realtime',
        factory: 'createRealtimeChart',
        options: 'RealtimeChartOptions',
        extras: ['RealtimeChartSeriesOptions'],
    },
    {
        page: 'sankey',
        factory: 'createSankeyChart',
        options: 'SankeyChartOptions',
        extras: ['SankeyNode', 'SankeyLink'],
        events: 'SankeyChartEventMap',
    },
    {
        page: 'scatter',
        factory: 'createScatterChart',
        options: 'ScatterChartOptions',
        extras: ['ScatterChartSeriesOptions'],
        events: 'ScatterChartEventMap',
    },
    {
        page: 'stock',
        factory: 'createStockChart',
        options: 'StockChartOptions',
        events: 'StockChartEventMap',
    },
    {
        page: 'sunburst',
        factory: 'createSunburstChart',
        options: 'SunburstChartOptions',
        extras: ['SunburstNode'],
        events: 'SunburstChartEventMap',
    },
    {
        page: 'treemap',
        factory: 'createTreemapChart',
        options: 'TreemapChartOptions',
        events: 'TreemapChartEventMap',
    },
    {
        page: 'trend',
        factory: 'createTrendChart',
        options: 'TrendChartOptions',
        extras: ['TrendChartLineSeriesOptions', 'TrendChartBarSeriesOptions', 'TrendChartAreaSeriesOptions'],
        events: 'TrendChartEventMap',
    },
];

function main() {
    const check = process.argv.includes('--check');
    const program = createProgram();
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(chartsEntry);

    if (!source) {
        throw new Error(`Could not load ${chartsEntry}`);
    }

    const moduleSymbol = checker.getSymbolAtLocation(source);
    const moduleExports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];

    const optionNamesByFactory = new Map();
    const seriesNamesByFactory = new Map();

    CHARTS.forEach(chart => {
        const shape = readInterface(checker, moduleExports, chart.options);

        if (shape) {
            optionNamesByFactory.set(chart.factory, new Set(shape.properties.map(property => property.name)));
        }

        // A chart may declare several series shapes (trend's line/bar/area union), so accept any of them.
        const seriesShapes = (chart.extras ?? [])
            .filter(name => name.includes('Series'))
            .map(name => readInterface(checker, moduleExports, name))
            .filter(Boolean);

        if (seriesShapes.length > 0) {
            seriesNamesByFactory.set(
                chart.factory,
                new Set(seriesShapes.flatMap(series => series.properties.map(property => property.name)))
            );
        }
    });

    const stale = [];
    const pages = [];
    const problems = validateChartData(CHARTS);
    let written = 0;

    CHARTS.forEach(chart => {
        const file = path.join(chartDocsDir, `${chart.page}.md`);

        if (!fs.existsSync(file)) {
            throw new Error(`Missing docs page: ${file}`);
        }

        const shapes = shapesFor(checker, moduleExports, chart);
        const missing = [chart.options, ...(chart.extras ?? []), chart.events]
            .filter(Boolean)
            .filter((name, index) => !shapes[index]);

        if (missing.length > 0) {
            throw new Error(`${chart.page}: could not resolve ${missing.join(', ')}`);
        }

        const rendered = {
            events: renderEventsBlock(shapes[shapes.length - 1] && chart.events ? shapes[shapes.length - 1] : null),
        };

        let next = fs.readFileSync(file, 'utf8');
        const contents = next;

        const declared = new Set();

        problems.push(...validateSnippets(chart.page, contents, optionNamesByFactory, seriesNamesByFactory, declared));
        problems.push(...validateCoverage(chart.page, shapes, seriesNamesByFactory.get(chart.factory), declared));

        if (!linksToSharedOptions(contents)) {
            problems.push(`${chart.page}.md: no link to /charts/shared-options`);
        }

        pages.push({
            page: chart.page,
            contents,
        });

        REGIONS.forEach(region => {
            const startMarker = `<!-- ${region}:start -->`;
            const endMarker = `<!-- ${region}:end -->`;
            const start = next.indexOf(startMarker);
            const end = next.indexOf(endMarker);

            if (start === -1 || end === -1) {
                throw new Error(`${chart.page}.md is missing the ${startMarker} / ${endMarker} markers`);
            }

            next = [
                next.slice(0, start + startMarker.length),
                rendered[region],
                next.slice(end),
            ].join('\n');
        });

        if (next === contents) {
            return;
        }

        if (check) {
            stale.push(chart.page);
            return;
        }

        fs.writeFileSync(file, next);
        written++;
    });

    problems.push(...validateExampleTypes(pages));

    const components = demoComponentFiles();

    components.forEach(file => {
        problems.push(...validateBlocks(
            path.relative(path.join(websiteRoot, 'src'), file),
            scriptBlocksOf(fs.readFileSync(file, 'utf8')),
            optionNamesByFactory,
            seriesNamesByFactory
        ));
    });

    if (problems.length > 0) {
        console.error('Chart docs disagree with the source:');
        problems.forEach(problem => console.error(`  - ${problem}`));
        process.exit(1);
    }

    if (check && stale.length > 0) {
        console.error('Chart option docs are out of date. Run `yarn generate-chart-options`:');
        stale.forEach(page => console.error(`  - src/charts/${page}.md`));
        process.exit(1);
    }

    console.log(check
        ? `Chart option docs are up to date (${CHARTS.length} pages checked).`
        : `Chart option docs generated (${written} of ${CHARTS.length} pages updated).`);
    console.log(`Validated documented options against the source for ${optionNamesByFactory.size} charts`
        + ` (series options for ${seriesNamesByFactory.size}).`);
    console.log(`Validated the snippets and live demo on ${CHARTS.length} pages, plus ${components.length}`
        + ' demo components.');
    console.log(`Type-checked every example on ${pages.length} pages against the library source.`);
    console.log('Cross-checked the chart factory list against .vitepress/data/charts.ts.');
}

main();
