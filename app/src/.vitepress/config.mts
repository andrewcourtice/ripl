import {
    defineConfig
} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    outDir: '../dist',
    title: "Ripl",
    description: "Ripl is a high performance canvas rendering library with a focus on providing a rich set of features in a simple and familiar API",
    themeConfig: {
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
                            link: '/docs/charts/pie',
                        },
                        {
                            text: 'Installation',
                            link: '/docs/charts/pie',
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
