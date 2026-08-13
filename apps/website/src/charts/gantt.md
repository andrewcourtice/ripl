---
title: Gantt Chart
description: Schedule tasks as bars on a time axis with progress overlays, finish-to-start dependency connectors, a today marker, grid lines and hover tooltips.
---

# Gantt Chart

The **Gantt Chart** places each task as a bar between its `start` and `end` on a time axis, with task names down the y-axis. It is the schedule view when duration and overlap are the story: project plans, release trains, resource bookings. `progress` draws a completion overlay inside each bar, `dependencies` connects finish-to-start pairs with curved connectors, `showToday` and `todayColor` mark the current date, and `colorBy` groups the bars. Tasks animate when they are added, removed or rescheduled, and tooltips and grid lines are built in. Point it at a Canvas, SVG or [terminal context](/charts/advanced/rendering-targets) and nothing else changes.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addTask">Add Task</RiplButton>
            <RiplButton @click="removeTask">Remove Task</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Gantt" :extras-reset="reset">
            <RiplField label="Today marker" inline option="showToday">
                <RiplSwitch v-model="extras.showToday" />
            </RiplField>
            <RiplField label="Corner radius" option="borderRadius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Dependencies" inline option="dependencies">
                <RiplSwitch v-model="extras.showConnectors" />
            </RiplField>
            <template #colors>
                <RiplField v-if="extras.showToday" label="Marker color" inline option="todayColor">
                    <RiplColorInput v-model="extras.todayColor" />
                </RiplField>
            </template>
        </RiplChartConfig>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createGanttChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    showToday: true,
    todayColor: '#ef4444',
    borderRadius: 3,
    showConnectors: true,
});

const config = useChartConfig({
    features: {
        title: true,
        grid: true,
        tooltip: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Project Schedule',
});

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

let taskCount = 8;

const toId = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

// Finish-to-start dependencies between tasks (by name), drawn as curved connectors.
const DEPENDENCIES: Record<string, string[]> = {
    Design: ['Research'],
    Prototyping: ['Design'],
    'Frontend Dev': ['Prototyping'],
    'Backend Dev': ['Prototyping'],
    'API Integration': ['Frontend Dev', 'Backend Dev'],
    Testing: ['API Integration'],
    Documentation: ['Testing'],
    'Code Review': ['Testing'],
    Deployment: ['Code Review'],
    Marketing: ['Deployment'],
    Launch: ['Deployment', 'Marketing'],
};

function generateTask(name: string, index: number) {
    const baseDate = new Date();
    const startOffset = Math.floor(index * 5 + Math.random() * 10) - 15;
    const duration = Math.floor(Math.random() * 15) + 5;
    const start = new Date(baseDate.getTime() + startOffset * 86400000);
    const end = new Date(start.getTime() + duration * 86400000);
    const progress = Math.round(Math.random() * 100) / 100;

    return {
        id: toId(name),
        name,
        start,
        end,
        progress,
        dependsOn: (DEPENDENCIES[name] ?? []).map(toId),
    };
}

function generateData() {
    return TASKS.slice(0, taskCount).map((name, i) => generateTask(name, i));
}

let data = generateData();

function buildOptions() {
    const options = {
        showToday: extras.showToday,
        todayColor: extras.todayColor,
        borderRadius: extras.borderRadius,
        dependencies: extras.showConnectors ? 'dependsOn' : undefined,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${Math.round(v * 100)}% complete`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createGanttChart(context, {
        data,
        key: 'id',
        label: 'name',
        start: 'start',
        end: 'end',
        progress: 'progress',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });

// The grid is only created at construction, so rebuild the chart when it is toggled.
watch(() => config.gridVisible, () => example.value?.recreate());

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
</script>

## Usage

```ts
import {
    createGanttChart,
} from '@ripl/charts';

const chart = createGanttChart('#container', {
    data: [/* ... */],
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

## Data Format

Each item is one task, with a key, a label, and `Date` values for its start and end. `progress` is
optional and drawn as an overlay on the bar:

```ts
const data = [
    {
        id: 'design',
        name: 'Design',
        start: new Date('2024-01-08'),
        end: new Date('2024-01-19'),
        progress: 1,
    },
    {
        id: 'build',
        name: 'Build',
        start: new Date('2024-01-22'),
        end: new Date('2024-02-16'),
        progress: 0.4,
        dependsOn: ['design'],
    },
];
```

`dependencies` returns the keys of the tasks a task waits on, and draws a finish-to-start connector
from each one.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createGanttChart('#container', {
    data,
    key: 'id',
    label: 'name',
    start: 'start',
    end: 'end',
    colorBy: 'team',
    // Completion ratio (0–1), drawn as an overlay on each bar.
    progress: 'progress',
    // Ids of the tasks this one depends on, drawn as connectors.
    dependencies: 'dependsOn',
    borderRadius: 4,
    showToday: true,
    todayColor: '#f4a0b9',
    grid: true,
    tooltip: true,
    axis: { x: { title: 'Timeline' } },
    format: 'percentage',
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a task bar is clicked.
chart.on('taskclick', event => console.log(event.data)); // event.data: GanttChartTaskEvent
// Emitted when the pointer enters a task bar.
chart.on('taskenter', event => console.log(event.data)); // event.data: GanttChartTaskEvent
// Emitted when the pointer leaves a task bar.
chart.on('taskleave', event => console.log(event.data)); // event.data: GanttChartTaskEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightTask` puts a task bar into the same hover state the pointer would — it lifts out of its
rest tint to full color — without waiting for one. Pass the task's key, exactly as the chart reports
it in the events above, the `{ key }` ref form, or an accessor over the chart's data returning
either. `{ tooltip: true }` opens the task's tooltip where hovering would; a gantt chart draws no
crosshair, so `crosshair` is ignored here.

```ts
const chart = createGanttChart('#container', {
    data,
    key: 'id',
    label: 'name',
    start: 'start',
    end: 'end',
});

// Light the build task and open its tooltip.
chart.highlightTask('build', { tooltip: true });

// The first task in the dataset.
chart.highlightTask(data => data[0].id);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`) or the next pointer hover restores the chart, and it emits none of
the `task*` events above. `clearHighlight()` restores it explicitly; `highlightTask` returns `false`
when the selector matched no live task bar.