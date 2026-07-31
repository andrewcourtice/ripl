# Pie Chart

The **Pie Chart** illustrates numerical proportions as angular slices of a circle. It supports animated entry, exit, and reorder transitions when data changes, and can switch to a donut layout by setting an `innerRadius`. Hover any slice to see a tooltip, and adjust the inner radius in the demo below.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="removeData">Remove Data</RiplButton>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Pie" :extras-reset="reset">
            <RiplField label="Inner radius" option="innerRadius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.9" :step="0.05" />
            </RiplField>
            <RiplField label="Labels" option="labels">
                <RiplSelect v-model="extras.labels">
                    <option value="off">Off</option>
                    <option value="inside">Inside</option>
                    <option value="outside">Outside</option>
                </RiplSelect>
            </RiplField>
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
    createPieChart,
} from '@ripl/charts';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
    watch,
} from 'vue';

const COUNTRIES = [
    'Australia', 'Poland', 'South Africa', 'New Zealand',
    'United States', 'Sweden', 'Great Britain', 'Brazil',
    'France', 'Switzerland',
];

const { extras, reset } = useChartExtras({
    innerRadius: 0,
    labels: 'off' as 'off' | 'inside' | 'outside',
});

function labelsOption() {
    return extras.labels === 'off' ? false : extras.labels;
}

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Sales by Country',
});

function getDataValue() {
    return Math.round(Math.random() * 500);
}

function getDataItem(label: string = stringUniqueId()) {
    return {
        label,
        id: stringUniqueId(),
        value: getDataValue(),
    };
}

let data = COUNTRIES.map(label => getDataItem(label));

function buildOptions() {
    return {
        innerRadius: extras.innerRadius,
        labels: labelsOption(),
        ...buildCommonOptions(config),
    };
}

const example = ref();

const {
    contextChanged,
    chart,
} = useRiplChart(context => createPieChart(context, {
    key: 'id',
    value: 'value',
    label: 'label',
    data,
    ...buildOptions(),
}));

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function update() {
    chart.value?.update({ data });
}

function editData(body: (index: number) => void) {
    const index = Math.floor(Math.random() * data.length);
    body(index);
    update();
}

function addData() {
    editData(index => data.splice(index, 0, getDataItem()));
}

function removeData() {
    editData(index => data.splice(index, 1));
}

function randomize() {
    data = data.map(item => ({
        ...item,
        value: getDataValue(),
    }));

    update();
}
</script>

## Usage

```ts
import {
    createPieChart,
} from '@ripl/charts';

const chart = createPieChart('#container', {
    key: 'id',
    value: 'value',
    label: 'label',
    data: [
        {
            id: '1',
            label: 'Australia',
            value: 55,
        },
        {
            id: '2',
            label: 'Poland',
            value: 21,
        },
        {
            id: '3',
            label: 'South Africa',
            value: 185,
        },
    ],
});
```

## Data Format

Each item needs a unique `key`, a numeric `value`, and a display `label`:

```ts
const data = [
    {
        id: 'au',
        label: 'Australia',
        value: 55,
    },
    {
        id: 'pl',
        label: 'Poland',
        value: 21,
    },
    {
        id: 'za',
        label: 'South Africa',
        value: 185,
    },
];
```

The `key`, `value`, and `label` options map to fields in each data item.

## Variants

### Donut

Set `innerRadius` (0–1, as a fraction of the outer radius) to create a donut chart:

```ts
createPieChart('#container', {
    data,
    key: 'id',
    value: 'value',
    label: 'label',
    innerRadius: 0.5,
});
```

### Per-slice colors

Drive slice colors from the data instead of the palette:

```ts
createPieChart('#container', {
    data,
    key: 'id',
    value: 'value',
    label: 'label',
    colorBy: 'color',
});
```

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createPieChart('#container', {
    data,  // TData[]
    key,   // keyof TData | ((item: TData) => string)
    value, // NumericAccessor<TData>
    label, // keyof TData | ((item: TData) => string)
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface PieChartOptions<TData> {
    // Chart-specific
    /** The dataset to render, one segment per item. */
    data: TData[];

    /** Accessor for each item's unique key, used to match segments across data updates. */
    key: keyof TData | ((item: TData) => string);

    /** Accessor for each item's numeric value, which determines its proportional arc angle. */
    value: NumericAccessor<TData>;

    /** Accessor for each item's display label (shown in the legend and segment labels). */
    label: keyof TData | ((item: TData) => string);

    /** Optional accessor for a per-item color override (otherwise a palette color is generated). */
    colorBy?: keyof TData | ((item: TData) => string);

    /**
     * Inner hole radius (donut). A value `<= 1` is a fraction of the outer radius; larger values
     * are absolute pixels. Defaults to 0 (a solid pie).
     */
    innerRadius?: number;

    /** Legend configuration. Shown by default; pass `false` to hide. */
    legend?: ChartLegendInput;

    /**
     * Segment labels. Hidden by default (the legend is shown by default). `true` shows labels
     * inside each segment; `'outside'` places them beyond the arc with a leader line; a full
     * object customizes position/font/color.
     */
    labels?: ChartSegmentLabelsInput;

    /** Format applied to segment values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;

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

interface PieChartEventMap {
    /** Emitted when a segment is clicked. */
    segmentclick: PieChartSegmentEvent;

    /** Emitted when the pointer enters a segment. */
    segmententer: PieChartSegmentEvent;

    /** Emitted when the pointer leaves a segment. */
    segmentleave: PieChartSegmentEvent;
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
// Emitted when a segment is clicked.
chart.on('segmentclick', event => console.log(event.data)); // event.data: PieChartSegmentEvent
// Emitted when the pointer enters a segment.
chart.on('segmententer', event => console.log(event.data)); // event.data: PieChartSegmentEvent
// Emitted when the pointer leaves a segment.
chart.on('segmentleave', event => console.log(event.data)); // event.data: PieChartSegmentEvent
```
<!-- events:end -->
