---
outline: "deep"
---

# Scales

<p class="api-package-badge"><code>@ripl/core</code></p>

Data-to-visual mapping functions: continuous, band, logarithmic, and more.

## Overview

**Interfaces:** [`ScaleBindingOptions`](#scalebindingoptions) · [`LinearScaleOptions`](#linearscaleoptions) · [`BandScale`](#bandscale) · [`DivergingScaleOptions`](#divergingscaleoptions) · [`LogarithmicScaleOptions`](#logarithmicscaleoptions) · [`PowerScaleOptions`](#powerscaleoptions) · [`Scale`](#scale)

**Type Aliases:** [`BandScaleOptions`](#bandscaleoptions) · [`ScaleMethod`](#scalemethod)

**Functions:** [`padDomain`](#paddomain) · [`createScale`](#createscale) · [`getLinearScaleMethod`](#getlinearscalemethod) · [`createNumericIncludesMethod`](#createnumericincludesmethod) · [`getLinearTicks`](#getlinearticks) · [`scaleBand`](#scaleband) · [`scaleContinuous`](#scalecontinuous) · [`scaleDiscrete`](#scalediscrete) · [`scaleDiverging`](#scalediverging) · [`scaleLogarithmic`](#scalelogarithmic) · [`scaleLog`](#scalelog) · [`scalePower`](#scalepower) · [`scaleQuantile`](#scalequantile) · [`scaleQuantize`](#scalequantize) · [`scaleThreshold`](#scalethreshold) · [`scaleTime`](#scaletime)

**Constants:** [`scaleSqrt`](#scalesqrt)

### ScaleBindingOptions `interface`

Low-level options for constructing a scale, providing conversion, inversion, inclusion, and tick generation callbacks.

```ts
interface ScaleBindingOptions<TDomain, TRange> {
    readonly domain: TDomain[];
    readonly range: TRange[];
    convert: ScaleMethod<TDomain, TRange>;
    invert: ScaleMethod<TRange, TDomain>;
    includes?(value: TDomain): boolean;
    ticks?(count?: number): TDomain[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `domain` | `TDomain[]` |  |
| `range` | `TRange[]` |  |
| `convert` | `ScaleMethod&lt;TDomain, TRange&gt;` |  |
| `invert` | `ScaleMethod&lt;TRange, TDomain&gt;` |  |
| `includes?` | `((value: TDomain) =&gt; boolean) \| undefined` |  |
| `ticks?` | `((count?: number) =&gt; TDomain[]) \| undefined` |  |
---

### LinearScaleOptions `interface`

Options shared by linear-based scales (continuous, logarithmic, power, etc.).

```ts
interface LinearScaleOptions {
    clamp?: boolean;
    padToTicks?: boolean | number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `clamp?` | `boolean \| undefined` |  |
| `padToTicks?` | `number \| boolean \| undefined` |  |
---

### BandScale `interface`

A band scale that divides a continuous range into uniform bands for categorical data, exposing bandwidth and step.

```ts
interface BandScale<TDomain = string> extends Scale<TDomain, number> {
    bandwidth: number;
    step: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `bandwidth` | `number` |  |
| `step` | `number` |  |
| `domain` | `TDomain[]` |  |
| `range` | `number[]` |  |
| `inverse` | `ScaleMethod&lt;number, TDomain&gt;` |  |
| `ticks` | `(count?: number) =&gt; TDomain[]` |  |
| `includes` | `(value: TDomain) =&gt; boolean` |  |
---

### DivergingScaleOptions `interface`

Options for a diverging scale, adding a midpoint to the base linear scale options.

```ts
interface DivergingScaleOptions extends LinearScaleOptions {
    midpoint?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `midpoint?` | `number \| undefined` |  |
| `clamp?` | `boolean \| undefined` |  |
| `padToTicks?` | `number \| boolean \| undefined` |  |
---

### LogarithmicScaleOptions `interface`

Options for a logarithmic scale, adding a configurable base to the base linear scale options.

```ts
interface LogarithmicScaleOptions extends LinearScaleOptions {
    base?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `base?` | `number \| undefined` |  |
| `clamp?` | `boolean \| undefined` |  |
| `padToTicks?` | `number \| boolean \| undefined` |  |
---

### PowerScaleOptions `interface`

Options for a power scale, adding a configurable exponent to the base linear scale options.

```ts
interface PowerScaleOptions extends LinearScaleOptions {
    exponent?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `exponent?` | `number \| undefined` |  |
| `clamp?` | `boolean \| undefined` |  |
| `padToTicks?` | `number \| boolean \| undefined` |  |
---

### Scale `interface`

A callable scale with domain, range, inverse mapping, tick generation, and inclusion testing.

```ts
interface Scale<TDomain = number, TRange = number> {
    (value: TDomain): TRange;
    domain: TDomain[];
    range: TRange[];
    inverse: ScaleMethod<TRange, TDomain>;
    ticks(count?: number): TDomain[];
    includes(value: TDomain): boolean;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `domain` | `TDomain[]` |  |
| `range` | `TRange[]` |  |
| `inverse` | `ScaleMethod&lt;TRange, TDomain&gt;` |  |
| `ticks` | `(count?: number) =&gt; TDomain[]` |  |
| `includes` | `(value: TDomain) =&gt; boolean` |  |
---

### BandScaleOptions `type`

```ts
type BandScaleOptions = {
    innerPadding?: number;
    outerPadding?: number;
    alignment?: number;
    round?: boolean;
};
```

---

### ScaleMethod `type`

A function that maps a value from one space to another.

```ts
type ScaleMethod<TInput = number, TOutput = number> = (value: TInput) => TOutput;
```

---

### padDomain `function`

Expands a numeric domain to "nice" tick-aligned boundaries and returns `[min, max, step]`.

```ts
function padDomain(domain: number[], count: number = 10)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `count` | `number` |  |

**Returns:** `number[]`

---

### createScale `function`

Assembles a `Scale` object from explicit conversion, inversion, and tick functions.

```ts
function createScale<TDomain = number, TRange = number>(options: ScaleBindingOptions<TDomain, TRange>): Scale<TDomain, TRange>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `ScaleBindingOptions&lt;TDomain, TRange&gt;` |  |

**Returns:** `Scale&lt;TDomain, TRange&gt;`

---

### getLinearScaleMethod `function`

Creates a linear mapping function from a numeric domain to a numeric range, with optional clamping and tick-padding.

```ts
function getLinearScaleMethod(domain: number[], range: number[], options?: LinearScaleOptions): ScaleMethod
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `number[]` |  |
| `options` | `LinearScaleOptions \| undefined` |  |

**Returns:** `ScaleMethod`

---

### createNumericIncludesMethod `function`

Creates an `includes` predicate that tests whether a value falls within the numeric domain.

```ts
function createNumericIncludesMethod(domain: number[])
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |

**Returns:** `(value: number) =&gt; boolean`

---

### getLinearTicks `function`

Generates an array of evenly spaced, "nice" tick values across the domain.

```ts
function getLinearTicks(domain: number[], count: number = 10)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `count` | `number` |  |

**Returns:** `number[]`

---

### scaleBand `function`

Creates a band scale that maps discrete domain values to evenly spaced bands within the range.

```ts
function scaleBand<TDomain = string>(
    domain: TDomain[],
    range: number[],
    options?: BandScaleOptions
): BandScale<TDomain>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `TDomain[]` |  |
| `range` | `number[]` |  |
| `options` | `BandScaleOptions \| undefined` |  |

**Returns:** `BandScale&lt;TDomain&gt;`

---

### scaleContinuous `function`

Creates a continuous linear scale that maps a numeric domain to a numeric range.

```ts
function scaleContinuous(
    domain: number[],
    range: number[],
    options?: LinearScaleOptions
): Scale<number>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `number[]` |  |
| `options` | `LinearScaleOptions \| undefined` |  |

**Returns:** `Scale&lt;number, number&gt;`

---

### scaleDiscrete `function`

Creates a discrete (ordinal) scale that maps domain values to corresponding range values by index.

```ts
function scaleDiscrete<TDomain>(
    domain: TDomain[],
    range: number[]
): Scale<TDomain>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `TDomain[]` |  |
| `range` | `number[]` |  |

**Returns:** `Scale&lt;TDomain, number&gt;`

---

### scaleDiverging `function`

Creates a diverging scale that maps values below and above a midpoint to separate sub-ranges.

```ts
function scaleDiverging(
    domain: number[],
    range: number[],
    options?: DivergingScaleOptions
): Scale<number>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `number[]` |  |
| `options` | `DivergingScaleOptions \| undefined` |  |

**Returns:** `Scale&lt;number, number&gt;`

---

### scaleLogarithmic `function`

Creates a logarithmic scale that maps a numeric domain to a range using a log transformation.

```ts
function scaleLogarithmic(
    domain: number[],
    range: number[],
    options?: LogarithmicScaleOptions
): Scale<number>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `number[]` |  |
| `options` | `LogarithmicScaleOptions \| undefined` |  |

**Returns:** `Scale&lt;number, number&gt;`

---

### scaleLog `function`

```ts
function scaleLog(
    domain: number[],
    range: number[],
    options?: LinearScaleOptions
): Scale<number>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `number[]` |  |
| `options` | `LinearScaleOptions \| undefined` |  |

**Returns:** `Scale&lt;number, number&gt;`

---

### scalePower `function`

Creates a power scale that maps a numeric domain to a range using an exponential transformation.

```ts
function scalePower(
    domain: number[],
    range: number[],
    options?: PowerScaleOptions
): Scale<number>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `number[]` |  |
| `options` | `PowerScaleOptions \| undefined` |  |

**Returns:** `Scale&lt;number, number&gt;`

---

### scaleQuantile `function`

Creates a quantile scale that divides a sorted numeric domain into quantiles mapped to discrete range values.

```ts
function scaleQuantile<TRange>(
    domain: number[],
    range: TRange[]
): Scale<number, TRange>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `TRange[]` |  |

**Returns:** `Scale&lt;number, TRange&gt;`

---

### scaleQuantize `function`

Creates a quantize scale that divides a continuous numeric domain into uniform segments mapped to discrete range values.

```ts
function scaleQuantize<TRange>(
    domain: number[],
    range: TRange[]
): Scale<number, TRange>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `TRange[]` |  |

**Returns:** `Scale&lt;number, TRange&gt;`

---

### scaleThreshold `function`

Creates a threshold scale that maps numeric values to range values based on a set of threshold breakpoints.

```ts
function scaleThreshold<TRange>(
    domain: number[],
    range: TRange[]
): Scale<number, TRange>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `number[]` |  |
| `range` | `TRange[]` |  |

**Returns:** `Scale&lt;number, TRange&gt;`

---

### scaleTime `function`

Creates a time scale that maps a `Date` domain to a numeric range using linear interpolation of timestamps.

```ts
function scaleTime(
    domain: Date[],
    range: number[],
    options?: LinearScaleOptions
): Scale<Date, number>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `domain` | `Date[]` |  |
| `range` | `number[]` |  |
| `options` | `LinearScaleOptions \| undefined` |  |

**Returns:** `Scale&lt;Date, number&gt;`

---

### scaleSqrt `const`

Shortcut for a power scale with exponent 0.5 (square root).

```ts
const scaleSqrt: (domain: number[], range: number[], options?: LinearScaleOptions) => Scale<number>
```

---

