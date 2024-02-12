# Pie Chart

A pie chart is useful for illustrating numerical proportions of statistical data.

<ripl-example @context-changed="contextChanged"></ripl-example>

<script lang="ts" setup>
import {
    ref,
} from 'vue';

import {
    Context,
    serialiseRGBA,
    clamp
} from '@ripl/core';

import {
    PieChart,
    createPieChart
} from '@ripl/charts';

import {
    stringUniqueId
} from '@ripl/utilities';

import useRiplChart from '../../.vitepress/compositions/example';

const getColor = () => serialiseRGBA(
    clamp(Math.round(Math.random()) * 255, 80, 230),
    clamp(Math.round(Math.random()) * 255, 80, 230),
    clamp(Math.round(Math.random()) * 255, 80, 230),
    1
);

const {
    contextChanged
} = useRiplChart(context => createPieChart(context, {
    key: 'id',
    value: 'value',
    color: 'color',
    label: 'label',
    data: [
        {
            id: stringUniqueId(),
            label: 'Australia',
            value: 55,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'Poland',
            value: 21,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'South Africa',
            value: 185,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'New Zealand',
            value: 18,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'USA',
            value: 129,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'Sweden',
            value: 15,
            color: getColor()
        },
    ]
}));
</script>

```typescript
const chart = createPieChart(context, {
    key: 'id',
    value: 'value',
    color: 'color',
    label: 'label',
    data: [
        {
            id: stringUniqueId(),
            label: 'Australia',
            value: 55,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'Poland',
            value: 21,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'South Africa',
            value: 185,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'New Zealand',
            value: 18,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'USA',
            value: 129,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'Sweden',
            value: 15,
            color: getColor()
        },
    ]
})
```