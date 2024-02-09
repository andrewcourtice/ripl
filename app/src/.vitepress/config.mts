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
            { text: 'Home', link: '/' },
            { text: 'Examples', link: '/markdown-examples' }
        ],

        sidebar: [
            {
                text: 'Examples',
                items: [
                    { text: 'Markdown Examples', link: '/markdown-examples' },
                    { text: 'Runtime API Examples', link: '/api-examples' }
                ]
            },
            {
                text: 'Charts',
                items: [
                    {
                        text: 'Pie',
                        link: '/charts/pie'
                    },
                    {
                        text: 'Trend',
                        link: '/charts/trend'
                    },
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/andrewcourtice/ripl' }
        ]
    }
})
