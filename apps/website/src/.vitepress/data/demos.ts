export interface DemoMeta {
    text: string;
    link: string;
    description: string;
}

export const demos: DemoMeta[] = [
    {
        text: 'Graphing Calculator',
        link: '/demos/graphing-calculator/',
        description: 'A Desmos-style graphing calculator: an editable equation list, auto-detected parameter sliders, adaptively re-sampled curves, marching-squares implicit plots, and orbitable 3D surfaces from @ripl/3d.',
    },
    {
        text: 'Freeform Drawing',
        link: '/demos/freeform-drawing/',
        description: 'An Excalidraw-style drawing canvas with pencil, pen, highlighter, shape, connector and text tools, plus pan/zoom via the Ripl navigator, selection, undo/redo and PNG/SVG export.',
    },
    {
        text: 'Trading Dashboard',
        link: '/demos/trading-dashboard/',
        description: 'A live stock trading dashboard with market indices, commodities, symbol search, candlestick charts and historical performance, drawn from Alpha Vantage data.',
    },
    {
        text: 'Product Analytics',
        link: '/demos/product-analytics/',
        description: 'A product analytics dashboard on mock data: line, bar, pie, heatmap, sankey, funnel, gauge and scatter charts, all driven by one period selector.',
    },
    {
        text: 'Mermaid Diagrams',
        link: '/demos/mermaid-diagram/',
        description: 'A live Mermaid flowchart renderer that parses Mermaid syntax and draws diagrams from Ripl core elements, with animated transitions and hover interactions.',
    },
    {
        text: 'Jet Engine 3D (Canvas)',
        link: '/demos/jet-engine/',
        description: 'An interactive 3D exploded view of a jet engine drawn with @ripl/3d: flat-shaded faces with edge outlines, orbit controls, and hover highlighting.',
    },
    {
        text: 'Jet Engine 3D (WebGPU)',
        link: '/demos/jet-engine-webgpu/',
        description: 'The jet engine exploded view re-implemented with @ripl/webgpu: GPU rendering with hardware depth testing, WGSL shaders, and 4× MSAA.',
    },
    {
        text: 'Piston Mechanism 3D',
        link: '/demos/piston-mechanism/',
        description: 'An animated single-cylinder slider-crank built with @ripl/3d, showing a crankshaft, connecting rod, and piston head in mechanical motion.',
    },
    {
        text: 'Teapot 3D',
        link: '/demos/teapot/',
        description: 'A teapot modelled entirely from parametric surfaces — surfaces of revolution for the body, lid and knob, swept tubes for the spout and handle — lit by a three-point rig of coloured lights, with switchable materials, textures and wireframe.',
    },
    {
        text: 'Interactive Terminal',
        link: '/demos/terminal/',
        description: 'An interactive terminal running on @ripl/terminal with a menu-driven interface: basic shapes, animations, or line, bar, stock and Gantt charts rendered in Unicode braille.',
    },
];
