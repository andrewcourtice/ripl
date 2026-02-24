# Demos

Interactive demos showcasing Ripl Charts in real-world scenarios.

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
