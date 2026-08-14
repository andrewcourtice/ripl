import fs from 'node:fs';

import path from 'node:path';

import {
    defineConfig,
} from 'vitepress';

import type {
    HeadConfig,
} from 'vitepress';

import {
    tabsMarkdownPlugin,
} from 'vitepress-plugin-tabs';

import {
    chartCategories,
    charts,
} from './data/charts';

import {
    demos,
} from './data/demos';

import {
    apiPageDescription,
    canonicalUrl,
    HOSTNAME,
} from './seo';

import typedocSidebar from '../docs/api/typedoc-sidebar.json';

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../packages/core/package.json'), 'utf-8'));

const SOFTWARE_SOURCE_CODE = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    'name': 'Ripl',
    'description': 'A unified, zero-dependency TypeScript library for drawing and animating 2D graphics, charts and data visualisations across Canvas, SVG, Terminal and WebGPU 3D.',
    'url': `${HOSTNAME}/`,
    'codeRepository': 'https://github.com/andrewcourtice/ripl',
    'programmingLanguage': 'TypeScript',
    'runtimePlatform': 'Node.js',
    'license': 'https://opensource.org/licenses/MIT',
    'author': {
        '@type': 'Person',
        'name': 'Andrew Courtice',
    },
    'keywords': [
        'charting library',
        'chart library',
        'data visualization',
        'drawing library',
        'animation library',
        '2D graphics',
        'canvas',
        'SVG',
        'terminal rendering',
        'WebGPU',
        '3D rendering',
        'TypeScript',
    ],
};

const SECTION_HUBS = new Set([
    'charts/',
    'demos/',
    'docs/core/',
    'docs/3d/',
    'docs/vue/',
    'playground',
]);

/** Ranks the hand-written pages above the generated API reference, which is reference rather than entry material. */
function sitemapPriority(url: string): number {
    if (!url) {
        return 1;
    }

    if (url.startsWith('docs/api/')) {
        return 0.3;
    }

    return SECTION_HUBS.has(url) ? 0.9 : 0.8;
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
    outDir: '../dist',
    title: 'Ripl',
    description: 'One unified, high-performance, zero-dependency TypeScript API for drawing 2D graphics, charts, and data visualizations across Canvas, SVG, Terminal, and WebGPU.',

    // TypeDoc links each package's bundled LICENSE and README, which are not published pages; every
    // other dead link is a build error, so a broken internal link cannot reach production again.
    ignoreDeadLinks: [
        /(^|\/)_media\//,
        /(^|\/)LICENSE$/,
    ],

    cleanUrls: true,

    sitemap: {
        hostname: `${HOSTNAME}/`,
        transformItems: items => items.map(item => ({
            ...item,
            priority: sitemapPriority(item.url),
        })),
    },

    head: [
        ['link', {
            rel: 'icon',
            type: 'image/svg+xml',
            href: '/favicon.svg',
        }],
        ['link', {
            rel: 'icon',
            type: 'image/png',
            sizes: '32x32',
            href: '/favicon-32x32.png',
        }],
        ['link', {
            rel: 'icon',
            type: 'image/png',
            sizes: '16x16',
            href: '/favicon-16x16.png',
        }],
        ['link', {
            rel: 'apple-touch-icon',
            sizes: '180x180',
            href: '/apple-touch-icon.png',
        }],
        ['meta', {
            name: 'keywords',
            content: 'ripl, canvas library, svg rendering, data visualization, charting library, javascript charts, typescript graphics, 2d graphics, terminal graphics, webgpu, 3d rendering, animation library, unified rendering api, zero dependency, interactive charts',
        }],
        ['meta', {
            property: 'og:type',
            content: 'website',
        }],
        ['meta', {
            property: 'og:site_name',
            content: 'Ripl',
        }],
        ['meta', {
            property: 'og:image',
            content: `${HOSTNAME}/og-image.png`,
        }],
        ['meta', {
            name: 'twitter:card',
            content: 'summary_large_image',
        }],
        ['meta', {
            name: 'twitter:image',
            content: `${HOSTNAME}/og-image.png`,
        }],
    ],

    transformPageData(pageData) {
        pageData.description ||= apiPageDescription(pageData.relativePath) ?? '';
    },

    // The canonical, og:title/url/description and twitter:* tags are per-page: a site-wide canonical
    // told Google every page was a duplicate of the home page, which de-indexed the whole site.
    transformHead({ pageData, title, description }) {
        const canonical = canonicalUrl(pageData.relativePath);

        const head: HeadConfig[] = [
            ['link', {
                rel: 'canonical',
                href: canonical,
            }],
            ['meta', {
                property: 'og:url',
                content: canonical,
            }],
            ['meta', {
                property: 'og:title',
                content: title,
            }],
            ['meta', {
                property: 'og:description',
                content: description,
            }],
            ['meta', {
                name: 'twitter:title',
                content: title,
            }],
            ['meta', {
                name: 'twitter:description',
                content: description,
            }],
        ];

        if (pageData.relativePath === 'index.md') {
            head.push(['script', {
                type: 'application/ld+json',
            }, JSON.stringify(SOFTWARE_SOURCE_CODE)]);
        }

        return head;
    },

    vite: {
        envDir: '../',
        plugins: [
            {
                name: 'fix-typedoc-media-paths',
                enforce: 'pre',
                transform(code, id) {
                    if (id.endsWith('.md') && code.includes('"_media/')) {
                        return code.replace(/"_media\//g, '"./_media/');
                    }
                },
            },
        ],
        server: {
            fs: {
                allow: [
                    path.resolve(__dirname, '../../../../'),
                ],
            },
        },
        resolve: {
            alias: {
                '@ripl/utilities': path.resolve(__dirname, '../../../../packages/utilities/src/index.ts'),
                '@ripl/core': path.resolve(__dirname, '../../../../packages/core/src/index.ts'),
                '@ripl/dom': path.resolve(__dirname, '../../../../packages/dom/src/index.ts'),
                '@ripl/canvas': path.resolve(__dirname, '../../../../packages/canvas/src/index.ts'),
                '@ripl/svg': path.resolve(__dirname, '../../../../packages/svg/src/index.ts'),
                '@ripl/web': path.resolve(__dirname, '../../../../packages/web/src/index.ts'),
                '@ripl/charts': path.resolve(__dirname, '../../../../packages/charts/src/index.ts'),
                '@ripl/devtools': path.resolve(__dirname, '../../../../packages/devtools/src/index.ts'),
                '@ripl/3d': path.resolve(__dirname, '../../../../packages/3d/src/index.ts'),
                '@ripl/webgpu': path.resolve(__dirname, '../../../../packages/webgpu/src/index.ts'),
                '@ripl/terminal': path.resolve(__dirname, '../../../../packages/terminal/src/index.ts'),
                '@ripl/node': path.resolve(__dirname, '../../../../packages/node/src/index.ts'),
                '@ripl/vue': path.resolve(__dirname, '../../../../adapters/vue/src/index.ts'),
                '@ripl/vue-3d': path.resolve(__dirname, '../../../../adapters/vue-3d/src/index.ts'),
                '@ripl/vue-charts': path.resolve(__dirname, '../../../../adapters/vue-charts/src/index.ts'),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler',
                },
            },
        },
        ssr: {
            // `pinia` must be bundled rather than externalised: `createPinia()` reads the
            // `__VUE_PROD_DEVTOOLS__` compile-time flag as a bare global, which throws a
            // ReferenceError during SSR page rendering unless the bundler has substituted it.
            noExternal: ['monaco-editor', 'pinia'],
        },
    },

    markdown: {
        config(md) {
            md.use(tabsMarkdownPlugin);
        },
    },

    themeConfig: {

        logo: '/logo.svg',

        search: {
            provider: 'local',
        },

        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {
                text: `v${pkg.version}`,
                link: 'https://github.com/andrewcourtice/ripl/releases',
            },
            {
                text: 'Docs',
                items: [
                    {
                        items: [
                            {
                                text: 'Core (2D)',
                                link: '/docs/core/',
                            },
                            {
                                text: '3D',
                                link: '/docs/3d/',
                            },
                        ],
                    },
                    {
                        items: [
                            {
                                text: 'Vue',
                                link: '/docs/vue/',
                            },
                        ],
                    },
                    {
                        items: [
                            {
                                text: 'API Reference',
                                link: '/docs/api/',
                            },
                        ],
                    },
                ],
            },
            {
                text: 'Charts',
                link: '/charts/',
            },
            {
                text: 'Demos',
                link: '/demos/',
            },
            {
                text: 'Playground',
                link: '/playground',
            },
        ],

        sidebar: {
            '/docs/core': [
                {
                    text: 'Getting Started',
                    items: [
                        {
                            text: 'About',
                            link: '/docs/core/',
                        },
                        {
                            text: 'Installation',
                            link: '/docs/core/getting-started/installation',
                        },
                        {
                            text: 'Tutorial',
                            link: '/docs/core/getting-started/tutorial',
                        },
                    ],
                },
                {
                    text: 'Essentials',
                    items: [
                        {
                            text: 'Context',
                            link: '/docs/core/essentials/context',
                        },
                        {
                            text: 'Element',
                            link: '/docs/core/essentials/element',
                        },
                        {
                            text: 'Shape',
                            link: '/docs/core/essentials/shape',
                        },
                        {
                            text: 'Group',
                            link: '/docs/core/essentials/group',
                        },
                        {
                            text: 'Scene',
                            link: '/docs/core/essentials/scene',
                        },
                        {
                            text: 'Renderer',
                            link: '/docs/core/essentials/renderer',
                        },
                        {
                            text: 'Transforms',
                            link: '/docs/core/essentials/transforms',
                        },
                    ],
                },
                {
                    text: 'Contexts',
                    items: [
                        {
                            text: 'Canvas',
                            link: '/docs/core/contexts/canvas',
                        },
                        {
                            text: 'SVG',
                            link: '/docs/core/contexts/svg',
                        },
                        {
                            text: 'Terminal',
                            link: '/docs/core/contexts/terminal',
                        },
                        {
                            text: 'Node',
                            link: '/docs/core/contexts/node',
                        },
                    ],
                },
                {
                    text: 'Elements',
                    items: [
                        {
                            text: 'Arc',
                            link: '/docs/core/elements/arc',
                        },
                        {
                            text: 'Circle',
                            link: '/docs/core/elements/circle',
                        },
                        {
                            text: 'Ellipse',
                            link: '/docs/core/elements/ellipse',
                        },
                        {
                            text: 'Image',
                            link: '/docs/core/elements/image',
                        },
                        {
                            text: 'Line',
                            link: '/docs/core/elements/line',
                        },
                        {
                            text: 'Polygon',
                            link: '/docs/core/elements/polygon',
                        },
                        {
                            text: 'Path',
                            link: '/docs/core/elements/path',
                        },
                        {
                            text: 'Polyline',
                            link: '/docs/core/elements/polyline',
                        },
                        {
                            text: 'Rect',
                            link: '/docs/core/elements/rect',
                        },
                        {
                            text: 'Text',
                            link: '/docs/core/elements/text',
                        },
                    ],
                },
                {
                    text: 'Advanced',
                    items: [
                        {
                            text: 'Custom Elements',
                            link: '/docs/core/advanced/custom-elements',
                        },
                        {
                            text: 'Events',
                            link: '/docs/core/advanced/events',
                        },
                        {
                            text: 'Gradients',
                            link: '/docs/core/advanced/gradients',
                        },
                        {
                            text: 'Pattern Fills',
                            link: '/docs/core/advanced/pattern-fills',
                        },
                        {
                            text: 'Interpolators',
                            link: '/docs/core/advanced/interpolators',
                        },
                        {
                            text: 'Clip Paths',
                            link: '/docs/core/advanced/clip-paths',
                        },
                        {
                            text: 'Scales',
                            link: '/docs/core/advanced/scales',
                        },
                        {
                            text: 'Navigator',
                            link: '/docs/core/advanced/navigator',
                        },
                        {
                            text: 'Color',
                            link: '/docs/core/advanced/color',
                        },
                        {
                            text: 'Math & Geometry',
                            link: '/docs/core/advanced/math',
                        },
                        {
                            text: 'Animations',
                            link: '/docs/core/advanced/animations',
                        },
                        {
                            text: 'Custom Contexts',
                            link: '/docs/core/advanced/custom-contexts',
                        },
                        {
                            text: 'Devtools',
                            link: '/docs/core/advanced/devtools',
                        },
                    ],
                },
                {
                    text: 'Troubleshooting',
                    items: [
                        {
                            text: 'FAQ',
                            link: '/docs/core/troubleshooting/faq',
                        },
                        {
                            text: 'Performance',
                            link: '/docs/core/troubleshooting/performance',
                        },
                    ],
                },
            ],

            '/docs/vue': [
                {
                    text: 'Getting Started',
                    items: [
                        {
                            text: 'Introduction',
                            link: '/docs/vue/',
                        },
                    ],
                },
                {
                    text: 'Essentials',
                    items: [
                        {
                            text: 'Rendering',
                            link: '/docs/vue/essentials/rendering',
                        },
                        {
                            text: 'Elements',
                            link: '/docs/vue/essentials/elements',
                        },
                        {
                            text: 'Transitions',
                            link: '/docs/vue/essentials/transitions',
                        },
                        {
                            text: 'Events',
                            link: '/docs/vue/essentials/events',
                        },
                        {
                            text: 'Compositions',
                            link: '/docs/vue/essentials/compositions',
                        },
                    ],
                },
                {
                    text: 'Examples',
                    items: [
                        {
                            text: 'Bar chart',
                            link: '/docs/vue/examples/bar-chart',
                        },
                    ],
                },
            ],
            '/docs/3d': [
                {
                    text: 'Getting Started',
                    items: [
                        {
                            text: 'Introduction',
                            link: '/docs/3d/',
                        },
                    ],
                },
                {
                    text: 'Essentials',
                    items: [
                        {
                            text: 'Camera',
                            link: '/docs/3d/essentials/camera',
                        },
                        {
                            text: 'Shading',
                            link: '/docs/3d/essentials/shading',
                        },
                        {
                            text: 'Lighting',
                            link: '/docs/3d/essentials/lighting',
                        },
                        {
                            text: 'Materials',
                            link: '/docs/3d/essentials/materials',
                        },
                        {
                            text: 'Textures',
                            link: '/docs/3d/essentials/textures',
                        },
                        {
                            text: 'Raycasting',
                            link: '/docs/3d/essentials/raycasting',
                        },
                    ],
                },
                {
                    text: 'Contexts',
                    items: [
                        {
                            text: 'Canvas (Context3D)',
                            link: '/docs/3d/contexts/canvas',
                        },
                        {
                            text: 'WebGPU (WebGPUContext3D)',
                            link: '/docs/3d/contexts/webgpu',
                        },
                    ],
                },
                {
                    text: 'Shapes',
                    items: [
                        {
                            text: 'Cube',
                            link: '/docs/3d/shapes/cube',
                        },
                        {
                            text: 'Sphere',
                            link: '/docs/3d/shapes/sphere',
                        },
                        {
                            text: 'Cylinder',
                            link: '/docs/3d/shapes/cylinder',
                        },
                        {
                            text: 'Cone',
                            link: '/docs/3d/shapes/cone',
                        },
                        {
                            text: 'Plane',
                            link: '/docs/3d/shapes/plane',
                        },
                        {
                            text: 'Torus',
                            link: '/docs/3d/shapes/torus',
                        },
                        {
                            text: 'Mesh',
                            link: '/docs/3d/shapes/mesh',
                        },
                        {
                            text: 'Parametric',
                            link: '/docs/3d/shapes/parametric',
                        },
                        {
                            text: 'Bezier Surface',
                            link: '/docs/3d/shapes/bezier-surface',
                        },
                    ],
                },
            ],

            '/charts': [
                {
                    text: 'Getting Started',
                    items: [
                        {
                            text: 'Introduction',
                            link: '/charts/',
                        },
                        {
                            text: 'Getting Started',
                            link: '/charts/getting-started',
                        },
                        {
                            text: 'Shared Options',
                            link: '/charts/shared-options',
                        },
                    ],
                },
                {
                    text: 'Charts',
                    items: chartCategories.map(category => ({
                        text: category,
                        collapsed: false,
                        items: charts
                            .filter(chart => chart.category === category)
                            .map(({ text, link }) => ({
                                text,
                                link,
                            })),
                    })),
                },
                {
                    text: 'Advanced',
                    items: [
                        {
                            text: 'Annotations',
                            link: '/charts/advanced/annotations',
                        },
                        {
                            text: 'Color Legend',
                            link: '/charts/advanced/color-legend',
                        },
                        {
                            text: 'Panning & Zooming',
                            link: '/charts/advanced/panning-and-zooming',
                        },
                        {
                            text: 'Rendering Targets',
                            link: '/charts/advanced/rendering-targets',
                        },
                        {
                            text: 'Server-Side Rendering',
                            link: '/charts/advanced/server-side-rendering',
                        },
                        {
                            text: 'Custom Charts',
                            link: '/charts/advanced/custom-charts',
                        },
                        {
                            text: 'Theming',
                            link: '/charts/advanced/theming',
                        },
                    ],
                },
            ],

            '/docs/api/': [
                {
                    text: 'API Reference',
                    link: '/docs/api/',
                },
                ...typedocSidebar,
            ],

            '/demos/': [
                {
                    text: 'Demos',
                    items: demos.map(({ text, link }) => ({
                        text,
                        link,
                    })),
                },
            ],
        },

        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/andrewcourtice/ripl',
            },
        ],
    },
});
