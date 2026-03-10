---
outline: "deep"
---

# Chart Elements

<p class="api-package-badge"><code>@ripl/charts</code></p>

Specialized rendering elements for charts (Ribbon, SankeyLink).

## Overview

**Classes:** [`Ribbon`](#ribbon) · [`SankeyLinkPath`](#sankeylinkpath)

**Interfaces:** [`RibbonState`](#ribbonstate) · [`SankeyLinkState`](#sankeylinkstate)

**Functions:** [`createRibbon`](#createribbon) · [`elementIsRibbon`](#elementisribbon) · [`createSankeyLink`](#createsankeylink) · [`elementIsSankeyLink`](#elementissankeylink)

### Ribbon `class`

A chord diagram ribbon connecting two arc segments with quadratic Bézier curves through the center.

```ts
class Ribbon extends Shape2D<RibbonState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;RibbonState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |
| `sourceStart` | `number` |  |
| `sourceEnd` | `number` |  |
| `targetStart` | `number` |  |
| `targetEnd` | `number` |  |
| `autoStroke` | `boolean` |  |
| `autoFill` | `boolean` |  |
| `clip` | `boolean` |  |
| `id` | `string` |  |
| `readonly type` | `string` |  |
| `readonly classList` | `Set&lt;string&gt;` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `ElementPointerEvents` |  |
| `parent` | `Group&lt;ElementEventMap&gt; \| undefined` |  |
| `data` | `unknown` |  |
| `renderDepth` | `number \| undefined` |  |
| `direction` | `Direction \| undefined` |  |
| `fill` | `string \| undefined` |  |
| `filter` | `string \| undefined` |  |
| `font` | `string \| undefined` |  |
| `opacity` | `number \| undefined` |  |
| `globalCompositeOperation` | `unknown` |  |
| `lineCap` | `LineCap \| undefined` |  |
| `lineDash` | `number[] \| undefined` |  |
| `lineDashOffset` | `number \| undefined` |  |
| `lineJoin` | `LineJoin \| undefined` |  |
| `lineWidth` | `number \| undefined` |  |
| `miterLimit` | `number \| undefined` |  |
| `shadowBlur` | `number \| undefined` |  |
| `shadowColor` | `string \| undefined` |  |
| `shadowOffsetX` | `number \| undefined` |  |
| `shadowOffsetY` | `number \| undefined` |  |
| `stroke` | `string \| undefined` |  |
| `textAlign` | `TextAlignment \| undefined` |  |
| `textBaseline` | `TextBaseline \| undefined` |  |
| `zIndex` | `number` |  |
| `translateX` | `number \| undefined` |  |
| `translateY` | `number \| undefined` |  |
| `transformScaleX` | `number \| undefined` |  |
| `transformScaleY` | `number \| undefined` |  |
| `rotation` | `Rotation \| undefined` |  |
| `transformOriginX` | `TransformOrigin \| undefined` |  |
| `transformOriginY` | `TransformOrigin \| undefined` |  |

**Methods:**

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `render(context: Context&lt;Element&gt;): void`

Renders this shape by creating a path, invoking the callback, and automatically applying fill/stroke or clipping.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;Element&gt;` |  |

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this shape using path-based fill and stroke hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `on(event: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;RibbonState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;RibbonState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;RibbonState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;RibbonState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;RibbonState&gt;&gt;` |  |

#### `destroy(): void`

Emits a `destroyed` event, clears all listeners, and disposes retained resources.

#### `has(type: keyof ElementEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof ElementEventMap` |  |

#### `off(type: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### SankeyLinkPath `class`

A curved Sankey link shape rendered as a cubic Bézier curve between source and target points.

```ts
class SankeyLinkPath extends Shape2D<SankeyLinkState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;SankeyLinkState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `sx` | `number` |  |
| `sy` | `number` |  |
| `tx` | `number` |  |
| `ty` | `number` |  |
| `autoStroke` | `boolean` |  |
| `autoFill` | `boolean` |  |
| `clip` | `boolean` |  |
| `id` | `string` |  |
| `readonly type` | `string` |  |
| `readonly classList` | `Set&lt;string&gt;` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `ElementPointerEvents` |  |
| `parent` | `Group&lt;ElementEventMap&gt; \| undefined` |  |
| `data` | `unknown` |  |
| `renderDepth` | `number \| undefined` |  |
| `direction` | `Direction \| undefined` |  |
| `fill` | `string \| undefined` |  |
| `filter` | `string \| undefined` |  |
| `font` | `string \| undefined` |  |
| `opacity` | `number \| undefined` |  |
| `globalCompositeOperation` | `unknown` |  |
| `lineCap` | `LineCap \| undefined` |  |
| `lineDash` | `number[] \| undefined` |  |
| `lineDashOffset` | `number \| undefined` |  |
| `lineJoin` | `LineJoin \| undefined` |  |
| `lineWidth` | `number \| undefined` |  |
| `miterLimit` | `number \| undefined` |  |
| `shadowBlur` | `number \| undefined` |  |
| `shadowColor` | `string \| undefined` |  |
| `shadowOffsetX` | `number \| undefined` |  |
| `shadowOffsetY` | `number \| undefined` |  |
| `stroke` | `string \| undefined` |  |
| `textAlign` | `TextAlignment \| undefined` |  |
| `textBaseline` | `TextBaseline \| undefined` |  |
| `zIndex` | `number` |  |
| `translateX` | `number \| undefined` |  |
| `translateY` | `number \| undefined` |  |
| `transformScaleX` | `number \| undefined` |  |
| `transformScaleY` | `number \| undefined` |  |
| `rotation` | `Rotation \| undefined` |  |
| `transformOriginX` | `TransformOrigin \| undefined` |  |
| `transformOriginY` | `TransformOrigin \| undefined` |  |

**Methods:**

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `render(context: Context&lt;Element&gt;): void`

Renders this shape by creating a path, invoking the callback, and automatically applying fill/stroke or clipping.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;Element&gt;` |  |

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this shape using path-based fill and stroke hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `on(event: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;SankeyLinkState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;SankeyLinkState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;SankeyLinkState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;SankeyLinkState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;SankeyLinkState&gt;&gt;` |  |

#### `destroy(): void`

Emits a `destroyed` event, clears all listeners, and disposes retained resources.

#### `has(type: keyof ElementEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof ElementEventMap` |  |

#### `off(type: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### RibbonState `interface`

State interface for a ribbon shape connecting two arc segments via quadratic curves.

```ts
interface RibbonState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
    sourceStart: number;
    sourceEnd: number;
    targetStart: number;
    targetEnd: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |
| `sourceStart` | `number` |  |
| `sourceEnd` | `number` |  |
| `targetStart` | `number` |  |
| `targetEnd` | `number` |  |
| `fill?` | `string \| undefined` |  |
| `filter?` | `string \| undefined` |  |
| `direction?` | `Direction \| undefined` |  |
| `font?` | `string \| undefined` |  |
| `fontKerning?` | `FontKerning \| undefined` |  |
| `opacity?` | `number \| undefined` |  |
| `globalCompositeOperation?` | `unknown` |  |
| `lineCap?` | `LineCap \| undefined` |  |
| `lineDash?` | `number[] \| undefined` |  |
| `lineDashOffset?` | `number \| undefined` |  |
| `lineJoin?` | `LineJoin \| undefined` |  |
| `lineWidth?` | `number \| undefined` |  |
| `miterLimit?` | `number \| undefined` |  |
| `shadowBlur?` | `number \| undefined` |  |
| `shadowColor?` | `string \| undefined` |  |
| `shadowOffsetX?` | `number \| undefined` |  |
| `shadowOffsetY?` | `number \| undefined` |  |
| `stroke?` | `string \| undefined` |  |
| `textAlign?` | `TextAlignment \| undefined` |  |
| `textBaseline?` | `TextBaseline \| undefined` |  |
| `zIndex?` | `number \| undefined` |  |
| `translateX?` | `number \| undefined` |  |
| `translateY?` | `number \| undefined` |  |
| `transformScaleX?` | `number \| undefined` |  |
| `transformScaleY?` | `number \| undefined` |  |
| `rotation?` | `Rotation \| undefined` |  |
| `transformOriginX?` | `TransformOrigin \| undefined` |  |
| `transformOriginY?` | `TransformOrigin \| undefined` |  |
---

### SankeyLinkState `interface`

State interface for a Sankey link, defining source and target endpoint coordinates.

```ts
interface SankeyLinkState extends BaseElementState {
    sx: number;
    sy: number;
    tx: number;
    ty: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `sx` | `number` |  |
| `sy` | `number` |  |
| `tx` | `number` |  |
| `ty` | `number` |  |
| `fill?` | `string \| undefined` |  |
| `filter?` | `string \| undefined` |  |
| `direction?` | `Direction \| undefined` |  |
| `font?` | `string \| undefined` |  |
| `fontKerning?` | `FontKerning \| undefined` |  |
| `opacity?` | `number \| undefined` |  |
| `globalCompositeOperation?` | `unknown` |  |
| `lineCap?` | `LineCap \| undefined` |  |
| `lineDash?` | `number[] \| undefined` |  |
| `lineDashOffset?` | `number \| undefined` |  |
| `lineJoin?` | `LineJoin \| undefined` |  |
| `lineWidth?` | `number \| undefined` |  |
| `miterLimit?` | `number \| undefined` |  |
| `shadowBlur?` | `number \| undefined` |  |
| `shadowColor?` | `string \| undefined` |  |
| `shadowOffsetX?` | `number \| undefined` |  |
| `shadowOffsetY?` | `number \| undefined` |  |
| `stroke?` | `string \| undefined` |  |
| `textAlign?` | `TextAlignment \| undefined` |  |
| `textBaseline?` | `TextBaseline \| undefined` |  |
| `zIndex?` | `number \| undefined` |  |
| `translateX?` | `number \| undefined` |  |
| `translateY?` | `number \| undefined` |  |
| `transformScaleX?` | `number \| undefined` |  |
| `transformScaleY?` | `number \| undefined` |  |
| `rotation?` | `Rotation \| undefined` |  |
| `transformOriginX?` | `TransformOrigin \| undefined` |  |
| `transformOriginY?` | `TransformOrigin \| undefined` |  |
---

### createRibbon `function`

Factory function that creates a new `Ribbon` instance.

```ts
function createRibbon(...options: ConstructorParameters<typeof Ribbon>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;RibbonState&gt;]` |  |

**Returns:** `Ribbon`

---

### elementIsRibbon `function`

Type guard that checks whether a value is a `Ribbon` instance.

```ts
function elementIsRibbon(value: unknown): value is Ribbon
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createSankeyLink `function`

Factory function that creates a new `SankeyLinkPath` instance.

```ts
function createSankeyLink(...options: ConstructorParameters<typeof SankeyLinkPath>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;SankeyLinkState&gt;]` |  |

**Returns:** `SankeyLinkPath`

---

### elementIsSankeyLink `function`

Type guard that checks whether a value is a `SankeyLinkPath` instance.

```ts
function elementIsSankeyLink(value: unknown): value is SankeyLinkPath
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

