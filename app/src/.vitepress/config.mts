import fs from 'node:fs';

import path from 'node:path';

import {
    defineConfig,
} from 'vitepress';

import {
    tabsMarkdownPlugin,
} from 'vitepress-plugin-tabs';

import {
    charts,
} from './data/charts';

import {
    demos,
} from './data/demos';

import typedocSidebar from '../docs/api/typedoc-sidebar.json';

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../packages/core/package.json'), 'utf-8'));

// https://vitepress.dev/reference/site-config
export default defineConfig({
    outDir: '../dist',
    title: 'Ripl',
    description: 'One unified TypeScript API for drawing 2D graphics, charts, and data visualizations across Canvas, SVG, Terminal, and WebGPU — high-performance and zero-dependency.',
    ignoreDeadLinks: true,

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
            property: 'og:title',
            content: 'Ripl — one API for drawing in any context',
        }],
        ['meta', {
            property: 'og:description',
            content: 'A unified, high-performance TypeScript API for drawing and animating 2D graphics, charts, and data visualizations across Canvas, SVG, Terminal, and experimental WebGPU 3D. Write once, render in any context.',
        }],
        ['meta', {
            property: 'og:image',
            content: 'https://www.ripl.run/og-image.png',
        }],
        ['meta', {
            property: 'og:url',
            content: 'https://www.ripl.run/',
        }],
        ['meta', {
            name: 'twitter:card',
            content: 'summary_large_image',
        }],
        ['meta', {
            name: 'twitter:title',
            content: 'Ripl — one API for drawing in any context',
        }],
        ['meta', {
            name: 'twitter:description',
            content: 'A unified, high-performance TypeScript API for 2D graphics, charts, and data visualizations across Canvas, SVG, Terminal, and WebGPU.',
        }],
        ['meta', {
            name: 'twitter:image',
            content: 'https://www.ripl.run/og-image.png',
        }],
        ['link', {
            rel: 'canonical',
            href: 'https://www.ripl.run/',
        }],
    ],

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
                    path.resolve(__dirname, '../../../'),
                ],
            },
        },
        resolve: {
            alias: {
                '@ripl/utilities': path.resolve(__dirname, '../../../packages/utilities/src/index.ts'),
                '@ripl/core': path.resolve(__dirname, '../../../packages/core/src/index.ts'),
                '@ripl/dom': path.resolve(__dirname, '../../../packages/dom/src/index.ts'),
                '@ripl/canvas': path.resolve(__dirname, '../../../packages/canvas/src/index.ts'),
                '@ripl/svg': path.resolve(__dirname, '../../../packages/svg/src/index.ts'),
                '@ripl/web': path.resolve(__dirname, '../../../packages/web/src/index.ts'),
                '@ripl/charts': path.resolve(__dirname, '../../../packages/charts/src/index.ts'),
                '@ripl/devtools': path.resolve(__dirname, '../../../packages/devtools/src/index.ts'),
                '@ripl/3d': path.resolve(__dirname, '../../../packages/3d/src/index.ts'),
                '@ripl/webgpu': path.resolve(__dirname, '../../../packages/webgpu/src/index.ts'),
                '@ripl/terminal': path.resolve(__dirname, '../../../packages/terminal/src/index.ts'),
                '@ripl/node': path.resolve(__dirname, '../../../packages/node/src/index.ts'),
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
            noExternal: ['monaco-editor'],
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
                            text: 'Terminal (experimental)',
                            link: '/docs/core/contexts/terminal',
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
                            text: 'Transforms',
                            link: '/docs/core/essentials/transforms',
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
                    ],
                },
            ],

            '/charts': [
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
                {
                    text: 'Charts',
                    items: charts.map(({ text, link }) => ({
                        text,
                        link,
                    })),
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
