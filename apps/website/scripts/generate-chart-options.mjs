/**
 * Generates the "All options" reference block on every chart docs page from the chart's TypeScript
 * options interface.
 *
 * The option lists used to be hand-written bullet points, one per page, which drifted from the code
 * (a documented option that never existed, a renamed option still documented under its old name) and
 * from each other (the same shared option described four different ways, or omitted entirely). Those
 * blocks are now derived from the source, so a rename or a new option shows up in the docs on the
 * next run and cannot silently disagree.
 *
 * Each page marks the generated region with `<!-- options:start -->` / `<!-- options:end -->`;
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
 * The generated regions on each page. `required` is the minimum call to render the chart; `options`
 * is the full reference. Both are derived from the same interface, so they cannot disagree.
 */
const REGIONS = ['required', 'options', 'events'];

/**
 * Members every `EventBus` carries. They are not part of a chart's own surface, so repeating them on
 * all 25 pages is noise; Shared Options covers them once.
 */
const BASE_EVENT_BUS_MEMBERS = new Set(['destroyed']);

/** Interfaces whose members are shared by many charts, listed under their own heading. */
const SHARED_SOURCES = {
    BaseChartOptions: 'Shared by every chart',
    CartesianChartOptions: 'Shared by every cartesian chart',
};

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

/** Wraps a comment to fit the code block without trailing whitespace. */
function commentLines(summary, indent) {
    const width = 96 - indent.length;
    const words = summary.split(/\s+/);
    const lines = [];

    let current = '';

    words.forEach(word => {
        const candidate = current ? `${current} ${word}` : word;

        if (candidate.length > width && current) {
            lines.push(current);
            current = word;
            return;
        }

        current = candidate;
    });

    if (current) {
        lines.push(current);
    }

    if (lines.length === 1) {
        return [`${indent}/** ${lines[0]} */`];
    }

    return [
        `${indent}/**`,
        ...lines.map(line => `${indent} * ${line}`),
        `${indent} */`,
    ];
}

/** Renders one property as a documented interface member. */
function renderProperty(property, indent) {
    const lines = property.summary ? commentLines(property.summary, indent) : [];

    lines.push(`${indent}${property.name}${property.optional ? '?' : ''}: ${property.type};`);

    return lines;
}

/** Renders an interface listing, with inherited members grouped under their source. */
function renderInterface(shape, { heading } = {}) {
    const indent = '    ';
    const own = shape.properties.filter(property => property.owner === shape.name);
    const inherited = Object.keys(SHARED_SOURCES)
        .map(source => ({
            source,
            properties: shape.properties.filter(property => property.owner === source),
        }))
        .filter(group => group.properties.length > 0);
    const other = shape.properties.filter(property => property.owner !== shape.name
        && !Object.keys(SHARED_SOURCES).includes(property.owner));

    const lines = [`interface ${shape.name}${shape.typeParameters} {`];

    const section = (title, properties) => {
        if (properties.length === 0) {
            return;
        }

        if (lines.length > 1) {
            lines.push('');
        }

        if (title) {
            lines.push(`${indent}// ${title}`);
        }

        properties.forEach((property, index) => {
            if (index > 0) {
                lines.push('');
            }

            lines.push(...renderProperty(property, indent));
        });
    };

    // Only label the chart's own members when there are inherited ones to distinguish them from.
    // A standalone datum or event interface has nothing to contrast with, so a heading is just noise.
    const hasInherited = other.length > 0 || inherited.length > 0;

    section(hasInherited ? (heading ?? 'Chart-specific') : '', own);
    other.forEach(property => section(property.owner ? `Inherited from ${property.owner}` : 'Inherited', [property]));
    inherited.forEach(group => section(`${SHARED_SOURCES[group.source]} (${group.source})`, group.properties));

    lines.push('}');

    return lines.join('\n');
}

/** Renders the full options reference for one chart: its options, series options and event map. */
function renderOptionsBlock(shapes) {
    const blocks = shapes.filter(Boolean).map(shape => renderInterface(shape));

    return [
        '<!-- eslint-skip -->',
        '```ts',
        blocks.join('\n\n'),
        '```',
    ].join('\n');
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
 * Renders the minimum call to render the chart: every required option, with its type as a trailing
 * comment. Shorthand properties keep it short enough to scan and to copy.
 */
function renderRequiredBlock(shape, factory) {
    const required = shape.properties.filter(property => !property.optional);
    const width = required.reduce((longest, property) => Math.max(longest, property.name.length), 0);

    const lines = required.length > 0
        ? required.map(property => `    ${property.name},${' '.repeat(width - property.name.length)} // ${property.type}`)
        : ['    // No required options.'];

    return [
        '<!-- eslint-skip -->',
        '```ts',
        `${factory}('#container', {`,
        ...lines,
        '});',
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
 * Checks the hand-written snippets on a page: every option passed to a `createXChart(...)` call must
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
function validateSnippets(page, contents, optionNamesByFactory, seriesNamesByFactory) {
    const problems = [];

    codeBlocksOf(contents).forEach(block => {
        const source = ts.createSourceFile(`${page}.ts`, block.code, ts.ScriptTarget.Latest, true);

        const report = (property, name, owner) => {
            const { line } = source.getLineAndCharacterOfPosition(property.getStart(source));

            problems.push(`${page}.md:${block.line + line}: \`${name}\` is not ${owner}`);
        };

        const checkLiteral = (literal, known, owner) => {
            literal.properties.forEach(property => {
                if (!property.name || !ts.isIdentifier(property.name) || known.has(property.name.text)) {
                    return;
                }

                report(property, property.name.text, owner);
            });
        };

        const visit = node => {
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
                const factory = node.expression.text;
                const known = optionNamesByFactory.get(factory);
                const literal = node.arguments.find(ts.isObjectLiteralExpression);

                if (known && literal) {
                    checkLiteral(literal, known, `an option of ${factory}`);

                    const seriesNames = seriesNamesByFactory.get(factory);
                    const series = literal.properties.find(property => ts.isPropertyAssignment(property)
                        && ts.isIdentifier(property.name)
                        && property.name.text === 'series');

                    if (seriesNames && series && ts.isPropertyAssignment(series) && ts.isArrayLiteralExpression(series.initializer)) {
                        series.initializer.elements
                            .filter(ts.isObjectLiteralExpression)
                            .forEach(entry => checkLiteral(entry, seriesNames, `a series option of ${factory}`));
                    }
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(source);
    });

    return problems;
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

        // A chart may declare several series shapes (trend's line/bar/area union), so accept a
        // property that exists on any of them.
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
            required: renderRequiredBlock(shapes[0], chart.factory),
            options: renderOptionsBlock(shapes),
            events: renderEventsBlock(shapes[shapes.length - 1] && chart.events ? shapes[shapes.length - 1] : null),
        };

        let next = fs.readFileSync(file, 'utf8');
        const contents = next;

        problems.push(...validateSnippets(chart.page, contents, optionNamesByFactory, seriesNamesByFactory));

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
    console.log('Cross-checked the chart factory list against .vitepress/data/charts.ts.');
}

main();
