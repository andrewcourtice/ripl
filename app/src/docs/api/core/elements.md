---
outline: "deep"
---

# Elements

<p class="api-package-badge"><code>@ripl/core</code></p>

Built-in shape elements for 2D rendering.

## Overview

**Classes:** [`Arc`](#arc) · [`Circle`](#circle) · [`Ellipse`](#ellipse) · [`ImageElement`](#imageelement) · [`Line`](#line) · [`Path`](#path) · [`Polygon`](#polygon) · [`Polyline`](#polyline) · [`Rect`](#rect) · [`Text`](#text)

**Interfaces:** [`ArcState`](#arcstate) · [`CircleState`](#circlestate) · [`EllipseState`](#ellipsestate) · [`ImageState`](#imagestate) · [`LineState`](#linestate) · [`PathState`](#pathstate) · [`PolygonState`](#polygonstate) · [`PolylineState`](#polylinestate) · [`RectState`](#rectstate) · [`TextState`](#textstate)

**Type Aliases:** [`PathRenderer`](#pathrenderer) · [`PolylineRenderer`](#polylinerenderer) · [`PolylineRenderFunc`](#polylinerenderfunc)

**Functions:** [`createArc`](#createarc) · [`elementIsArc`](#elementisarc) · [`createCircle`](#createcircle) · [`elementIsCircle`](#elementiscircle) · [`createEllipse`](#createellipse) · [`elementIsEllipse`](#elementisellipse) · [`createImage`](#createimage) · [`elementIsImage`](#elementisimage) · [`createLine`](#createline) · [`elementIsLine`](#elementisline) · [`createPath`](#createpath) · [`elementIsPath`](#elementispath) · [`createPolygon`](#createpolygon) · [`elementIsPolygon`](#elementispolygon) · [`polylineLinearRenderer`](#polylinelinearrenderer) · [`polylineSplineRenderer`](#polylinesplinerenderer) · [`polylineBasisRenderer`](#polylinebasisrenderer) · [`polylineBumpXRenderer`](#polylinebumpxrenderer) · [`polylineBumpYRenderer`](#polylinebumpyrenderer) · [`polylineCardinalRenderer`](#polylinecardinalrenderer) · [`polylineCatmullRomRenderer`](#polylinecatmullromrenderer) · [`polylineMonotoneXRenderer`](#polylinemonotonexrenderer) · [`polylineMonotoneYRenderer`](#polylinemonotoneyrenderer) · [`polylineNaturalRenderer`](#polylinenaturalrenderer) · [`polylineStepRenderer`](#polylinesteprenderer) · [`polylineStepBeforeRenderer`](#polylinestepbeforerenderer) · [`polylineStepAfterRenderer`](#polylinestepafterrenderer) · [`createPolyline`](#createpolyline) · [`elementIsPolyline`](#elementispolyline) · [`createRect`](#createrect) · [`elementIsRect`](#elementisrect) · [`createText`](#createtext) · [`elementIsText`](#elementistext)

**Constants:** [`interpolateImage`](#interpolateimage)

### Arc `class`

An arc or annular sector shape supporting inner radius and pad angle.

```ts
class Arc extends Shape2D<ArcState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;ArcState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `startAngle` | `number` |  |
| `endAngle` | `number` |  |
| `radius` | `number` |  |
| `innerRadius` | `number \| undefined` |  |
| `padAngle` | `number \| undefined` |  |
| `borderRadius` | `number \| undefined` |  |
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

#### `getCentroid(alterations: Partial&lt;ArcState&gt; \| undefined): Point`

Computes the centroid point of this arc, optionally with state overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `alterations` | `Partial&lt;ArcState&gt; \| undefined` |  |

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

#### `clone(): Element&lt;ArcState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;ArcState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;ArcState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;ArcState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;ArcState&gt;&gt;` |  |

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

### Circle `class`

A circle shape rendered at a center point with a given radius.

```ts
class Circle extends Shape2D<CircleState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;CircleState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |
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

#### `clone(): Element&lt;CircleState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;CircleState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;CircleState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;CircleState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;CircleState&gt;&gt;` |  |

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

### Ellipse `class`

An ellipse shape rendered at a center point with separate x/y radii, rotation, and angle range.

```ts
class Ellipse extends Shape2D<EllipseState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;EllipseState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radiusX` | `number` |  |
| `radiusY` | `number` |  |
| `rotation` | `number` |  |
| `startAngle` | `number` |  |
| `endAngle` | `number` |  |
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

#### `clone(): Element&lt;EllipseState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;EllipseState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;EllipseState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;EllipseState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;EllipseState&gt;&gt;` |  |

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

### ImageElement `class`

An image element that draws a `CanvasImageSource` at a given position and optional size.

```ts
class ImageElement extends Element<ImageState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `ElementOptions&lt;ImageState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `image` | `CanvasImageSource` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number \| undefined` |  |
| `height` | `number \| undefined` |  |
| `id` | `string` |  |
| `readonly type` | `string` |  |
| `readonly classList` | `Set&lt;string&gt;` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `ElementPointerEvents` |  |
| `parent` | `Group&lt;ElementEventMap&gt; \| undefined` |  |
| `data` | `unknown` |  |
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

#### `render(context: Context&lt;globalThis.Element&gt;): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;globalThis.Element&gt;` |  |

#### `on(event: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;ImageState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;ImageState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;ImageState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;ImageState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;ImageState&gt;&gt;` |  |

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

### Line `class`

A straight line segment between two points.

```ts
class Line extends Shape2D<LineState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;LineState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x1` | `number` |  |
| `y1` | `number` |  |
| `x2` | `number` |  |
| `y2` | `number` |  |
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

#### `clone(): Element&lt;LineState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;LineState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;LineState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;LineState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;LineState&gt;&gt;` |  |

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

### Path `class`

A general-purpose shape rendered by a user-supplied path renderer callback.

```ts
class Path extends Shape2D<PathState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `{ id?: string; class?: OneOrMore&lt;string&gt;; data?: unknown; pointerEvents?: ElementPointerEvents; } & PathState & { autoStroke?: boolean; autoFill?: boolean; clip?: boolean; } & { pathRenderer?: PathRenderer; }` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |
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

#### `setPathRenderer(renderer: PathRenderer): void`

Replaces the current path renderer callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `renderer` | `PathRenderer` |  |

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

#### `clone(): Element&lt;PathState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;PathState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;PathState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;PathState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;PathState&gt;&gt;` |  |

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

### Polygon `class`

A regular polygon shape with a configurable number of sides.

```ts
class Polygon extends Shape2D<PolygonState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;PolygonState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |
| `sides` | `number` |  |
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

#### `clone(): Element&lt;PolygonState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;PolygonState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;PolygonState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;PolygonState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;PolygonState&gt;&gt;` |  |

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

### Polyline `class`

A multi-point line shape supporting various curve interpolation algorithms.

```ts
class Polyline extends Shape2D<PolylineState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;PolylineState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `points` | `Point[]` |  |
| `renderer` | `PolylineRenderFunc \| PolylineRenderer \| undefined` |  |
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

#### `clone(): Element&lt;PolylineState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;PolylineState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;PolylineState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;PolylineState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;PolylineState&gt;&gt;` |  |

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

### Rect `class`

A rectangle shape with optional rounded corners via border radius.

```ts
class Rect extends Shape2D<RectState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Shape2DOptions&lt;RectState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |
| `borderRadius` | `number \| BorderRadius \| undefined` |  |
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

#### `clone(): Element&lt;RectState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;RectState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;RectState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;RectState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;RectState&gt;&gt;` |  |

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

### Text `class`

A text element that renders string or numeric content, with optional path-based text layout.

```ts
class Text extends Element<TextState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `ElementOptions&lt;TextState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `content` | `string \| number` |  |
| `pathData` | `string \| undefined` |  |
| `startOffset` | `number \| undefined` |  |
| `id` | `string` |  |
| `readonly type` | `string` |  |
| `readonly classList` | `Set&lt;string&gt;` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `ElementPointerEvents` |  |
| `parent` | `Group&lt;ElementEventMap&gt; \| undefined` |  |
| `data` | `unknown` |  |
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

#### `render(context: Context&lt;globalThis.Element&gt;): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;globalThis.Element&gt;` |  |

#### `on(event: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;TextState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;TextState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;TextState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;TextState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;TextState&gt;&gt;` |  |

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

### ArcState `interface`

State interface for an arc element, defining center, angles, radii, pad angle, and border radius.

```ts
interface ArcState extends BaseElementState {
    cx: number;
    cy: number;
    startAngle: number;
    endAngle: number;
    radius: number;
    innerRadius?: number;
    padAngle?: number;
    borderRadius?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `startAngle` | `number` |  |
| `endAngle` | `number` |  |
| `radius` | `number` |  |
| `innerRadius?` | `number \| undefined` |  |
| `padAngle?` | `number \| undefined` |  |
| `borderRadius?` | `number \| undefined` |  |
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

### CircleState `interface`

State interface for a circle element, defining center coordinates and radius.

```ts
interface CircleState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |
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

### EllipseState `interface`

State interface for an ellipse element, defining center, radii, rotation, and angle range.

```ts
interface EllipseState extends BaseElementState {
    cx: number;
    cy: number;
    radiusX: number;
    radiusY: number;
    rotation: number;
    startAngle: number;
    endAngle: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radiusX` | `number` |  |
| `radiusY` | `number` |  |
| `rotation` | `number` |  |
| `startAngle` | `number` |  |
| `endAngle` | `number` |  |
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
| `transformOriginX?` | `TransformOrigin \| undefined` |  |
| `transformOriginY?` | `TransformOrigin \| undefined` |  |
---

### ImageState `interface`

State interface for an image element, defining position, optional size, and image source.

```ts
interface ImageState extends BaseElementState {
    image: CanvasImageSource;
    x: number;
    y: number;
    width?: number;
    height?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `image` | `CanvasImageSource` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `width?` | `number \| undefined` |  |
| `height?` | `number \| undefined` |  |
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

### LineState `interface`

State interface for a line element, defining start and end coordinates.

```ts
interface LineState extends BaseElementState {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x1` | `number` |  |
| `y1` | `number` |  |
| `x2` | `number` |  |
| `y2` | `number` |  |
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

### PathState `interface`

State interface for a path element, defining bounding position and dimensions.

```ts
interface PathState extends BaseElementState {
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

### PolygonState `interface`

State interface for a regular polygon element, defining center, radius, and number of sides.

```ts
interface PolygonState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
    sides: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |
| `sides` | `number` |  |
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

### PolylineState `interface`

State interface for a polyline element, defining points and an optional curve renderer.

```ts
interface PolylineState extends BaseElementState {
    points: Point[];
    renderer?: PolylineRenderer | PolylineRenderFunc;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `points` | `Point[]` |  |
| `renderer?` | `PolylineRenderFunc \| PolylineRenderer \| undefined` |  |
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

### RectState `interface`

State interface for a rectangle element, defining position, dimensions, and optional border radius.

```ts
interface RectState extends BaseElementState {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number | BorderRadius;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |
| `borderRadius?` | `number \| BorderRadius \| undefined` |  |
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

### TextState `interface`

State interface for a text element, defining position, content, and optional path-based text layout.

```ts
interface TextState extends BaseElementState {
    x: number;
    y: number;
    content: string | number;
    pathData?: string;
    startOffset?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `content` | `string \| number` |  |
| `pathData?` | `string \| undefined` |  |
| `startOffset?` | `number \| undefined` |  |
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

### PathRenderer `type`

A callback that draws custom geometry onto a `ContextPath` using the element's state.

```ts
type PathRenderer = (path: ContextPath, state: PathState) => void;
```

---

### PolylineRenderer `type`

Built-in polyline curve interpolation algorithm names.

```ts
type PolylineRenderer = 'linear'
| 'spline'
| 'basis'
| 'bumpX'
| 'bumpY'
| 'cardinal'
| 'catmullRom'
| 'monotoneX'
| 'monotoneY'
| 'natural'
| 'step'
| 'stepBefore'
| 'stepAfter';
```

---

### PolylineRenderFunc `type`

A function that renders a polyline curve onto a path from an array of points.

```ts
type PolylineRenderFunc = (context: Context, path: ContextPath, points: Point[]) => void;
```

---

### createArc `function`

Factory function that creates a new `Arc` instance.

```ts
function createArc(...options: ConstructorParameters<typeof Arc>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;ArcState&gt;]` |  |

**Returns:** `Arc`

---

### elementIsArc `function`

Type guard that checks whether a value is an `Arc` instance.

```ts
function elementIsArc(value: unknown): value is Arc
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createCircle `function`

Factory function that creates a new `Circle` instance.

```ts
function createCircle(...options: ConstructorParameters<typeof Circle>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;CircleState&gt;]` |  |

**Returns:** `Circle`

---

### elementIsCircle `function`

Type guard that checks whether a value is a `Circle` instance.

```ts
function elementIsCircle(value: unknown): value is Circle
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createEllipse `function`

Factory function that creates a new `Ellipse` instance.

```ts
function createEllipse(...options: ConstructorParameters<typeof Ellipse>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;EllipseState&gt;]` |  |

**Returns:** `Ellipse`

---

### elementIsEllipse `function`

Type guard that checks whether a value is an `Ellipse` instance.

```ts
function elementIsEllipse(value: unknown): value is Ellipse
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createImage `function`

Factory function that creates a new `ImageElement` instance.

```ts
function createImage(...options: ConstructorParameters<typeof ImageElement>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: ElementOptions&lt;ImageState&gt;]` |  |

**Returns:** `ImageElement`

---

### elementIsImage `function`

Type guard that checks whether a value is an `ImageElement` instance.

```ts
function elementIsImage(value: unknown): value is ImageElement
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createLine `function`

Factory function that creates a new `Line` instance.

```ts
function createLine(...options: ConstructorParameters<typeof Line>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;LineState&gt;]` |  |

**Returns:** `Line`

---

### elementIsLine `function`

Type guard that checks whether a value is a `Line` instance.

```ts
function elementIsLine(value: unknown): value is Line
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createPath `function`

Factory function that creates a new `Path` instance.

```ts
function createPath(...options: ConstructorParameters<typeof Path>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: { id?: string; class?: OneOrMore&lt;string&gt;; data?: unknown; pointerEvents?: ElementPointerEvents; } & PathState & { autoStroke?: boolean; autoFill?: boolean; clip?: boolean; } & { pathRenderer?: PathRenderer; }]` |  |

**Returns:** `Path`

---

### elementIsPath `function`

Type guard that checks whether a value is a `Path` instance.

```ts
function elementIsPath(value: unknown): value is Path
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createPolygon `function`

Factory function that creates a new `Polygon` instance.

```ts
function createPolygon(...options: ConstructorParameters<typeof Polygon>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;PolygonState&gt;]` |  |

**Returns:** `Polygon`

---

### elementIsPolygon `function`

Type guard that checks whether a value is a `Polygon` instance.

```ts
function elementIsPolygon(value: unknown): value is Polygon
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### polylineLinearRenderer `function`

Creates a linear (straight segment) polyline renderer.

```ts
function polylineLinearRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineSplineRenderer `function`

Creates a spline polyline renderer with configurable tension.

```ts
function polylineSplineRenderer(tension: number = 0.5): PolylineRenderFunc
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `tension` | `number` |  |

**Returns:** `PolylineRenderFunc`

---

### polylineBasisRenderer `function`

Creates a cubic B-spline polyline renderer.

```ts
function polylineBasisRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineBumpXRenderer `function`

Creates a bump-X polyline renderer using horizontal midpoint bezier curves.

```ts
function polylineBumpXRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineBumpYRenderer `function`

Creates a bump-Y polyline renderer using vertical midpoint bezier curves.

```ts
function polylineBumpYRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineCardinalRenderer `function`

Creates a cardinal spline polyline renderer with configurable tension.

```ts
function polylineCardinalRenderer(tension: number = 0): PolylineRenderFunc
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `tension` | `number` |  |

**Returns:** `PolylineRenderFunc`

---

### polylineCatmullRomRenderer `function`

Creates a Catmull-Rom spline polyline renderer with configurable alpha.

```ts
function polylineCatmullRomRenderer(alpha: number = 0.5): PolylineRenderFunc
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `alpha` | `number` |  |

**Returns:** `PolylineRenderFunc`

---

### polylineMonotoneXRenderer `function`

Creates a monotone-X polyline renderer preserving monotonicity along the x-axis.

```ts
function polylineMonotoneXRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineMonotoneYRenderer `function`

Creates a monotone-Y polyline renderer preserving monotonicity along the y-axis.

```ts
function polylineMonotoneYRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineNaturalRenderer `function`

Creates a natural cubic spline polyline renderer with second-derivative continuity.

```ts
function polylineNaturalRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineStepRenderer `function`

Creates a step polyline renderer with midpoint horizontal transitions.

```ts
function polylineStepRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineStepBeforeRenderer `function`

Creates a step-before polyline renderer where the vertical transition occurs at the start of each segment.

```ts
function polylineStepBeforeRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### polylineStepAfterRenderer `function`

Creates a step-after polyline renderer where the vertical transition occurs at the end of each segment.

```ts
function polylineStepAfterRenderer(): PolylineRenderFunc
```

**Returns:** `PolylineRenderFunc`

---

### createPolyline `function`

Factory function that creates a new `Polyline` instance.

```ts
function createPolyline(...options: ConstructorParameters<typeof Polyline>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;PolylineState&gt;]` |  |

**Returns:** `Polyline`

---

### elementIsPolyline `function`

Type guard that checks whether a value is a `Polyline` instance.

```ts
function elementIsPolyline(value: unknown): value is Polyline
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createRect `function`

Factory function that creates a new `Rect` instance.

```ts
function createRect(...options: ConstructorParameters<typeof Rect>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Shape2DOptions&lt;RectState&gt;]` |  |

**Returns:** `Rect`

---

### elementIsRect `function`

Type guard that checks whether a value is a `Rect` instance.

```ts
function elementIsRect(value: unknown): value is Rect
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createText `function`

Factory function that creates a new `Text` instance.

```ts
function createText(...options: ConstructorParameters<typeof Text>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: ElementOptions&lt;TextState&gt;]` |  |

**Returns:** `Text`

---

### elementIsText `function`

Type guard that checks whether a value is a `Text` instance.

```ts
function elementIsText(value: unknown): value is Text
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### interpolateImage `const`

Interpolator factory that cross-fades between two image sources using an offscreen canvas.

```ts
const interpolateImage: InterpolatorFactory<CanvasImageSource>
```

---

