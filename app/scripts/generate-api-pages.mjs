import fs from 'node:fs';
import path from 'node:path';
import {
    fileURLToPath,
} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../src/.vitepress/data/api');
const outputDir = path.resolve(__dirname, '../src/docs/api');

// Grouped page definitions per package.
// Each page maps to one or more source groups from the extracted JSON.
const PAGE_CONFIG = {
    core: {
        label: '@ripl/core',
        pages: [
            {
                slug: 'elements',
                title: 'Elements',
                description: 'Built-in shape elements for 2D rendering.',
                groups: ['elements'],
            },
            {
                slug: 'core',
                title: 'Core',
                description: 'Element, Shape, Group, Scene, Renderer, and EventBus — the foundational classes.',
                groups: ['core'],
            },
            {
                slug: 'context',
                title: 'Context',
                description: 'Canvas rendering context and low-level drawing API.',
                groups: ['context'],
            },
            {
                slug: 'animation',
                title: 'Animation & Easing',
                description: 'Transition utilities and easing functions for smooth animations.',
                groups: ['animation'],
            },
            {
                slug: 'interpolators',
                title: 'Interpolators',
                description: 'Value interpolation factories for animating between states.',
                groups: ['interpolators'],
            },
            {
                slug: 'scales',
                title: 'Scales',
                description: 'Data-to-visual mapping functions: continuous, band, logarithmic, and more.',
                groups: ['scales'],
            },
            {
                slug: 'color',
                title: 'Color',
                description: 'Color parsing, serialization, and utility functions.',
                groups: ['color'],
            },
            {
                slug: 'math',
                title: 'Math & Geometry',
                description: 'Geometry utilities, trigonometry helpers, and bounding box structures.',
                groups: ['math'],
            },
            {
                slug: 'gradient',
                title: 'Gradients',
                description: 'CSS gradient string parsing and serialization.',
                groups: ['gradient'],
            },
            {
                slug: 'task',
                title: 'Task',
                description: 'Cancellable promise with AbortController integration.',
                groups: ['task'],
            },
        ],
    },
    charts: {
        label: '@ripl/charts',
        pages: [
            {
                slug: 'core',
                title: 'Chart Base & Options',
                description: 'Base Chart class, shared options, axis configuration, and chart infrastructure.',
                groups: ['core'],
            },
            {
                slug: 'charts',
                title: 'Charts',
                description: 'All chart types: Bar, Line, Area, Pie, Scatter, and more.',
                groups: ['charts'],
            },
            {
                slug: 'elements',
                title: 'Chart Elements',
                description: 'Specialized rendering elements for charts (Ribbon, SankeyLink).',
                groups: ['elements'],
            },
        ],
    },
    svg: {
        label: '@ripl/svg',
        pages: [
            {
                slug: 'context',
                title: 'SVG Context',
                description: 'SVG rendering context with virtual DOM reconciliation.',
                groups: ['index'],
            },
        ],
    },
    '3d': {
        label: '@ripl/3d',
        pages: [
            {
                slug: 'context',
                title: 'Context3D',
                description: '3D rendering context extending CanvasContext with projection.',
                groups: ['context'],
            },
            {
                slug: 'camera',
                title: 'Camera',
                description: 'Reactive camera system with orbit, pan, and zoom.',
                groups: ['camera'],
            },
            {
                slug: 'shapes',
                title: 'Shapes',
                description: 'Built-in 3D shapes: Cube, Sphere, Cylinder, Cone, Plane, Torus.',
                groups: ['elements', 'core/shape'],
            },
            {
                slug: 'shading',
                title: 'Shading',
                description: 'Flat shading utilities based on face normals and light direction.',
                groups: ['shading'],
            },
            {
                slug: 'math',
                title: 'Math',
                description: '3D math utilities: vectors, matrices, and projections.',
                groups: ['math'],
            },
            {
                slug: 'interpolators',
                title: 'Interpolators',
                description: 'Vector3 and 3D-specific interpolation.',
                groups: ['interpolators'],
            },
        ],
    },
    utilities: {
        label: '@ripl/utilities',
        pages: [
            {
                slug: 'collections',
                title: 'Collections',
                description: 'Array and Set helpers: join, group, intersect, difference, map range.',
                groups: ['collection'],
            },
            {
                slug: 'type-guards',
                title: 'Type Guards',
                description: 'Runtime type checking predicates.',
                groups: ['type', 'predicate'],
            },
            {
                slug: 'dom',
                title: 'DOM',
                description: 'DOM element creation and query utilities.',
                groups: ['dom'],
            },
            {
                slug: 'helpers',
                title: 'Function, String, Number & Object',
                description: 'Miscellaneous utility functions.',
                groups: ['function', 'string', 'number', 'object', 'value', 'comparitors'],
            },
            {
                slug: 'types',
                title: 'Types',
                description: 'Shared TypeScript type definitions.',
                groups: ['types'],
            },
        ],
    },
};

/**
 * Clean up import(...) paths in type strings for display.
 * e.g. import("/Users/.../core/src/index").CircleState → CircleState
 */
function cleanType(typeStr) {
    if (!typeStr) return '';
    return typeStr
        .replace(/import\("[^"]+"\)\./g, '')
        .replace(/import\('[^']+'\)\./g, '');
}

function escapeMarkdown(str) {
    if (!str) return '';
    return str.replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function symbolKindBadge(kind) {
    const badges = {
        class: '`class`',
        interface: '`interface`',
        type: '`type`',
        function: '`function`',
        variable: '`const`',
        enum: '`enum`',
    };
    return badges[kind] || `\`${kind}\``;
}

function renderParams(params) {
    if (!params || params.length === 0) return '';

    let md = '\n**Parameters:**\n\n';
    md += '| Name | Type | Description |\n';
    md += '| --- | --- | --- |\n';

    for (const p of params) {
        const name = p.optional ? `${p.name}?` : p.name;
        md += `| \`${escapeMarkdown(name)}\` | \`${escapeMarkdown(cleanType(p.type))}\` | ${escapeMarkdown(p.description)} |\n`;
    }

    return md;
}

function renderMembers(members) {
    if (!members || members.length === 0) return '';

    // Split into constructor, properties/getters, and methods
    const constructor = members.find(m => m.kind === 'constructor');
    const props = members.filter(m => m.kind === 'property' || m.kind === 'getter' || m.kind === 'setter');
    const methods = members.filter(m => m.kind === 'method');

    // Filter out protected/internal
    const publicProps = props.filter(m => !m.protected);
    const publicMethods = methods.filter(m => !m.protected);

    let md = '';

    if (constructor?.params?.length) {
        md += '\n**Constructor:**\n';
        md += renderParams(constructor.params);
    }

    if (publicProps.length > 0) {
        md += '\n**Properties:**\n\n';
        md += '| Property | Type | Description |\n';
        md += '| --- | --- | --- |\n';
        for (const p of publicProps) {
            const modifiers = [];
            if (p.static) modifiers.push('static');
            if (p.readonly) modifiers.push('readonly');
            const prefix = modifiers.length > 0 ? `${modifiers.join(' ')} ` : '';
            md += `| \`${escapeMarkdown(prefix + p.name)}\` | \`${escapeMarkdown(cleanType(p.type))}\` | ${escapeMarkdown(p.description)} |\n`;
        }
    }

    if (publicMethods.length > 0) {
        md += '\n**Methods:**\n\n';
        for (const m of publicMethods) {
            const paramStr = m.params
                ? m.params.map(p => `${p.name}${p.optional ? '?' : ''}: ${cleanType(p.type)}`).join(', ')
                : '';
            const returnStr = m.type ? `: ${cleanType(m.type)}` : '';
            md += `#### \`${m.name}(${escapeMarkdown(paramStr)})${escapeMarkdown(returnStr)}\`\n\n`;
            if (m.description) {
                md += `${m.description}\n\n`;
            }
            if (m.params?.length) {
                md += renderParams(m.params);
                md += '\n';
            }
        }
    }

    return md;
}

function renderInterfaceProperties(properties) {
    if (!properties || properties.length === 0) return '';

    let md = '\n**Properties:**\n\n';
    md += '| Property | Type | Description |\n';
    md += '| --- | --- | --- |\n';

    for (const p of properties) {
        const name = p.optional ? `${p.name}?` : p.name;
        md += `| \`${escapeMarkdown(name)}\` | \`${escapeMarkdown(cleanType(p.type))}\` | ${escapeMarkdown(p.description)} |\n`;
    }

    return md;
}

function renderSymbol(symbol) {
    let md = '';

    md += `### ${symbol.name} ${symbolKindBadge(symbol.kind)}\n\n`;

    if (symbol.description) {
        md += `${symbol.description}\n\n`;
    }

    // Type signature
    if (symbol.typeSignature) {
        const cleaned = cleanType(symbol.typeSignature);
        // For very long type signatures (interfaces, type aliases), use a code block
        if (cleaned.includes('\n') || cleaned.length > 120) {
            md += '```ts\n';
            md += `${cleaned}\n`;
            md += '```\n\n';
        } else {
            md += `\`\`\`ts\n${cleaned}\n\`\`\`\n\n`;
        }
    }

    // Function params
    if (symbol.kind === 'function') {
        if (symbol.params?.length) {
            md += renderParams(symbol.params);
            md += '\n';
        }
        if (symbol.returnType) {
            md += `**Returns:** \`${escapeMarkdown(cleanType(symbol.returnType))}\`\n\n`;
        }
    }

    // Class members
    if (symbol.kind === 'class') {
        md += renderMembers(symbol.members);
    }

    // Interface properties
    if (symbol.kind === 'interface') {
        md += renderInterfaceProperties(symbol.properties);
    }

    // Examples from JSDoc @example tags
    if (symbol.tags?.example) {
        for (const ex of symbol.tags.example) {
            md += '**Example:**\n\n';
            md += '```ts\n';
            md += `${ex}\n`;
            md += '```\n\n';
        }
    }

    md += '---\n\n';
    return md;
}

function generatePage(pkgKey, pkgConfig, pageConfig, data) {
    const symbols = [];
    for (const groupKey of pageConfig.groups) {
        if (data[groupKey]) {
            symbols.push(...data[groupKey]);
        }
    }

    if (symbols.length === 0) return null;

    // Sort: classes first, then interfaces, then types, then functions, then variables
    const kindOrder = {
        class: 0,
        interface: 1,
        type: 2,
        function: 3,
        variable: 4,
        enum: 5,
    };
    symbols.sort((a, b) => (kindOrder[a.kind] ?? 9) - (kindOrder[b.kind] ?? 9));

    let md = '---\n';
    md += 'outline: "deep"\n';
    md += '---\n\n';
    md += `# ${pageConfig.title}\n\n`;
    md += `<p class="api-package-badge"><code>${pkgConfig.label}</code></p>\n\n`;
    md += `${pageConfig.description}\n\n`;

    // Table of contents by kind
    const byKind = {};
    for (const sym of symbols) {
        const kind = sym.kind;
        if (!byKind[kind]) byKind[kind] = [];
        byKind[kind].push(sym);
    }

    md += '## Overview\n\n';

    const kindLabels = {
        class: 'Classes',
        interface: 'Interfaces',
        type: 'Type Aliases',
        function: 'Functions',
        variable: 'Constants',
        enum: 'Enums',
    };

    for (const [kind, items] of Object.entries(byKind)) {
        md += `**${kindLabels[kind] || kind}:** `;
        md += items.map(s => `[\`${s.name}\`](#${s.name.toLowerCase().replace(/[^a-z0-9]/g, '-')})`).join(' · ');
        md += '\n\n';
    }

    // Render each symbol
    for (const symbol of symbols) {
        md += renderSymbol(symbol);
    }

    return md;
}

// Clean output
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
}

fs.mkdirSync(outputDir, { recursive: true });

// Generate index page
let indexMd = '---\noutline: "deep"\n---\n\n';
indexMd += '# API Reference\n\n';
indexMd += 'Complete API documentation for all Ripl packages, auto-generated from TypeScript source.\n\n';

for (const [pkgKey, pkgConfig] of Object.entries(PAGE_CONFIG)) {
    const dataFile = path.resolve(dataDir, `${pkgKey}.json`);
    if (!fs.existsSync(dataFile)) {
        console.warn(`No data file for ${pkgKey}, skipping.`);
        continue;
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    const pkgDir = path.resolve(outputDir, pkgKey);
    fs.mkdirSync(pkgDir, { recursive: true });

    indexMd += `## ${pkgConfig.label}\n\n`;

    for (const pageConfig of pkgConfig.pages) {
        const md = generatePage(pkgKey, pkgConfig, pageConfig, data);
        if (!md) continue;

        const outputFile = path.resolve(pkgDir, `${pageConfig.slug}.md`);
        fs.writeFileSync(outputFile, md);

        const symbolCount = pageConfig.groups.reduce((sum, g) => sum + (data[g]?.length || 0), 0);
        indexMd += `- [**${pageConfig.title}**](/docs/api/${pkgKey}/${pageConfig.slug}) — ${pageConfig.description} *(${symbolCount} exports)*\n`;

        console.warn(`  ${pkgConfig.label}/${pageConfig.slug}: ${symbolCount} symbols`);
    }

    indexMd += '\n';
}

fs.writeFileSync(path.resolve(outputDir, 'index.md'), indexMd);
console.warn('API pages generated.');
