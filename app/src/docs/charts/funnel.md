# Funnel Chart

The `FunnelChart` displays data as progressively narrowing horizontal bars, ideal for visualizing conversion pipelines and drop-off rates.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="randomize">Randomize</button>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref } from 'vue';
import { createFunnelChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

function generateData() {
    let remaining = 10000;
    return ['Visitors', 'Leads', 'Prospects', 'Negotiations', 'Closed'].map(stage => {
        const value = remaining;
        remaining = Math.round(remaining * (0.3 + Math.random() * 0.4));
        return { stage, value };
    });
}

const data = ref(generateData());

const { contextChanged } = useRiplChart(context => {
    return createFunnelChart(context, {
        data: data.value,
        key: 'stage',
        value: 'value',
        label: 'stage',
        padding: { top: 20, right: 40, bottom: 20, left: 40 },
    });
});

function randomize() {
    data.value = generateData();
}
</script>

## Usage

```ts
import { createFunnelChart } from '@ripl/charts';

const chart = createFunnelChart('#container', {
    data: [...],
    key: 'stage',
    value: 'value',
    label: 'stage',
});
```

## Options

- **`data`** — The data array (ordered from widest to narrowest)
- **`key`** — Unique key accessor
- **`value`** — Value accessor (determines bar width)
- **`label`** — Label accessor (displayed inside bars)
- **`color`** — Optional color accessor
- **`gap`** — Gap between segments in pixels (default `4`)
- **`borderRadius`** — Segment corner radius (default `4`)
