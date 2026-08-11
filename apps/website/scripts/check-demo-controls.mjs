/**
 * Checks that every demo pane follows the control conventions: controls live in the pane's footer,
 * and each input carries a label.
 *
 * The convention is structural, not cosmetic. The pane's header is built by `example.vue` and is
 * reserved for the context switcher, Customize and Export — a demo that drops its own control in
 * there competes with those for the row and reads as a second toolbar, so `#header` is expected to
 * have no users at all. Labelling has one implementation now: `RiplField`. Two hand-rolled label
 * classes (`ripl-example__label`, `teapot-demo__label`) were referenced by demos whose CSS never
 * defined them, which is invisible in review and renders as an unstyled span, so both names are
 * banned outright and a bare slider or select in a footer is a control the reader cannot name.
 *
 * This is a documentation site, so the scan runs over markup only: fenced code blocks and HTML
 * comments are blanked out first (in place, so line numbers still point at the source), because a
 * page that *shows* `<template #header>` in a fence is documenting the slot rather than using one.
 * Templates name a component either way round, so `<ripl-field>` counts as `<RiplField>`.
 *
 * Scope is the demo pane: the `#footer` checks read the pane's footer slots, so the standalone demo
 * apps under `src/demos/`, which build their own toolbars, are covered only by the `#header` and
 * dead-class checks.
 *
 *   node scripts/check-demo-controls.mjs   # report violations and exit non-zero
 */

import {
    fileURLToPath,
} from 'node:url';

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(dirname, '..');
const sourceRoot = path.join(websiteRoot, 'src');

/** `public/` is copied verbatim and `docs/api/` is written by TypeDoc, so neither is ours to check. */
const EXCLUDED_DIRS = [
    path.join(sourceRoot, 'public'),
    path.join(sourceRoot, 'docs/api'),
];

/** Inputs that carry no label of their own, so each one must sit inside a `RiplField`. */
const LABELLED_CONTROLS = [
    'RiplInputRange',
    'RiplSelect',
    'RiplColorInput',
    'RiplInputNumber',
    'RiplInputText',
];

/**
 * Raw HTML controls a footer may not use, and the component that replaces each one. `color.md` shipped
 * a bare `<input type="color">`, which every check above reads as markup rather than as a control.
 */
const RAW_CONTROLS = {
    range: 'RiplInputRange',
    color: 'RiplColorInput',
    number: 'RiplInputNumber',
    text: 'RiplInputText',
};

/** Label classes deleted along with the move to `RiplField`; neither has any CSS behind it. */
const DEAD_LABEL_CLASSES = [
    'ripl-example__label',
    'teapot-demo__label',
];

/** Both spellings of a component's tag: templates use PascalCase and kebab-case interchangeably. */
function tagNames(name) {
    return [name, name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()];
}

/** Matches a slot name as one attribute among others, so `<template #footer v-if="ready">` counts. */
function slotAttribute(name) {
    return new RegExp(`(?:^|\\s)(?:#${name}|v-slot:${name})(?![\\w-])`);
}

const CONTROL_NAMES = new Map(['RiplField', ...LABELLED_CONTROLS]
    .flatMap(name => tagNames(name).map(tag => [tag, name])));

const HEADER_SLOT = slotAttribute('header');
const FOOTER_SLOT = slotAttribute('footer');
const DEAD_LABELS = new RegExp(`(?:${DEAD_LABEL_CLASSES.join('|')})(?![\\w-])`, 'g');
const TEMPLATE_TAGS = /<(\/?)template\b([^>]*?)(\/?)>/g;
const CONTROL_TAGS = new RegExp(`<(/?)(${[...CONTROL_NAMES.keys()].join('|')})(?![\\w-])([^>]*?)(/?)>`, 'g');
const RAW_TAGS = /<(input|select)(?![\w-])([^>]*?)\/?>/gi;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** Every markdown page and component of the site. */
function siteFiles() {
    const files = [];

    const walk = dir => {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            const full = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!EXCLUDED_DIRS.includes(full)) {
                    walk(full);
                }

                return;
            }

            if (/\.(md|vue)$/.test(entry.name)) {
                files.push(full);
            }
        });
    };

    walk(sourceRoot);

    return files.sort();
}

/** Replaces every character but the line breaks, so masking a region cannot move the ones after it. */
function blank(text) {
    return text.replace(/[^\n]/g, ' ');
}

/** The file with its fenced code blocks blanked out. */
function maskFences(contents) {
    let fence = null;

    return contents.split('\n').map(line => {
        const match = FENCE.exec(line);

        if (!fence) {
            fence = match?.[1] ?? null;

            return fence ? blank(line) : line;
        }

        if (match && match[1][0] === fence[0] && match[1].length >= fence.length && /^ {0,3}[`~]+\s*$/.test(line)) {
            fence = null;
        }

        return blank(line);
    }).join('\n');
}

/** The markup of a file: what is in a code fence is documentation, and what is commented out is gone. */
function markupOf(contents) {
    return maskFences(contents).replace(/<!--[\s\S]*?-->/g, match => blank(match));
}

/** The 1-based line an offset falls on. */
function lineAt(contents, index) {
    return contents.slice(0, index).split('\n').length;
}

/**
 * The body of every `<template #footer>` block, with the offset it starts at.
 *
 * Matched by pairing template tags rather than by a non-greedy `</template>`: a page carries one
 * block per demo (seven on the interpolators page) and a block may nest a `<template v-if>`, both of
 * which a non-greedy match closes in the wrong place.
 */
function footerBlocks(contents) {
    const tags = [...contents.matchAll(TEMPLATE_TAGS)];
    const blocks = [];

    tags.forEach((tag, index) => {
        if (tag[1] || !FOOTER_SLOT.test(tag[2])) {
            return;
        }

        const start = tag.index + tag[0].length;

        let depth = 0;
        let end = contents.length;

        for (let next = index + 1; next < tags.length; next++) {
            const candidate = tags[next];

            if (candidate[3]) {
                continue;
            }

            if (!candidate[1]) {
                depth++;
                continue;
            }

            if (depth > 0) {
                depth--;
                continue;
            }

            end = candidate.index;
            break;
        }

        blocks.push({
            start,
            body: contents.slice(start, end),
        });
    });

    return blocks;
}

/** The controls in a footer body that no `RiplField` encloses, with their offsets into the body. */
function unwrappedControls(body) {
    const found = [];

    let depth = 0;

    [...body.matchAll(CONTROL_TAGS)].forEach(tag => {
        const [, closing, tagName, , selfClosing] = tag;
        const name = CONTROL_NAMES.get(tagName);

        if (name === 'RiplField') {
            if (!selfClosing) {
                depth = Math.max(0, depth + (closing ? -1 : 1));
            }

            return;
        }

        if (!closing && depth === 0) {
            found.push({
                name,
                index: tag.index,
            });
        }
    });

    return found;
}

/**
 * The raw HTML controls in a footer body, whatever encloses them: a `RiplField` around an `<input>`
 * labels it but still leaves the demo styling and behaving unlike every other pane.
 *
 * A `:type` binding is left alone — the type is only known at runtime — as is any type with no shared
 * component behind it.
 */
function rawControls(body) {
    return [...body.matchAll(RAW_TAGS)].flatMap(tag => {
        const [, tagName, attributes] = tag;
        const type = attributes.match(/\btype\s*=\s*["']([^"']*)["']/)?.[1] ?? 'text';
        const dynamic = /(?::|v-bind:)type\s*=/.test(attributes);
        const select = tagName.toLowerCase() === 'select';
        const component = select ? 'RiplSelect' : !dynamic && RAW_CONTROLS[type];

        if (!component) {
            return [];
        }

        return [{
            component,
            tag: select ? '<select>' : `<input type="${type}">`,
            index: tag.index,
        }];
    });
}

/** Every convention violation in one file, in source order. */
function violationsOf(file, contents) {
    const markup = markupOf(contents);
    const problems = [];
    const report = (index, message) => problems.push({
        index,
        message,
    });

    [...markup.matchAll(TEMPLATE_TAGS)].forEach(tag => {
        if (!tag[1] && HEADER_SLOT.test(tag[2])) {
            report(tag.index, 'uses the reserved `#header` slot — demo controls belong in `#footer`');
        }
    });

    [...markup.matchAll(DEAD_LABELS)].forEach(match => {
        report(match.index, `\`${match[0]}\` no longer exists — wrap the control in \`<RiplField label="…">\``);
    });

    footerBlocks(markup).forEach(block => {
        unwrappedControls(block.body).forEach(control => {
            report(block.start + control.index, `\`${control.name}\` is not inside a \`RiplField\``);
        });

        rawControls(block.body).forEach(control => {
            report(block.start + control.index, `\`${control.tag}\` is a raw control — use the shared \`${control.component}\` component`);
        });
    });

    return problems
        .sort((left, right) => left.index - right.index)
        .map(problem => `${file}:${lineAt(markup, problem.index)}: ${problem.message}`);
}

function main() {
    const files = siteFiles();
    const problems = files.flatMap(file => violationsOf(
        path.relative(websiteRoot, file),
        fs.readFileSync(file, 'utf8')
    ));

    if (problems.length > 0) {
        console.error('Demo controls disagree with the convention:');
        problems.forEach(problem => console.error(`  - ${problem}`));
        console.error(`\n${problems.length} problem(s) across ${files.length} files.`);
        process.exit(1);
    }

    console.log('Every control in a demo pane `#footer` is a shared component inside a `RiplField`,'
        + ` the reserved \`#header\` slot has no users, and no retired label class remains: ${files.length}`
        + ' pages and components checked.');
}

main();
