# Treemap Chart

The **Treemap Chart** displays hierarchical data as nested rectangles, where each rectangle's area is proportional to its value. It's great for visualizing how a total breaks down into parts — market share, disk usage, budget allocation, etc. Cells are labeled, automatically colored, and animate smoothly on data changes. Configurable gaps and rounded corners keep the layout clean.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    createTreemapChart,
} from '@ripl/charts';

import {
    ref,
} from 'vue';

const CATEGORIES = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Toys', 'Health'];

function generateData() {
    return CATEGORIES.map(name => ({
        name,
        value: Math.round(Math.random() * 900 + 100),
    }));
}

const data = ref(generateData());

const { contextChanged } = useRiplChart(context => {
    return createTreemapChart(context, {
        data: data.value,
        key: 'name',
        value: 'value',
        label: 'name',
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
    });
});

function randomize() {
    data.value = generateData();
}
</script>

## Usage

```ts
import {
    createTreemapChart,
} from '@ripl/charts';

const chart = createTreemapChart('#container', {
    data: [...],
    key: 'name',
    value: 'value',
    label: 'name',
});
```

## Options

- **`data`** — The data array
- **`key`** — Unique key accessor
- **`value`** — Value accessor (determines rectangle area)
- **`label`** — Label accessor (displayed inside cells)
- **`color`** — Optional color accessor
- **`gap`** — Gap between cells in pixels (default `3`)
- **`borderRadius`** — Cell corner radius (default `4`)
