import {
    defineConfig
} from 'vitepress';

import {
    tabsMarkdownPlugin
} from 'vitepress-plugin-tabs';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    outDir: '../dist',
    title: "Ripl",
    description: "Ripl is a high performance canvas rendering library with a focus on providing a rich set of features in a simple and familiar API",

    markdown: {
        config(md) {
            md.use(tabsMarkdownPlugin);
        },
    },

    themeConfig: {

        search: {
            provider: 'local'
        },
        
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {
                text: 'Docs',
                items: [
                    {
                        text: 'Core',
                        link: '/docs/core/'
                    },
                    {
                        text: 'Charts',
                        link: '/docs/charts/'
                    }
                ]
            },
        ],

        sidebar: {
            '/docs/core': [
                {
                    text: 'Getting Started',
                    items: [
                        {
                            text: 'About',
                            link: '/docs/core/getting-started/about',
                        },
                        {
                            text: 'Installation',
                            link: '/docs/core/getting-started/installation',
                        },
                        {
                            text: 'Tutorial',
                            link: '/docs/core/getting-started/tutorial',
                        },
                    ]
                },
                {
                    text: 'Essentials',
                    items: [
                        {
                            text: 'Context',
                            link: '/docs/charts/pie',
                        },
                        {
                            text: 'Element',
                            link: '/docs/charts/trend'
                        },
                        {
                            text: 'Shape',
                            link: '/docs/charts/trend',
                        },
                        {
                            text: 'Group',
                            link: '/docs/charts/trend',
                        },
                        {
                            text: 'Scene',
                            link: '/docs/charts/trend'
                        },
                        {
                            text: 'Renderer',
                            link: '/docs/charts/trend'
                        },
                    ]
                },
                {
                    text: 'Contexts',
                    items: [
                        {
                            text: 'Canvas',
                            link: '/docs/charts/pie',
                        },
                        {
                            text: 'SVG',
                            link: '/docs/charts/trend'
                        },
                    ]
                },
                {
                    text: 'Elements',
                    items: [
                        {
                            text: 'Arc',
                            link: '/docs/charts/pie',
                        },
                        {
                            text: 'Circle',
                            link: '/docs/charts/trend'
                        },
                        {
                            text: 'Line',
                            link: '/docs/charts/trend'
                        },
                    ]
                },
            ],

            '/docs/charts': [
                {
                    text: 'Introduction',
                    link: '/charts'
                },
                {
                    text: 'Charts',
                    items: [
                        {
                            text: 'Pie',
                            link: '/docs/charts/pie'
                        },
                        {
                            text: 'Polar Area',
                            link: '/docs/charts/polar-area'
                        },
                        {
                            text: 'Scatter',
                            link: '/docs/charts/scatter'
                        },
                        {
                            text: 'Trend',
                            link: '/docs/charts/trend'
                        },
                    ]
                },
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/andrewcourtice/ripl' }
        ]
    }
})
