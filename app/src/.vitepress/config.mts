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
    description: 'Ripl is a high performance canvas rendering library with a focus on providing a rich set of features in a simple and familiar API',
    ignoreDeadLinks: [
        /\/_media\//,
        /\.\.\/\.\.\/LICENSE/,
    ],

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
                '@ripl/dom': path.resolve(__dirname, '../../../packages/dom/src/index.ts'),
                '@ripl/canvas': path.resolve(__dirname, '../../../packages/canvas/src/index.ts'),
                '@ripl/svg': path.resolve(__dirname, '../../../packages/svg/src/index.ts'),
                '@ripl/web': path.resolve(__dirname, '../../../packages/web/src/index.ts'),
                '@ripl/charts': path.resolve(__dirname, '../../../packages/charts/src/index.ts'),
                '@ripl/3d': path.resolve(__dirname, '../../../packages/3d/src/index.ts'),
                '@ripl/webgpu': path.resolve(__dirname, '../../../packages/webgpu/src/index.ts'),
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

            '/docs/webgpu': [
                {
                    text: 'Getting Started',
                    items: [
                        {
                            text: 'Introduction',
                            link: '/docs/webgpu/',
                        },
                    ],
                },
                {
                    text: 'Essentials',
                    items: [
                        {
                            text: 'WebGPU Context',
                            link: '/docs/webgpu/essentials/context',
                        },
                        {
                            text: 'Migration Guide',
                            link: '/docs/webgpu/essentials/migration',
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
                    text: 'Getting Started',
                    link: '/docs/charts/getting-started',
                },
                {
                    text: 'Shared Options',
                    link: '/docs/charts/shared-options',
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
