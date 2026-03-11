---
outline: "deep"
---

# Chart Base & Options

<p class="api-package-badge"><code>@ripl/charts</code></p>

Base Chart class, shared options, axis configuration, and chart infrastructure.

## Overview

**Classes:** [`Chart`](#chart)

**Interfaces:** [`ChartAnimationOptions`](#chartanimationoptions) · [`ChartTitleOptions`](#charttitleoptions) · [`ChartPadding`](#chartpadding) · [`ChartArea`](#chartarea) · [`BaseChartOptions`](#basechartoptions) · [`Padding`](#padding) · [`ChartGridOptions`](#chartgridoptions) · [`ChartCrosshairOptions`](#chartcrosshairoptions) · [`ChartTooltipOptions`](#charttooltipoptions) · [`ChartLegendOptions`](#chartlegendoptions) · [`ChartAxisItemOptions`](#chartaxisitemoptions) · [`ChartYAxisItemOptions`](#chartyaxisitemoptions) · [`ChartAxisOptions`](#chartaxisoptions)

**Type Aliases:** [`ChartOptions`](#chartoptions) · [`EaseName`](#easename) · [`PaddingInput`](#paddinginput) · [`TitlePosition`](#titleposition) · [`ChartTitleInput`](#charttitleinput) · [`ChartAnimationInput`](#chartanimationinput) · [`ChartGridInput`](#chartgridinput) · [`CrosshairAxis`](#crosshairaxis) · [`ChartCrosshairInput`](#chartcrosshairinput) · [`BorderRadiusInput`](#borderradiusinput) · [`ChartTooltipInput`](#charttooltipinput) · [`LegendPosition`](#legendposition) · [`ChartLegendInput`](#chartlegendinput) · [`AxisFormatType`](#axisformattype) · [`ChartAxisInput`](#chartaxisinput)

**Functions:** [`resolveEase`](#resolveease) · [`normalizePadding`](#normalizepadding) · [`normalizeTitle`](#normalizetitle) · [`normalizeAnimation`](#normalizeanimation) · [`normalizeGrid`](#normalizegrid) · [`normalizeCrosshair`](#normalizecrosshair) · [`normalizeTooltip`](#normalizetooltip) · [`normalizeLegend`](#normalizelegend) · [`normalizeAxisItem`](#normalizeaxisitem) · [`normalizeYAxisItem`](#normalizeyaxisitem) · [`normalizeAxis`](#normalizeaxis) · [`resolveFormatLabel`](#resolveformatlabel)

### Chart `class`

Abstract base class for all chart types, providing scene, renderer, animation, color management, and lifecycle.

```ts
class Chart<TOptions extends BaseChartOptions, TEventMap extends EventMap = EventMap> extends EventBus<TEventMap>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options?` | `TOptions \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;TEventMap&gt; \| undefined` |  |

**Methods:**

#### `update(options: Partial&lt;TOptions&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;TOptions&gt;` |  |

#### `render(callback: ((scene: Scene, renderer: Renderer) =&gt; Promise&lt;any&gt;) \| undefined): Promise&lt;void&gt;`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `callback` | `((scene: Scene, renderer: Renderer) =&gt; Promise&lt;any&gt;) \| undefined` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof TEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof TEventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;TEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;TEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;TEventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;TEventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;TEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;TEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### ChartAnimationOptions `interface`

Fully resolved chart animation options.

```ts
interface ChartAnimationOptions {
    enabled: boolean;
    duration: number;
    ease: EaseName | Ease;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `enabled` | `boolean` |  |
| `duration` | `number` |  |
| `ease` | `Ease \| EaseName` |  |
---

### ChartTitleOptions `interface`

Fully resolved chart title options.

```ts
interface ChartTitleOptions {
    visible: boolean;
    text: string;
    padding: PaddingInput;
    font: string;
    fontColor: string;
    position: TitlePosition;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `visible` | `boolean` |  |
| `text` | `string` |  |
| `padding` | `PaddingInput` |  |
| `font` | `string` |  |
| `fontColor` | `string` |  |
| `position` | `TitlePosition` |  |
---

### ChartPadding `interface`

Chart padding with explicit top, right, bottom, and left values.

```ts
interface ChartPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `top` | `number` |  |
| `right` | `number` |  |
| `bottom` | `number` |  |
| `left` | `number` |  |
---

### ChartArea `interface`

The computed drawing area of a chart after padding is applied.

```ts
interface ChartArea {
    x: number;
    y: number;
    width: number;
    height: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |
---

### BaseChartOptions `interface`

Base options shared by all chart types.

```ts
interface BaseChartOptions {
    autoRender?: boolean;
    padding?: Partial<ChartPadding>;
    title?: string | Partial<ChartTitleOptions>;
    animation?: boolean | Partial<ChartAnimationOptions>;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### Padding `interface`

Resolved padding with explicit top, right, bottom, and left values.

```ts
interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `top` | `number` |  |
| `right` | `number` |  |
| `bottom` | `number` |  |
| `left` | `number` |  |
---

### ChartGridOptions `interface`

Fully resolved chart grid options.

```ts
interface ChartGridOptions {
    visible: boolean;
    lineColor: string;
    lineWidth: number;
    lineDash: number[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `visible` | `boolean` |  |
| `lineColor` | `string` |  |
| `lineWidth` | `number` |  |
| `lineDash` | `number[]` |  |
---

### ChartCrosshairOptions `interface`

Fully resolved chart crosshair options.

```ts
interface ChartCrosshairOptions {
    visible: boolean;
    axis: CrosshairAxis;
    lineColor: string;
    lineWidth: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `visible` | `boolean` |  |
| `axis` | `CrosshairAxis` |  |
| `lineColor` | `string` |  |
| `lineWidth` | `number` |  |
---

### ChartTooltipOptions `interface`

Fully resolved chart tooltip options.

```ts
interface ChartTooltipOptions {
    visible: boolean;
    padding: PaddingInput;
    font: string;
    fontColor: string;
    backgroundColor: string;
    borderRadius: BorderRadiusInput;
    maxWidth: number;
    wrap: boolean;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `visible` | `boolean` |  |
| `padding` | `PaddingInput` |  |
| `font` | `string` |  |
| `fontColor` | `string` |  |
| `backgroundColor` | `string` |  |
| `borderRadius` | `BorderRadiusInput` |  |
| `maxWidth` | `number` |  |
| `wrap` | `boolean` |  |
---

### ChartLegendOptions `interface`

Fully resolved chart legend options.

```ts
interface ChartLegendOptions {
    visible: boolean;
    position: LegendPosition;
    padding: PaddingInput;
    font: string;
    fontColor: string;
    highlight: boolean;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `visible` | `boolean` |  |
| `position` | `LegendPosition` |  |
| `padding` | `PaddingInput` |  |
| `font` | `string` |  |
| `fontColor` | `string` |  |
| `highlight` | `boolean` |  |
---

### ChartAxisItemOptions `interface`

Options for a single axis (x or y).

```ts
interface ChartAxisItemOptions<TData = unknown> {
    visible: boolean;
    font: string;
    fontColor: string;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: keyof TData | ((item: TData) => any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format?: AxisFormatType | ((value: any) => string);
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `visible` | `boolean` |  |
| `font` | `string` |  |
| `fontColor` | `string` |  |
| `title?` | `string \| undefined` |  |
| `value?` | `keyof TData \| ((item: TData) =&gt; any) \| undefined` |  |
| `format?` | `AxisFormatType \| ((value: any) =&gt; string) \| undefined` |  |
---

### ChartYAxisItemOptions `interface`

Y-axis specific options extending the base axis item with a left/right position.

```ts
interface ChartYAxisItemOptions<TData = unknown> extends ChartAxisItemOptions<TData> {
    position: 'left' | 'right';
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `position` | `"left" \| "right"` |  |
| `visible` | `boolean` |  |
| `font` | `string` |  |
| `fontColor` | `string` |  |
| `title?` | `string \| undefined` |  |
| `value?` | `keyof TData \| ((item: TData) =&gt; any) \| undefined` |  |
| `format?` | `AxisFormatType \| ((value: any) =&gt; string) \| undefined` |  |
---

### ChartAxisOptions `interface`

Combined x and y axis configuration.

```ts
interface ChartAxisOptions<TData = unknown> {
    x?: boolean | Partial<ChartAxisItemOptions<TData>>;
    y?: boolean | Partial<ChartYAxisItemOptions<TData>> | Partial<ChartYAxisItemOptions<TData>>[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x?` | `boolean \| Partial&lt;ChartAxisItemOptions&lt;TData&gt;&gt; \| undefined` |  |
| `y?` | `boolean \| Partial&lt;ChartYAxisItemOptions&lt;TData&gt;&gt; \| Partial&lt;ChartYAxisItemOptions&lt;TData&gt;&gt;[] \| undefined` |  |
---

### ChartOptions `type`

```ts
type ChartOptions<TOptions> = TOptions;
```

---

### EaseName `type`

Named easing function identifiers.

```ts
type EaseName =
    | 'easeLinear'
    | 'easeInQuad'
    | 'easeOutQuad'
    | 'easeInOutQuad'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic'
    | 'easeInQuart'
    | 'easeOutQuart'
    | 'easeInOutQuart'
    | 'easeInQuint'
    | 'easeOutQuint'
    | 'easeInOutQuint';
```

---

### PaddingInput `type`

Padding expressed as a uniform number or a [top, right, bottom, left] tuple.

```ts
type PaddingInput = number | [number, number, number, number];
```

---

### TitlePosition `type`

Position of the chart title relative to the chart area.

```ts
type TitlePosition = 'top' | 'bottom' | 'left' | 'right';
```

---

### ChartTitleInput `type`

Title input accepting a plain string or partial options object.

```ts
type ChartTitleInput = string | Partial<ChartTitleOptions>;
```

---

### ChartAnimationInput `type`

Animation input accepting a boolean toggle or partial options object.

```ts
type ChartAnimationInput = boolean | Partial<ChartAnimationOptions>;
```

---

### ChartGridInput `type`

Grid input accepting a boolean toggle or partial options object.

```ts
type ChartGridInput = boolean | Partial<ChartGridOptions>;
```

---

### CrosshairAxis `type`

Which axis the crosshair tracks.

```ts
type CrosshairAxis = 'x' | 'y' | 'both';
```

---

### ChartCrosshairInput `type`

Crosshair input accepting a boolean toggle or partial options object.

```ts
type ChartCrosshairInput = boolean | Partial<ChartCrosshairOptions>;
```

---

### BorderRadiusInput `type`

Border radius expressed as a uniform number or a per-corner tuple.

```ts
type BorderRadiusInput = number | [number, number, number, number];
```

---

### ChartTooltipInput `type`

Tooltip input accepting a boolean toggle or partial options object.

```ts
type ChartTooltipInput = boolean | Partial<ChartTooltipOptions>;
```

---

### LegendPosition `type`

Position of the chart legend relative to the chart area.

```ts
type LegendPosition = 'top' | 'bottom' | 'left' | 'right';
```

---

### ChartLegendInput `type`

Legend input accepting a boolean, position string, or partial options object.

```ts
type ChartLegendInput = boolean | LegendPosition | Partial<ChartLegendOptions>;
```

---

### AxisFormatType `type`

Built-in axis label format types.

```ts
type AxisFormatType = 'number' | 'percentage' | 'date' | 'string';
```

---

### ChartAxisInput `type`

Axis input accepting a boolean toggle or a full axis options object.

```ts
type ChartAxisInput<TData = unknown> = boolean | ChartAxisOptions<TData>;
```

---

### resolveEase `function`

Resolves an ease name or function to an `Ease` function, defaulting to `easeOutCubic`.

```ts
function resolveEase(value?: EaseName | Ease): Ease;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `Ease \| EaseName \| undefined` |  |

**Returns:** `Ease`

---

### normalizePadding `function`

Normalizes a padding input into a `Padding` object, or returns `undefined` if no input.

```ts
function normalizePadding(value?: PaddingInput): Padding | undefined;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `PaddingInput \| undefined` |  |

**Returns:** `Padding \| undefined`

---

### normalizeTitle `function`

Normalizes a title input into fully resolved `ChartTitleOptions`.

```ts
function normalizeTitle(input?: ChartTitleInput): ChartTitleOptions | undefined;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `ChartTitleInput \| undefined` |  |

**Returns:** `ChartTitleOptions \| undefined`

---

### normalizeAnimation `function`

Normalizes animation input into fully resolved `ChartAnimationOptions`.

```ts
function normalizeAnimation(input?: ChartAnimationInput, defaults?: Partial<ChartAnimationOptions>): ChartAnimationOptions;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `ChartAnimationInput \| undefined` |  |
| `defaults` | `Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |

**Returns:** `ChartAnimationOptions`

---

### normalizeGrid `function`

Normalizes grid input into fully resolved `ChartGridOptions`.

```ts
function normalizeGrid(input?: ChartGridInput, defaults?: Partial<ChartGridOptions>): ChartGridOptions;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `ChartGridInput \| undefined` |  |
| `defaults` | `Partial&lt;ChartGridOptions&gt; \| undefined` |  |

**Returns:** `ChartGridOptions`

---

### normalizeCrosshair `function`

Normalizes crosshair input into fully resolved `ChartCrosshairOptions`.

```ts
function normalizeCrosshair(input?: ChartCrosshairInput, defaults?: Partial<ChartCrosshairOptions>): ChartCrosshairOptions;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `ChartCrosshairInput \| undefined` |  |
| `defaults` | `Partial&lt;ChartCrosshairOptions&gt; \| undefined` |  |

**Returns:** `ChartCrosshairOptions`

---

### normalizeTooltip `function`

Normalizes tooltip input into fully resolved `ChartTooltipOptions`.

```ts
function normalizeTooltip(input?: ChartTooltipInput, defaults?: Partial<ChartTooltipOptions>): ChartTooltipOptions;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `ChartTooltipInput \| undefined` |  |
| `defaults` | `Partial&lt;ChartTooltipOptions&gt; \| undefined` |  |

**Returns:** `ChartTooltipOptions`

---

### normalizeLegend `function`

Normalizes legend input into fully resolved `ChartLegendOptions`.

```ts
function normalizeLegend(input?: ChartLegendInput, defaults?: Partial<ChartLegendOptions>): ChartLegendOptions;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `ChartLegendInput \| undefined` |  |
| `defaults` | `Partial&lt;ChartLegendOptions&gt; \| undefined` |  |

**Returns:** `ChartLegendOptions`

---

### normalizeAxisItem `function`

Normalizes a single axis item input into fully resolved options.

```ts
function normalizeAxisItem<TData = unknown>(
    input?: boolean | Partial<ChartAxisItemOptions<TData>>,
    defaults?: Partial<ChartAxisItemOptions<TData>>
): ChartAxisItemOptions<TData>;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `boolean \| Partial&lt;ChartAxisItemOptions&lt;TData&gt;&gt; \| undefined` |  |
| `defaults` | `Partial&lt;ChartAxisItemOptions&lt;TData&gt;&gt; \| undefined` |  |

**Returns:** `ChartAxisItemOptions&lt;TData&gt;`

---

### normalizeYAxisItem `function`

Normalizes a Y-axis item input into fully resolved options with position.

```ts
function normalizeYAxisItem<TData = unknown>(
    input?: boolean | Partial<ChartYAxisItemOptions<TData>>,
    defaults?: Partial<ChartYAxisItemOptions<TData>>
): ChartYAxisItemOptions<TData>;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `boolean \| Partial&lt;ChartYAxisItemOptions&lt;TData&gt;&gt; \| undefined` |  |
| `defaults` | `Partial&lt;ChartYAxisItemOptions&lt;TData&gt;&gt; \| undefined` |  |

**Returns:** `ChartYAxisItemOptions&lt;TData&gt;`

---

### normalizeAxis `function`

Normalizes axis input into a full `ChartAxisOptions` object with both x and y.

```ts
function normalizeAxis<TData = unknown>(input?: ChartAxisInput<TData>): ChartAxisOptions<TData>;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |

**Returns:** `ChartAxisOptions&lt;TData&gt;`

---

### resolveFormatLabel `function`

Resolves an axis format type or custom formatter into a label formatting function.

```ts
function resolveFormatLabel(format?: AxisFormatType | ((value: any) => string)): ((value: any) => string) | undefined;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `format` | `AxisFormatType \| ((value: any) =&gt; string) \| undefined` |  |

**Returns:** `((value: any) =&gt; string) \| undefined`

---

