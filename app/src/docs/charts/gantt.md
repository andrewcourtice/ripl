# Gantt Chart

The **Gantt Chart** displays tasks as horizontal bars along a time axis, with task names on the y-axis. Each bar can show a progress overlay, and a configurable "today" marker highlights the current date. It supports animated transitions when tasks are added, removed, or rescheduled, plus tooltips and grid lines.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/charts/charts).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addTask">Add Task</RiplButton>
            <RiplButton @click="removeTask">Remove Task</RiplButton>
            <RiplSwitch v-model="showToday" @update:model-value="toggleToday" label="Today" />
        </RiplControlGroup>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    createGanttChart,
} from '@ripl/charts';

import {
    ref,
} from 'vue';

const TASKS = [
    'Research',
    'Design',
    'Prototyping',
    'Frontend Dev',
    'Backend Dev',
    'API Integration',
    'Testing',
    'Documentation',
    'Code Review',
    'Deployment',
    'Marketing',
    'Launch',
];

const showToday = ref(true);
let taskCount = 8;

function generateTask(name: string, index: number) {
    const baseDate = new Date();
    const startOffset = Math.floor(index * 5 + Math.random() * 10) - 15;
    const duration = Math.floor(Math.random() * 15) + 5;
    const start = new Date(baseDate.getTime() + startOffset * 86400000);
    const end = new Date(start.getTime() + duration * 86400000);
    const progress = Math.round(Math.random() * 100) / 100;

    return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        start,
        end,
        progress,
    };
}

function generateData() {
    return TASKS.slice(0, taskCount).map((name, i) => generateTask(name, i));
}

let data = generateData();

const { contextChanged, chart } = useRiplChart(context => {
    return createGanttChart(context, {
        data,
        key: 'id',
        label: 'name',
        start: 'start',
        end: 'end',
        progress: 'progress',
        showToday: showToday.value,
        padding: { top: 20, right: 20, bottom: 30, left: 20 },
    });
});

function randomize() {
    data = generateData();
    chart.value?.update({ data });
}

function addTask() {
    if (taskCount < TASKS.length) {
        taskCount++;
        data = generateData();
        chart.value?.update({ data });
    }
}

function removeTask() {
    if (taskCount > 2) {
        taskCount--;
        data = generateData();
        chart.value?.update({ data });
    }
}

function toggleToday() {
    chart.value?.update({ showToday: showToday.value });
}
</script>

## Usage

```ts
import {
    createGanttChart,
} from '@ripl/charts';

const chart = createGanttChart('#container', {
    data: [...],
    key: 'id',
    label: 'name',
    start: 'start',
    end: 'end',
    progress: 'progress',  // optional, 0–1
    showToday: true,
});

// Update data
chart.update({ data: newData });
```

## Options

- **`data`** — The data array (one item per task)
- **`key`** — Unique key accessor per task
- **`label`** — Label accessor for y-axis task names
- **`start`** — Start date accessor
- **`end`** — End date accessor
- **`color`** — Optional color accessor per task
- **`progress`** — Optional progress accessor (0–1)
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips
- **`axis`** — `boolean | ChartAxisOptions` — Configure axes
- **`showToday`** — Show a vertical "today" marker line (default `true`)
- **`todayColor`** — Color for the today marker (default `#ef4444`)
- **`borderRadius`** — Bar corner radius (default `3`)
- **`padding`** — Chart padding
