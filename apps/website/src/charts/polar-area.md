# Polar Area Chart

The **Polar Area Chart** renders equal-angle segments whose radius encodes the value, making it easy to compare magnitudes across categories. Unlike a pie chart (where angle encodes value), all slices share the same angle; only the radius varies. The chart includes animated axis rings, radial lines, labels that enter on first render and transition smoothly on data updates, and an optional legend (shown by default).

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
        <RiplChartConfig :config="config" extra-title="Polar Area" :extras-reset="reset">
            <RiplField label="Inner radius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.4" :step="0.05" />
            </RiplField>
            <RiplField label="Max radius">
                <RiplInputRange v-model="extras.maxRadiusRatio" :min="0.2" :max="0.5" :step="0.05" />
            </RiplField>
            <RiplField label="Segment gap">
                <RiplInputRange v-model="extras.padAngle" :min="0" :max="0.1" :step="0.01" />
            </RiplField>
            <RiplField label="Grid rings">
                <RiplInputRange v-model="extras.levels" :min="2" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Labels">
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
    createPolarAreaChart,
} from '@ripl/charts';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
    watch,
} from 'vue';

const LABELS = ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility', 'Stamina', 'Wisdom'];

const { extras, reset } = useChartExtras({
    innerRadius: 0.15,
    maxRadiusRatio: 0.45,
    padAngle: 0.02,
    levels: 4,
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
    title: 'Attribute Spread',
});

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

function buildOptions() {
    return {
        innerRadius: extras.innerRadius,
        maxRadiusRatio: extras.maxRadiusRatio,
        padAngle: extras.padAngle,
        levels: extras.levels,
        labels: labelsOption(),
        ...buildCommonOptions(config),
    };
}

const example = ref();

const {
    contextChanged,
    chart,
} = useRiplChart(context => createPolarAreaChart(context, {
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

## Usage

```ts
import {
    createPolarAreaChart,
} from '@ripl/charts';

const chart = createPolarAreaChart('#container', {
    key: 'id',
    value: 'value',
    label: 'label',
    data: [
        {
            id: '1',
            label: 'Speed',
            value: 72,
        },
        {
            id: '2',
            label: 'Strength',
            value: 45,
        },
        {
            id: '3',
            label: 'Defense',
            value: 88,
        },
        {
            id: '4',
            label: 'Magic',
            value: 63,
        },
        {
            id: '5',
            label: 'Luck',
            value: 31,
        },
        {
            id: '6',
            label: 'Agility',
            value: 55,
        },
    ],
});
```

## Data Format

Each item needs a unique key, a numeric value (encoded as the segment's radius), and a label:

```ts
const data = [
    {
        id: 'speed',
        label: 'Speed',
        value: 72,
    },
    {
        id: 'strength',
        label: 'Strength',
        value: 45,
    },
    {
        id: 'defense',
        label: 'Defense',
        value: 88,
    },
];
```

Every segment spans the same angle, and only the radius varies with `value`.

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createPolarAreaChart('#container', {
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
interface PolarAreaChartOptions<TData> {
    // Chart-specific
    /** The dataset to render, one equal-angle segment per item. */
    data: TData[];

    /** Accessor for each item's unique key, used to match segments across data updates. */
    key: keyof TData | ((item: TData) => string);

    /** Accessor for each item's numeric value, which determines the segment's radial extent. */
    value: NumericAccessor<TData>;

    /** Accessor for each item's display label (shown in the legend and segment labels). */
    label: keyof TData | ((item: TData) => string);

    /** Optional accessor for a per-item color override (otherwise a palette color is generated). */
    colorBy?: keyof TData | ((item: TData) => string);

    /** Inner radius as a fraction of the chart size (0 - 1). Defaults to 0.15 */
    innerRadius?: number;

    /** Maximum radius ratio (0 - 0.5). Defaults to 0.45 (similar to pie chart). */
    maxRadiusRatio?: number;

    /** Padding angle between segments in radians. Defaults to 0.02 */
    padAngle?: number;

    /** Number of concentric grid rings. Defaults to 4 */
    levels?: number;

    /** Legend showing each segment. Shown by default (more than one segment); pass `false` to hide. */
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

interface PolarAreaChartEventMap {
    /** Emitted when a segment is clicked. */
    segmentclick: PolarAreaChartSegmentEvent;

    /** Emitted when the pointer enters a segment. */
    segmententer: PolarAreaChartSegmentEvent;

    /** Emitted when the pointer leaves a segment. */
    segmentleave: PolarAreaChartSegmentEvent;
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
chart.on('segmentclick', event => console.log(event.data)); // event.data: PolarAreaChartSegmentEvent
// Emitted when the pointer enters a segment.
chart.on('segmententer', event => console.log(event.data)); // event.data: PolarAreaChartSegmentEvent
// Emitted when the pointer leaves a segment.
chart.on('segmentleave', event => console.log(event.data)); // event.data: PolarAreaChartSegmentEvent
```
<!-- events:end -->
