---
title: Demos
description: "Ten Ripl demos: a graphing calculator, drawing canvas, trading and analytics dashboards, mermaid renderer, 3D jet engine, piston, teapot and braille terminal."
---

# Demos

Ten applications built with Ripl, each one running live in the page.

Two are data visualization dashboards: the [Trading Dashboard](/demos/trading-dashboard/) draws candlestick, line and volume charts over live Alpha Vantage market data, and [Product Analytics](/demos/product-analytics/) puts line, bar, pie, heatmap, sankey, funnel, gauge and scatter charts behind a shared period selector. Three are drawing tools: the [Graphing Calculator](/demos/graphing-calculator/) plots equations, implicit contours and 3D surfaces from an editable expression list, [Freeform Drawing](/demos/freeform-drawing/) is an Excalidraw-style canvas with pencil, shape, connector and text tools plus PNG/SVG export, and the [Mermaid Diagram](/demos/mermaid-diagram/) renderer parses Mermaid syntax and lays flowcharts out from Ripl core elements. Four are 3D: the [Jet Engine](/demos/jet-engine/) exploded view on canvas, [the same engine on WebGPU](/demos/jet-engine-webgpu/) with WGSL shaders and a hardware depth buffer, an animated [Piston Mechanism](/demos/piston-mechanism/), and a [Teapot](/demos/teapot/) built from parametric surfaces under a three-point light rig, with switchable materials, textures and wireframe. The last, the [Interactive Terminal](/demos/terminal/), renders shapes, animations and charts as Unicode braille.

## Available Demos

<div class="chart-grid">
    <a
        v-for="demo in demos"
        :key="demo.link"
        :href="demo.link"
        class="chart-card"
    >
        <span class="chart-card__title">{{ demo.text }}</span>
        <span class="chart-card__desc">{{ demo.description }}</span>
    </a>
</div>

<script setup>
import { demos } from '../.vitepress/data/demos';
</script>

<style>
.chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    margin-top: 24px;
}

.chart-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 20px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    text-decoration: none !important;
    color: inherit !important;
    transition: border-color 0.25s, box-shadow 0.25s;
}

.chart-card:hover {
    border-color: var(--vp-c-brand-1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-card__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--vp-c-brand-1);
}

.chart-card__desc {
    font-size: 14px;
    line-height: 1.5;
    color: var(--vp-c-text-2);
}
</style>
