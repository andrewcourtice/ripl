# Gantt Chart

The `GanttChart` displays tasks as horizontal bars along a time axis, with task names on the y-axis. It supports progress overlays, a today marker, animated transitions, tooltips, and grid lines.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="randomize">Randomize</button>
            <button class="ripl-button" @click="addTask">Add Task</button>
            <button class="ripl-button" @click="removeTask">Remove Task</button>
            <button class="ripl-button" @click="toggleToday">Toggle Today Marker</button>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref } from 'vue';
import { createGanttChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

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
        keyBy: 'id',
        labelBy: 'name',
        startBy: 'start',
        endBy: 'end',
        progressBy: 'progress',
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
    showToday.value = !showToday.value;
    chart.value?.update({ showToday: showToday.value });
}
</script>

## Usage

```ts
import { createGanttChart } from '@ripl/charts';

const chart = createGanttChart('#container', {
    data: [...],
    keyBy: 'id',
    labelBy: 'name',
    startBy: 'start',
    endBy: 'end',
    progressBy: 'progress',  // optional, 0–1
    showToday: true,
});

// Update data
chart.update({ data: newData });
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | `TData[]` | — | The data array (one item per task) |
| `keyBy` | `keyof TData \| Function` | — | Unique key accessor per task |
| `labelBy` | `keyof TData \| Function` | — | Label accessor for y-axis task names |
| `startBy` | `keyof TData \| Function` | — | Start date accessor |
| `endBy` | `keyof TData \| Function` | — | End date accessor |
| `colorBy` | `keyof TData \| Function` | — | Optional color accessor per task |
| `progressBy` | `keyof TData \| Function` | — | Optional progress accessor (0–1) |
| `showGrid` | `boolean` | `true` | Show horizontal grid lines |
| `showToday` | `boolean` | `true` | Show a vertical "today" marker line |
| `todayColor` | `string` | `#ef4444` | Color for the today marker |
| `borderRadius` | `number` | `3` | Bar corner radius |
| `padding` | `Partial<ChartPadding>` | `10` all | Chart padding |
| `formatXLabel` | `Function` | — | Custom x-axis (date) label formatter |
| `formatYLabel` | `Function` | — | Custom y-axis (task) label formatter |
