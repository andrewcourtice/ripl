# Area Chart

The **Area Chart** renders filled areas beneath lines, making it easy to compare cumulative totals or show how individual series contribute to a whole. It supports stacked mode (areas stacked on top of each other), per-series opacity and line interpolation, and includes crosshair, grid, tooltips, and a legend. When areas overlap (unstacked), they are painted largest-first so a smaller area is never hidden behind a larger one. On entry the area is revealed left-to-right as the line draws on, and it transitions smoothly between data states on update.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addPoint">Add Point</RiplButton>
            <RiplButton @click="removePoint">Remove Point</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Area" :extras-reset="reset">
            <RiplField label="Mode">
                <RiplSelect v-model="extras.stackMode">
                    <option value="overlaid">Overlaid</option>
                    <option value="stacked">Stacked</option>
                    <option value="percent">100% stacked</option>
                </RiplSelect>
            </RiplField>
            <RiplField v-if="extras.stackMode !== 'percent'" label="Secondary axis" inline>
                <RiplSwitch v-model="extras.secondaryAxis" />
            </RiplField>
            <RiplField label="Line type">
                <RiplSelect v-model="extras.lineType">
                    <option value="linear">Linear</option>
                    <option value="spline">Spline</option>
                    <option value="basis">Basis</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull-Rom</option>
                    <option value="natural">Natural</option>
                    <option value="monotoneX">Monotone X</option>
                    <option value="monotoneY">Monotone Y</option>
                    <option value="bumpX">Bump X</option>
                    <option value="bumpY">Bump Y</option>
                    <option value="step">Step</option>
                    <option value="stepBefore">Step Before</option>
                    <option value="stepAfter">Step After</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Line style">
                <RiplSelect v-model="extras.lineStyle">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Fill opacity">
                <RiplInputRange v-model="extras.fillOpacity" :min="0" :max="1" :step="0.05" />
            </RiplField>
            <RiplField label="Markers" inline>
                <RiplSwitch v-model="extras.markers" />
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
    seedColors,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createAreaChart,
} from '@ripl/charts';

import type {
    PolylineRenderer,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const seriesMeta = [
    { id: 'desktop', label: 'Desktop' },
    { id: 'mobile', label: 'Mobile' },
];

// Maps the drawer's three-way mode onto the chart's `stacked` option.
const STACK_MODE_VALUES = {
    overlaid: false,
    stacked: true,
    percent: 'percent',
} as const;

const { extras, reset } = useChartExtras({
    stackMode: 'overlaid' as keyof typeof STACK_MODE_VALUES,
    secondaryAxis: false,
    lineType: 'monotoneX' as PolylineRenderer,
    lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted',
    fillOpacity: 0.3,
    markers: false,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        axes: true,
        grid: true,
        tooltip: true,
        crosshair: true,
        format: true,
        animation: true,
        theme: true,
        navigator: true,
        annotations: true,
    },
    title: 'Traffic by Device',
    axisX: 'Month',
    axisY: 'Sessions',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateData(count = 6) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        desktop: Math.round(Math.random() * 600 + 200),
        mobile: Math.round(Math.random() * 400 + 100),
    }));
}

let data = generateData();

// Percent stacking normalizes per axis group, so the secondary-axis binding only applies to the
// other modes (the drawer hides the toggle in percent mode to match).
function secondaryAxisActive() {
    return extras.secondaryAxis && extras.stackMode !== 'percent';
}

// With the secondary axis on, shrink the mobile series an order of magnitude so its units
// genuinely differ from desktop's and the right-hand axis is justified.
function activeData() {
    if (!secondaryAxisActive()) {
        return data;
    }

    return data.map(item => ({
        ...item,
        mobile: Math.round(item.mobile / 10),
    }));
}

function getSeries() {
    const secondary = secondaryAxisActive();

    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        fillOpacity: extras.fillOpacity,
        lineType: extras.lineType,
        lineStyle: extras.lineStyle,
        markers: extras.markers,
        color: config.colors[s.id],
        axis: secondary && s.id === 'mobile' ? 1 : undefined,
    }));
}

function buildOptions() {
    const options = {
        data: activeData(),
        stacked: STACK_MODE_VALUES[extras.stackMode],
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // A second `axis.y` entry renders a right-hand y-axis; the mobile series binds to it via its
    // `yAxis: 1` series option.
    if (secondaryAxisActive()) {
        options.axis = {
            ...options.axis,
            y: [
                options.axis.y,
                {
                    visible: config.axesVisible,
                    title: 'Mobile (sessions)',
                },
            ],
        };
    }

    // Sample reference line + shaded band, drawn through the y scale.
    options.annotations = config.annotationsVisible
        ? [
            {
                axis: 'y',
                value: 500,
                label: 'Target',
            },
            {
                type: 'band',
                axis: 'y',
                from: 0,
                to: 200,
                label: 'Baseline',
            },
        ]
        : [];

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createAreaChart(context, {
        key: 'month',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData(data.length);
    chart.value?.update({ data: activeData() });
}

function addPoint() {
    if (data.length < MONTHS.length) {
        data = generateData(data.length + 1);
        chart.value?.update({ data: activeData() });
    }
}

function removePoint() {
    if (data.length > 2) {
        data = generateData(data.length - 1);
        chart.value?.update({ data: activeData() });
    }
}
</script>

## Usage

```ts
import {
    createAreaChart,
} from '@ripl/charts';

const chart = createAreaChart('#container', {
    data: [/* ... */],
    key: 'month',
    stacked: false,
    series: [
        { id: 'desktop', value: 'desktop', label: 'Desktop' },
        { id: 'mobile', value: 'mobile', label: 'Mobile' },
    ],
});
```

## Data Format

Each item should contain a key field and one or more numeric value fields:

```ts
const data = [
    {
        month: 'Jan',
        desktop: 620,
        mobile: 340,
    },
    {
        month: 'Feb',
        desktop: 780,
        mobile: 290,
    },
    {
        month: 'Mar',
        desktop: 550,
        mobile: 410,
    },
];
```

## Variants

### Stacked

Stack series to show cumulative totals:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    stacked: true,
    series: [
        {
            id: 'desktop',
            value: 'desktop',
            label: 'Desktop',
            fillOpacity: 0.4,
        },
        {
            id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
            fillOpacity: 0.4,
        },
    ],
});
```

### 100% stacked

Pass `stacked: 'percent'` to normalize each category to its share of the category total. The value axis is fixed to 0–100% and values default to percentage formatting:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    stacked: 'percent',
    series: [
        {
            id: 'desktop',
            value: 'desktop',
            label: 'Desktop',
        },
        {
            id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
        },
    ],
});
```

### Secondary y-axis

Supply a second `axis.y` entry to render a right-hand axis, and bind a series to it with the series `axis` option (an index or the axis `id`). When the chart is stacked, series stack per axis group:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'sessions',
            value: 'sessions',
            label: 'Sessions',
        },
        {
            id: 'conversion',
            value: 'conversion',
            label: 'Conversion %',
            axis: 1,
        },
    ],
    axis: {
        y: [
            { title: 'Sessions' },
            {
                title: 'Conversion %',
                format: 'percentage',
            },
        ],
    },
});
```

### Custom opacity and line type

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'desktop',
            value: 'desktop',
            label: 'Desktop',
            fillOpacity: 0.2,
            lineType: 'monotoneX',
        },
        {
            id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
            fillOpacity: 0.6,
            lineType: 'step',
        },
    ],
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
createAreaChart('#container', {
    data,   // TData[]
    series, // AreaChartSeriesOptions<TData>[]
    key,    // keyof TData | ((item: TData) => string)
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface AreaChartOptions<TData> {
    // Chart-specific
    /** The dataset rendered by the chart. */
    data: TData[];

    /** The series to draw from each data item. */
    series: AreaChartSeriesOptions<TData>[];

    /** Accessor for each item's category key (the value plotted along the x axis). */
    key: keyof TData | ((item: TData) => string);

    /**
     * Stack series cumulatively instead of overlaying them. Defaults to false. With multiple
     * y-axes, stacking applies per axis group; series stack only with the other series bound to
     * the same axis, and each axis's extent covers its own group's cumulative total.
     */
    stacked?: boolean | 'percent';

    /**
     * Show value labels next to each marker. `true` uses the default anchor; a string sets the
     * anchor side.
     */
    labels?: ChartDataLabelsInput;

    /** Format applied to marker values shown as text (tooltips and labels). */
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

    // Shared by every cartesian chart (CartesianChartOptions)
    /** X/y axis configuration, or a boolean toggling both axes. See `ChartAxisInput`. */
    axis?: ChartAxisInput<TData>;

    /** Background grid configuration, or a boolean toggle. See `ChartGridInput`. */
    grid?: ChartGridInput;

    /** Hover-tooltip configuration, or a boolean toggle. See `ChartTooltipInput`. */
    tooltip?: ChartTooltipInput;

    /** Legend configuration, a position string, or a boolean toggle. See `ChartLegendInput`. */
    legend?: ChartLegendInput;

    /** Crosshair configuration, or a boolean toggle. See `ChartCrosshairInput`. */
    crosshair?: ChartCrosshairInput;

    /** Reference lines, shaded bands, and point markers drawn over the plot. See `ChartAnnotation`. */
    annotations?: ChartAnnotation[];

    /**
     * Enables pan/zoom (and optionally brush) navigation on the plot. `true` turns on wheel-zoom
     * and click-drag pan; an object configures each interaction individually. The chart
     * auto-creates a `DOMNavigator` on its context and rescales the axis domains as the view
     * changes, with no data rebuild. Access the underlying controller via `chart.navigator` for
     * imperative framing (`centerOn`/`fitBounds`) or brush-and-link.
     */
    navigator?: boolean | NavigatorInteractions;

    /**
     * Enables an overview "scrub bar" strip beside the plot with a draggable window that selects
     * the visible range of the **category** axis (a bottom bar for category-on-x charts, a side
     * bar for a horizontal bar chart). `true` uses the default size; an object sets it. Enabling
     * the strip also turns on in-plot wheel/drag pan-zoom (category-axis only) unless `navigator`
     * is explicitly `false`. Only category-axis charts (line, area, bar, trend) render the strip.
     */
    overview?: boolean | ChartOverviewOptions;
}

interface AreaChartSeriesOptions<TData> {
    /** Unique identifier for the series, used for color assignment, legend, and data joins. */
    id: string;

    /** Explicit series color; falls back to the chart's generated palette when omitted. */
    color?: string;

    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;

    /** Human-readable series name shown in the legend and tooltips. */
    label: string;

    /**
     * Renderer used to draw the line/area top edge (e.g. straight or curved); defaults to straight
     * segments.
     */
    lineType?: PolylineRenderer;

    /** Line dash style: `'solid'` (default), `'dashed'`, `'dotted'`, or a custom dash array. */
    lineStyle?: LineStyle;

    /** Width in pixels of the series line. */
    lineWidth?: number;

    /** Fill opacity of the area band. Defaults to 0.3. */
    fillOpacity?: number;

    /** Show point markers at each data value. Defaults to true. */
    markers?: boolean;

    /**
     * Which y-axis this series binds to: an index into `axis.y` or a y-axis `id`. Defaults to the
     * primary axis. When the chart is stacked, series stack only with other series bound to the
     * same axis.
     */
    yAxis?: number | string;
}

interface AreaChartEventMap {
    /** Emitted when a marker is clicked. */
    markerclick: AreaChartMarkerEvent;

    /** Emitted when the pointer enters a marker. */
    markerenter: AreaChartMarkerEvent;

    /** Emitted when the pointer leaves a marker. */
    markerleave: AreaChartMarkerEvent;
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
// Emitted when a marker is clicked.
chart.on('markerclick', event => console.log(event.data)); // event.data: AreaChartMarkerEvent
// Emitted when the pointer enters a marker.
chart.on('markerenter', event => console.log(event.data)); // event.data: AreaChartMarkerEvent
// Emitted when the pointer leaves a marker.
chart.on('markerleave', event => console.log(event.data)); // event.data: AreaChartMarkerEvent
```
<!-- events:end -->
