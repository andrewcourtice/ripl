# Gantt Chart

The **Gantt Chart** displays tasks as horizontal bars along a time axis, with task names on the y-axis. Each bar can show a progress overlay, and a configurable "today" marker highlights the current date. Curved dependency connectors can be drawn between dependent tasks (finish-to-start). It supports animated transitions when tasks are added, removed, or rescheduled, plus tooltips and grid lines.

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

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createGanttChart('#container', {
    data,  // TData[]
    key,   // keyof TData | ((item: TData) => string)
    label, // keyof TData | ((item: TData) => string)
    start, // keyof TData | ((item: TData) => Date)
    end,   // keyof TData | ((item: TData) => Date)
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface GanttChartOptions<TData> {
    // Chart-specific
    /** The tasks rendered as time-spanning bars. */
    data: TData[];

    /** Accessor for each task's unique key (used for color assignment and data joins). */
    key: keyof TData | ((item: TData) => string);

    /** Accessor for each task's label shown on the category axis. */
    label: keyof TData | ((item: TData) => string);

    /** Accessor for each task's start date. */
    start: keyof TData | ((item: TData) => Date);

    /** Accessor for each task's end date. */
    end: keyof TData | ((item: TData) => Date);

    /** Optional per-item color accessor; falls back to the generated palette. */
    colorBy?: keyof TData | ((item: TData) => string);

    /** Accessor for each task's completion ratio (0–1), drawn as a progress overlay. */
    progress?: NumericAccessor<TData>;

    /**
     * Accessor for the keys of the tasks each task depends on. When provided, a curved connector
     * is drawn from every predecessor task's end to this task's start (finish-to-start). Return an
     * empty array, or omit the option entirely, for a task with no dependencies.
     */
    dependencies?: keyof TData | ((item: TData) => string[]);

    /** Background grid configuration (`true`/`false` or detailed grid options). */
    grid?: ChartGridInput;

    /** Hover tooltip configuration (`true`/`false` or detailed tooltip options). */
    tooltip?: ChartTooltipInput;

    /** Axis configuration for the category and time axes. */
    axis?: ChartAxisInput<TData>;

    /**
     * Format applied to the numeric progress value shown in the task tooltip. Defaults to a
     * percentage.
     */
    format?: ValueFormatInput;

    /** Draw a marker line at the current date. Defaults to true. */
    showToday?: boolean;

    /** Color of the "today" marker line. */
    todayColor?: string;

    /** Corner radius in pixels applied to each task bar. Defaults to 3. */
    borderRadius?: number;

    // Shared by every chart (BaseChartOptions)
    /**
     * Whether the chart renders automatically on construction and after every `Chart.update`.
     * Defaults to `true`.
     */
    autoRender?: boolean;

    /**
     * Space reserved around the chart, in pixels. A single number applies to all four edges; a
     * `[top, right, bottom, left]` tuple or a partial `{ top, right, bottom, left }` object sets
     * individual edges, leaving unspecified edges at the default. Defaults to `16`.
     */
    padding?: PaddingInput;

    /** Chart title as plain text, or a `ChartTitleOptions` object for full control. */
    title?: string | Partial<ChartTitleOptions>;

    /** Animation configuration, or a boolean toggling all transitions. See `ChartAnimationOptions`. */
    animation?: boolean | Partial<ChartAnimationOptions>;

    /**
     * Theme for this chart: a registered name (`'light'`/`'dark'`/`'auto'`), or a `Theme`. Falls
     * back to the module default (see `setDefaultTheme`).
     */
    theme?: string | Theme;

    /**
     * Accessible description announced by screen readers (sets the rendering element's ARIA
     * label). Defaults to the title text.
     */
    description?: string;
}

interface GanttChartEventMap {
    /** Emitted when a task bar is clicked. */
    taskclick: GanttChartTaskEvent;

    /** Emitted when the pointer enters a task bar. */
    taskenter: GanttChartTaskEvent;

    /** Emitted when the pointer leaves a task bar. */
    taskleave: GanttChartTaskEvent;
}
```
<!-- options:end -->

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
