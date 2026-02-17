# Polar Area Chart

The `PolarAreaChart` renders equal-angle segments whose radius encodes the value, making it easy to compare magnitudes across categories.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="addData">Add Data</button>
            <button class="ripl-button" @click="removeData">Remove Data</button>
            <button class="ripl-button" @click="randomize">Randomize</button>
        </div>
    </template>
</ripl-example>

<script lang="ts" setup>
import { ref } from 'vue';
import { createPolarAreaChart } from '@ripl/charts';
import { stringUniqueId } from '@ripl/utilities';
import { useRiplChart } from '../../.vitepress/compositions/example';

const LABELS = ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility', 'Stamina', 'Wisdom'];

function getDataValue() {
    return Math.round(Math.random() * 100);
}

function getDataItem(label: string = LABELS[Math.floor(Math.random() * LABELS.length)]) {
    return {
        id: stringUniqueId(),
        label,
        value: getDataValue(),
    };
}

let data = LABELS.slice(0, 6).map(label => getDataItem(label));

const {
    contextChanged,
    chart,
} = useRiplChart(context => createPolarAreaChart(context, {
    key: 'id',
    value: 'value',
    label: 'label',
    data,
}));

function update() {
    chart.value?.update({ data });
}

function addData() {
    const unusedLabels = LABELS.filter(l => !data.some(d => d.label === l));
    const label = unusedLabels.length > 0
        ? unusedLabels[Math.floor(Math.random() * unusedLabels.length)]
        : `Stat ${data.length + 1}`;

    data = [...data, getDataItem(label)];
    update();
}

function removeData() {
    if (data.length > 2) {
        const index = Math.floor(Math.random() * data.length);
        data = data.filter((_, i) => i !== index);
        update();
    }
}

function randomize() {
    data = data.map(item => ({
        ...item,
        value: getDataValue(),
    }));

    update();
}
</script>

```typescript
const chart = createPolarAreaChart(context, {
    key: 'id',
    value: 'value',
    label: 'label',
    data: [
        { id: '1', label: 'Speed', value: 72 },
        { id: '2', label: 'Strength', value: 45 },
        { id: '3', label: 'Defense', value: 88 },
        { id: '4', label: 'Magic', value: 63 },
        { id: '5', label: 'Luck', value: 31 },
        { id: '6', label: 'Agility', value: 55 },
    ],
});
```
