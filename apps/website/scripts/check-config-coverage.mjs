/**
 * Checks that every configurable option of every chart is reachable from that chart's demo config
 * panel, and that no control claims an option the chart does not have.
 *
 * The panel is the main way the docs let someone feel an option before reading about it, so an option
 * with no control is a gap in the documentation — and one that is invisible, because nothing fails.
 * Three renamed keys reached production the same way: an unknown option is silently ignored.
 *
 * Coverage is declared, not guessed. Each field in a panel names the option it drives
 * (`<RiplField option="borderRadius">`), and the shared sections in `ripl-chart-config.vue` name
 * theirs the same way, so the feature → option mapping is read out of the component rather than
 * duplicated here. Anything a chart declares that is neither covered nor excluded below fails.
 *
 *   node scripts/check-config-coverage.mjs            # report gaps and exit non-zero
 *   node scripts/check-config-coverage.mjs --summary  # also print per-chart coverage
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
const configComponent = path.join(websiteRoot, 'src/.vitepress/components/ripl-chart-config.vue');

/**
 * Options that describe *what* is plotted rather than *how*, grouped by why they are out of scope.
 * A control for one of these would mean editing the dataset from the drawer, which is a different
 * demo. Grouped rather than listed flat so the reason travels with the name.
 */
const EXCLUDED = {
    'the dataset itself': [
        'data',
        'series',
        'nodes',
        'links',
        'tasks',
        'children',
        'matrix',
        'key',
        'keyX',
        'keyY',
        'value',
        'label',
        'id',
        'categories',
        'xCategories',
        'yCategories',
        'groups',
        'categoryOrder',
    ],
    'a data accessor': [
        'colorBy',
        'sizeBy',
        'xBy',
        'yBy',
        'angleBy',
        'radiusBy',
        'open',
        'high',
        'low',
        'close',
        'volume',
        'start',
        'end',
        'source',
        'target',
        'depth',
        'parent',
        'progress',
    ],
    'a lifecycle flag, not a visual option': ['autoRender'],
    'an accessibility string with nothing to preview': ['description'],
};

/**
 * Per-chart options deliberately left out of that chart's panel, each with the reason. Prefer adding
 * a control over adding an entry here: the point of the check is that an omission is a decision on
 * the record rather than an oversight.
 */
const CHART_EXCLUSIONS = {
    'force-directed': {
        root: 'names a node in the dataset, so a control would be a node picker, not a visual option',
    },
    // Inherited from `CartesianChartOptions` but not wired into these charts' render pass, so a control is inert.
    'box-plot': {
        annotations: 'the chart does not call `renderAnnotations` yet',
        navigator: 'the chart does not reserve a navigator band yet',
        overview: 'the chart does not reserve a navigator band yet',
        legend: 'the chart does not call `reserveLegend` yet',
    },
    histogram: {
        thresholds: 'explicit bin edges, an alternative to `bins` — a control for both would contradict itself',
        annotations: 'the chart does not call `renderAnnotations` yet',
        navigator: 'the chart does not reserve a navigator band yet',
        overview: 'the chart does not reserve a navigator band yet',
        legend: 'the chart does not call `reserveLegend` yet',
    },
    stock: {
        legend: 'the chart does not call `reserveLegend` yet',
    },
    gauge: {
        tickFormat: 'the demo pins a `%` suffix so the tick labels carry the gauge\'s unit',
    },
    // Still on `Chart`, not `CartesianChart`, so these build axes once in the constructor instead of per render.
    gantt: {
        axis: 'read once at construction, so a live control would silently do nothing',
    },
    heatmap: {
        axis: 'read once at construction, so a live control would silently do nothing',
    },
    realtime: {
        axis: 'read once at construction, so a live control would silently do nothing',
        grid: 'read once at construction, so a live control would silently do nothing',
    },
    scatter: {
        overview: 'the scrub strip is category-axis only; scatter has a continuous x, so it draws none',
    },
    // The panel drives `padWidth`, which wins wherever it is set, so a `padAngle` control would be inert.
    'polar-area': {
        padAngle: 'deprecated in favour of `padWidth`, which the panel controls',
    },
    chord: {
        padAngle: 'deprecated in favour of `padWidth`, which the panel controls',
    },
};

/** Reads the `option="…"` attributes inside a chunk of template markup. */
function declaredOptions(markup) {
    return new Set([...markup.matchAll(/\boption="([^"]+)"/g)].map(match => match[1]));
}

/**
 * The options each shared config section covers, keyed by the feature flag that shows it. Read out of
 * `ripl-chart-config.vue` so the mapping has exactly one source of truth — a section that gains a
 * control covers its option here without this script being touched.
 *
 * The Colors section is keyed separately: it is shown by the `series` prop rather than a feature.
 */
function readSharedSections() {
    const contents = fs.readFileSync(configComponent, 'utf8');
    const byFeature = new Map();

    let colors = new Set();

    // Sections are siblings, so splitting on the opening tag gives one chunk per section.
    contents.split('<RiplConfigSection').slice(1).forEach(chunk => {
        const section = chunk.split('</RiplConfigSection>')[0];
        const feature = section.match(/shows\('([^']+)'\)/)?.[1];
        const options = declaredOptions(section);

        if (!feature) {
            // The Colors section (`v-if="series && series.length"`).
            colors = new Set([...colors, ...options]);
            return;
        }

        byFeature.set(feature, options);
    });

    if (byFeature.size === 0) {
        throw new Error(`Could not read any shared config sections from ${configComponent}`);
    }

    return {
        byFeature,
        colors,
    };
}

/** Every `<script setup lang="ts">` block in a markdown or `.vue` file. */
function scriptBlocksOf(contents) {
    return [...contents.matchAll(/<script(?=[^>]*\blang="ts")(?=[^>]*\bsetup\b)[^>]*>\n([\s\S]*?)\n<\/script>/g)]
        .map(match => match[1]);
}

/** The `<template #config>` block of a docs page, which holds its config panel. */
function configTemplateOf(contents) {
    return contents.match(/<template #config>([\s\S]*?)\n {4}<\/template>/)?.[1] ?? '';
}

/** The factory a demo script calls (`createLineChart`), or `undefined` for a page with no chart. */
function factoryOf(script) {
    return script.match(/\b(create[A-Z][A-Za-z]*Chart)\s*\(/)?.[1];
}

/** Whether a page passes `:series` to its panel, which renders the shared color pickers. */
function hasSeriesColors(template) {
    return /:series="/.test(template);
}

/**
 * The feature flags a demo turns on, read from the `features: { … }` literal in its `useChartConfig`
 * call. Only `true` entries count; a feature left out defaults to off (except `animation` and
 * `layout`, which default on — mirrored here).
 */
function enabledFeatures(script) {
    const literal = script.match(/features:\s*\{([\s\S]*?)\n {4}\}/)?.[1] ?? '';
    const features = new Set([...literal.matchAll(/(\w+):\s*true/g)].map(match => match[1]));

    if (!/\banimation:\s*false/.test(literal)) {
        features.add('animation');
    }

    if (!/\blayout:\s*false/.test(literal)) {
        features.add('layout');
    }

    return features;
}

/** Creates a program over the charts package so inherited options resolve. */
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
 * The option names a factory accepts, plus the option names of its series entries.
 *
 * Both are read from the factory's own signature rather than from a hand-maintained page → interface
 * table: the second parameter *is* the options type, and its `series` property's element type is the
 * series type. One less list to keep in step.
 */
function optionsOfFactory(checker, symbol) {
    const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration ?? symbol.declarations[0]);
    const signature = type.getCallSignatures()[0];

    if (!signature) {
        return null;
    }

    const parameter = signature.getParameters()[1];

    if (!parameter) {
        return null;
    }

    const optionsType = checker.getTypeOfSymbolAtLocation(parameter, parameter.declarations[0]);
    const options = checker.getPropertiesOfType(optionsType).map(property => property.getName());

    const seriesSymbol = optionsType.getProperty('series');
    const series = [];

    if (seriesSymbol?.declarations?.[0]) {
        const seriesType = checker.getTypeOfSymbolAtLocation(seriesSymbol, seriesSymbol.declarations[0]);
        const element = checker.getIndexTypeOfType(seriesType, ts.IndexKind.Number)
            ?? checker.getTypeArguments(seriesType)?.[0];

        if (element) {
            // A union of series shapes (trend's line/bar/area) contributes every member's options.
            const members = element.isUnion() ? element.types : [element];
            members.forEach(member => checker.getPropertiesOfType(member).forEach(p => series.push(p.getName())));
        }
    }

    return {
        options,
        series,
    };
}

function main() {
    const summary = process.argv.includes('--summary');
    const program = createProgram();
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(chartsEntry);

    if (!source) {
        throw new Error(`Could not load ${chartsEntry}`);
    }

    const moduleSymbol = checker.getSymbolAtLocation(source);
    const exports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];
    const factories = new Map(exports
        .filter(symbol => /^create[A-Z][A-Za-z]*Chart$/.test(symbol.getName()))
        .map(symbol => [symbol.getName(), symbol]));

    const shared = readSharedSections();
    const excludedBy = new Map();

    Object.entries(EXCLUDED).forEach(([reason, names]) => names.forEach(name => excludedBy.set(name, reason)));

    const problems = [];
    const rows = [];

    fs.readdirSync(chartDocsDir)
        .filter(file => file.endsWith('.md'))
        .sort()
        .forEach(file => {
            const page = file.replace(/\.md$/, '');
            const contents = fs.readFileSync(path.join(chartDocsDir, file), 'utf8');
            const script = scriptBlocksOf(contents)[0];

            if (!script) {
                return;
            }

            const factory = factoryOf(script);
            const shape = factory && factories.has(factory) && optionsOfFactory(checker, factories.get(factory));

            if (!shape) {
                return;
            }

            const template = configTemplateOf(contents);
            const features = enabledFeatures(script);
            const declared = declaredOptions(template);

            // Everything the panel reaches: enabled shared sections, color pickers, and the page's declarations.
            const covered = new Set(declared);

            features.forEach(feature => shared.byFeature.get(feature)?.forEach(option => covered.add(option)));

            if (hasSeriesColors(template)) {
                shared.colors.forEach(option => covered.add(option));
            }

            declared.forEach(option => {
                if (!shape.options.includes(option) && !shape.series.includes(option)) {
                    const line = contents.split('\n').findIndex(text => text.includes(`option="${option}"`)) + 1;

                    problems.push(`${file}:${line}: \`${option}\` is not an option of ${factory}`);
                }
            });

            const exclusions = CHART_EXCLUSIONS[page] ?? {};
            const required = [...new Set([...shape.options, ...shape.series])]
                .filter(option => !excludedBy.has(option) && !(option in exclusions));

            const missing = required.filter(option => !covered.has(option));

            missing.forEach(option => problems.push(`${file}: \`${option}\` has no control in the config panel`));

            rows.push({
                page,
                covered: required.length - missing.length,
                total: required.length,
            });
        });

    if (summary) {
        rows.forEach(row => console.log(`  ${row.page.padEnd(16)} ${row.covered}/${row.total}`));
    }

    if (problems.length > 0) {
        console.error('Chart config panels disagree with the source:');
        problems.forEach(problem => console.error(`  - ${problem}`));
        console.error(`\n${problems.length} problem(s) across ${rows.length} charts.`);
        process.exit(1);
    }

    const total = rows.reduce((sum, row) => sum + row.total, 0);

    console.log(`Every configurable option has a control: ${total} options across ${rows.length} charts.`);
}

main();
