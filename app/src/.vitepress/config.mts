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

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../packages/core/package.json'), 'utf-8'));

// https://vitepress.dev/reference/site-config
export default defineConfig({
    outDir: '../dist',
    title: 'Ripl',
    description: 'Ripl is a high performance canvas rendering library with a focus on providing a rich set of features in a simple and familiar API',

    vite: {
        envDir: '../',
        plugins: [],
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
                '@ripl/vdom': path.resolve(__dirname, '../../../packages/vdom/src/index.ts'),
                '@ripl/core': path.resolve(__dirname, '../../../packages/core/src/index.ts'),
                '@ripl/svg': path.resolve(__dirname, '../../../packages/svg/src/index.ts'),
                '@ripl/charts': path.resolve(__dirname, '../../../packages/charts/src/index.ts'),
                '@ripl/3d': path.resolve(__dirname, '../../../packages/3d/src/index.ts'),
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
                        text: 'Core',
                        link: '/docs/core/',
                    },
                    {
                        text: 'Charts',
                        link: '/docs/charts/',
                    },
                    {
                        text: '3D',
                        link: '/docs/3d/',
                    },
                ],
            },
            {
                text: 'API',
                link: '/docs/api/',
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
                            text: 'Animations',
                            link: '/docs/core/advanced/animations',
                        },
                        {
                            text: 'Custom Contexts',
                            link: '/docs/core/advanced/custom-contexts',
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
                            text: 'Context3D',
                            link: '/docs/3d/essentials/context',
                        },
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

            '/docs/charts': [
                {
                    text: 'Introduction',
                    link: '/docs/charts/',
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
                {
                    text: '@ripl/core',
                    collapsed: false,
                    items: [
                        {
                            text: 'Elements',
                            link: '/docs/api/core/elements',
                        },
                        {
                            text: 'Core',
                            link: '/docs/api/core/core',
                        },
                        {
                            text: 'Context',
                            link: '/docs/api/core/context',
                        },
                        {
                            text: 'Animation & Easing',
                            link: '/docs/api/core/animation',
                        },
                        {
                            text: 'Interpolators',
                            link: '/docs/api/core/interpolators',
                        },
                        {
                            text: 'Scales',
                            link: '/docs/api/core/scales',
                        },
                        {
                            text: 'Color',
                            link: '/docs/api/core/color',
                        },
                        {
                            text: 'Math & Geometry',
                            link: '/docs/api/core/math',
                        },
                        {
                            text: 'Gradients',
                            link: '/docs/api/core/gradient',
                        },
                        {
                            text: 'Task',
                            link: '/docs/api/core/task',
                        },
                    ],
                },
                {
                    text: '@ripl/charts',
                    collapsed: true,
                    items: [
                        {
                            text: 'Chart Base & Options',
                            link: '/docs/api/charts/core',
                        },
                        {
                            text: 'Charts',
                            link: '/docs/api/charts/charts',
                        },
                        {
                            text: 'Chart Elements',
                            link: '/docs/api/charts/elements',
                        },
                    ],
                },
                {
                    text: '@ripl/svg',
                    collapsed: true,
                    items: [
                        {
                            text: 'SVG Context',
                            link: '/docs/api/svg/context',
                        },
                    ],
                },
                {
                    text: '@ripl/3d',
                    collapsed: true,
                    items: [
                        {
                            text: 'Context3D',
                            link: '/docs/api/3d/context',
                        },
                        {
                            text: 'Camera',
                            link: '/docs/api/3d/camera',
                        },
                        {
                            text: 'Shapes',
                            link: '/docs/api/3d/shapes',
                        },
                        {
                            text: 'Shading',
                            link: '/docs/api/3d/shading',
                        },
                        {
                            text: 'Math',
                            link: '/docs/api/3d/math',
                        },
                        {
                            text: 'Interpolators',
                            link: '/docs/api/3d/interpolators',
                        },
                    ],
                },
                {
                    text: '@ripl/utilities',
                    collapsed: true,
                    items: [
                        {
                            text: 'Collections',
                            link: '/docs/api/utilities/collections',
                        },
                        {
                            text: 'Type Guards',
                            link: '/docs/api/utilities/type-guards',
                        },
                        {
                            text: 'DOM',
                            link: '/docs/api/utilities/dom',
                        },
                        {
                            text: 'Helpers',
                            link: '/docs/api/utilities/helpers',
                        },
                        {
                            text: 'Types',
                            link: '/docs/api/utilities/types',
                        },
                    ],
                },
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
