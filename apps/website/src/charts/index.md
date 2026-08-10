---
title: Charts
description: "Browse the 25 chart types in @ripl/charts: bar, line, area, pie, scatter, candlestick, heatmap, radar, sankey, treemap and more, on Canvas, SVG or a terminal."
---

# Charts

`@ripl/charts` is the chart library built on Ripl's core rendering engine: 25 chart types in strict TypeScript, with no third-party runtime dependencies. Every chart animates its data transitions, responds to pointer events, resizes with its container, and draws through the same `Context` — so the same chart code renders to Canvas, SVG or a [terminal](/charts/advanced/rendering-targets), in the browser or [server-side in Node](/charts/advanced/server-side-rendering). Each one is created with a `createXxxChart(target, options)` factory and updated through `chart.update(options)`.

> [!NOTE]
> For the full Charts API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Available Charts

Twenty-five chart types ship in five families. **Cartesian**: line, bar, area, trend (mixed line/bar/area), scatter, stock (OHLC candlestick), histogram and box plot. **Radial & polar**: pie and donut, polar area, polar scatter, radial bar, radar and gauge. **Hierarchical**: treemap, packed circle and sunburst. **Network & flow**: sankey, chord, force-directed network, arc diagram and funnel. **Specialized**: heatmap, gantt and realtime streaming.

All of them share the same [options](/charts/shared-options) for padding, titles, legends, tooltips, theming and animation; the cartesian ones add axes, grids, crosshairs, [annotations](/charts/advanced/annotations) and [panning and zooming](/charts/advanced/panning-and-zooming).

<template v-for="category in chartCategories" :key="category">
    <h3>{{ category }}</h3>
    <div class="chart-grid">
        <a
            v-for="chart in charts.filter(chart => chart.category === category)"
            :key="chart.link"
            :href="chart.link"
            class="chart-card"
        >
            <span class="chart-card__title">{{ chart.text }}</span>
            <span class="chart-card__desc">{{ chart.description }}</span>
        </a>
    </div>
</template>

<script setup lang="ts">
import {
    chartCategories,
    charts,
} from '../.vitepress/data/charts';
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