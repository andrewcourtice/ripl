---
outline: "deep"
---

# Context

<p class="api-package-badge"><code>@ripl/core</code></p>

Canvas rendering context and low-level drawing API.

## Overview

**Classes:** [`ContextPath`](#contextpath) · [`ContextText`](#contexttext) · [`Context`](#context) · [`CanvasPath`](#canvaspath) · [`CanvasContext`](#canvascontext)

**Interfaces:** [`RenderElementIntersectionOptions`](#renderelementintersectionoptions) · [`RenderElement`](#renderelement) · [`ContextEventMap`](#contexteventmap) · [`ContextOptions`](#contextoptions) · [`ContextElement`](#contextelement) · [`BaseState`](#basestate)

**Type Aliases:** [`Direction`](#direction) · [`FontKerning`](#fontkerning) · [`LineCap`](#linecap) · [`LineJoin`](#linejoin) · [`TextAlignment`](#textalignment) · [`TextBaseline`](#textbaseline) · [`FillRule`](#fillrule) · [`TransformOrigin`](#transformorigin) · [`Rotation`](#rotation) · [`RenderElementPointerEvents`](#renderelementpointerevents) · [`TextOptions`](#textoptions) · [`MeasureTextOptions`](#measuretextoptions)

**Functions:** [`resolveRotation`](#resolverotation) · [`resolveTransformOrigin`](#resolvetransformorigin) · [`measureText`](#measuretext) · [`typeIsContext`](#typeiscontext) · [`createContext`](#createcontext)

**Constants:** [`getRefContext`](#getrefcontext) · [`scaleDPR`](#scaledpr)

### ContextPath `class`

A virtual path element used to record drawing commands; subclassed by Canvas and SVG implementations.

```ts
class ContextPath implements ContextElement
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `id?` | `string` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `readonly id` | `string` |  |

**Methods:**

#### `arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise: boolean \| undefined): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `radius` | `number` |  |
| `startAngle` | `number` |  |
| `endAngle` | `number` |  |
| `counterclockwise` | `boolean \| undefined` |  |

#### `arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x1` | `number` |  |
| `y1` | `number` |  |
| `x2` | `number` |  |
| `y2` | `number` |  |
| `radius` | `number` |  |

#### `circle(x: number, y: number, radius: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `radius` | `number` |  |

#### `bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cp1x` | `number` |  |
| `cp1y` | `number` |  |
| `cp2x` | `number` |  |
| `cp2y` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |

#### `closePath(): void`

#### `ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise: boolean \| undefined): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `radiusX` | `number` |  |
| `radiusY` | `number` |  |
| `rotation` | `number` |  |
| `startAngle` | `number` |  |
| `endAngle` | `number` |  |
| `counterclockwise` | `boolean \| undefined` |  |

#### `lineTo(x: number, y: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |

#### `moveTo(x: number, y: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |

#### `quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cpx` | `number` |  |
| `cpy` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |

#### `rect(x: number, y: number, width: number, height: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |

#### `roundRect(x: number, y: number, width: number, height: number, radii: BorderRadius \| undefined): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |
| `radii` | `BorderRadius \| undefined` |  |

#### `polyline(points: Point[]): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `points` | `Point[]` |  |

#### `addPath(path: ContextPath): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `ContextPath` |  |

---

### ContextText `class`

A virtual text element capturing position, content, and optional path-based text layout.

```ts
class ContextText implements ContextElement
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `{
        x,
        y,
        content,
        maxWidth,
        pathData,
        startOffset,
        id = `text-${stringUniqueId()}`,
    }` | `TextOptions` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `readonly id` | `string` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `content` | `string` |  |
| `maxWidth` | `number \| undefined` |  |
| `pathData` | `string \| undefined` |  |
| `startOffset` | `number \| undefined` |  |
---

### Context `class`

Abstract rendering context providing a unified API for Canvas and SVG, with state management, coordinate scaling, and interaction handling.

```ts
class Context<TElement extends Element = Element> extends EventBus<ContextEventMap> implements BaseState
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `string` |  |
| `target` | `string \| HTMLElement` |  |
| `element` | `TElement` |  |
| `options?` | `ContextOptions \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `readonly type` | `string` |  |
| `readonly root` | `HTMLElement` |  |
| `readonly element` | `TElement` |  |
| `buffer` | `boolean` |  |
| `width` | `number` |  |
| `height` | `number` |  |
| `scaleX` | `Scale&lt;number, number&gt;` |  |
| `scaleY` | `Scale&lt;number, number&gt;` |  |
| `scaleDPR` | `Scale&lt;number, number&gt;` |  |
| `renderElement` | `RenderElement \| undefined` |  |
| `renderedElements` | `RenderElement[]` |  |
| `currentRenderElement` | `RenderElement \| undefined` |  |
| `fill` | `string` |  |
| `filter` | `string` |  |
| `direction` | `Direction` |  |
| `font` | `string` |  |
| `fontKerning` | `FontKerning` |  |
| `opacity` | `number` |  |
| `globalCompositeOperation` | `unknown` |  |
| `lineCap` | `LineCap` |  |
| `lineDash` | `number[]` |  |
| `lineDashOffset` | `number` |  |
| `lineJoin` | `LineJoin` |  |
| `lineWidth` | `number` |  |
| `miterLimit` | `number` |  |
| `shadowBlur` | `number` |  |
| `shadowColor` | `string` |  |
| `shadowOffsetX` | `number` |  |
| `shadowOffsetY` | `number` |  |
| `stroke` | `string` |  |
| `textAlign` | `TextAlignment` |  |
| `textBaseline` | `TextBaseline` |  |
| `zIndex` | `number` |  |
| `translateX` | `number` |  |
| `translateY` | `number` |  |
| `transformScaleX` | `number` |  |
| `transformScaleY` | `number` |  |
| `rotation` | `Rotation` |  |
| `transformOriginX` | `TransformOrigin` |  |
| `transformOriginY` | `TransformOrigin` |  |
| `parent` | `EventBus&lt;ContextEventMap&gt; \| undefined` |  |

**Methods:**

#### `save(): void`

Pushes the current state onto the stack and resets to defaults.

#### `restore(): void`

Restores the most recently saved state from the stack.

#### `batch(body: () =&gt; TResult): TResult`

Executes a callback within a save/restore pair, returning the callback's result.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `body` | `() =&gt; TResult` |  |

#### `clear(): void`

Clears the entire rendering surface.

#### `reset(): void`

Resets the context to its initial state.

#### `invalidateTrackedElements(event: string): void`

Clears the cached list of tracked elements for interaction, forcing a rebuild on the next hit test.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `string` |  |

#### `markRenderStart(): void`

Signals the start of a render pass; resets the rendered-elements list at depth 0.

#### `markRenderEnd(): void`

Signals the end of a render pass.

#### `rotate(angle: number): void`

Applies a rotation transformation.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `angle` | `number` |  |

#### `scale(x: number, y: number): void`

Applies a scale transformation.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |

#### `translate(x: number, y: number): void`

Applies a translation transformation.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |

#### `setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `number` |  |
| `b` | `number` |  |
| `c` | `number` |  |
| `d` | `number` |  |
| `e` | `number` |  |
| `f` | `number` |  |

#### `transform(a: number, b: number, c: number, d: number, e: number, f: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `number` |  |
| `b` | `number` |  |
| `c` | `number` |  |
| `d` | `number` |  |
| `e` | `number` |  |
| `f` | `number` |  |

#### `measureText(text: string, font: string \| undefined): TextMetrics`

Measures text dimensions using the context's current font or an optional override.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `text` | `string` |  |
| `font` | `string \| undefined` |  |

#### `createPath(id: string \| undefined): ContextPath`

Creates a new path element, optionally reusing an id for SVG diffing efficiency.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string \| undefined` |  |

#### `createText(options: TextOptions): ContextText`

Creates a new text element from the given options.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `TextOptions` |  |

#### `drawImage(image: CanvasImageSource, x: number, y: number, width: number \| undefined, height: number \| undefined): void`

Draws an image onto the rendering surface at the given position and optional size.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `image` | `CanvasImageSource` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number \| undefined` |  |
| `height` | `number \| undefined` |  |

#### `applyClip(path: ContextPath, fillRule: FillRule \| undefined): void`

Clips subsequent drawing operations to the given path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `ContextPath` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `applyFill(path: ContextElement, fillRule: FillRule \| undefined): void`

Fills the given path or text element using the current fill style.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `ContextElement` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `applyStroke(path: ContextElement): void`

Strokes the given path or text element using the current stroke style.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `ContextElement` |  |

#### `isPointInPath(path: ContextPath, x: number, y: number, fillRule: FillRule \| undefined): boolean`

Tests whether a point is inside the filled region of a path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `ContextPath` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `isPointInStroke(path: ContextPath, x: number, y: number): boolean`

Tests whether a point is on the stroked outline of a path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `ContextPath` |  |
| `x` | `number` |  |
| `y` | `number` |  |

#### `enableInteraction(): void`

Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing.

#### `disableInteraction(): void`

Disables DOM interaction events and clears the active element set.

#### `destroy(): void`

Destroys the context, removing the DOM element and disposing all resources.

#### `has(type: keyof ContextEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof ContextEventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;ContextEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ContextEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;ContextEventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ContextEventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;ContextEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ContextEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### CanvasPath `class`

Canvas-specific path implementation backed by a native `Path2D` object.

```ts
class CanvasPath extends ContextPath
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `id?` | `string \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `readonly ref` | `Path2D` |  |
| `readonly id` | `string` |  |

**Methods:**

#### `arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise: boolean \| undefined): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `radius` | `number` |  |
| `startAngle` | `number` |  |
| `endAngle` | `number` |  |
| `counterclockwise` | `boolean \| undefined` |  |

#### `arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x1` | `number` |  |
| `y1` | `number` |  |
| `x2` | `number` |  |
| `y2` | `number` |  |
| `radius` | `number` |  |

#### `circle(x: number, y: number, radius: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `radius` | `number` |  |

#### `bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cp1x` | `number` |  |
| `cp1y` | `number` |  |
| `cp2x` | `number` |  |
| `cp2y` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |

#### `closePath(): void`

#### `ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise: boolean \| undefined): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `radiusX` | `number` |  |
| `radiusY` | `number` |  |
| `rotation` | `number` |  |
| `startAngle` | `number` |  |
| `endAngle` | `number` |  |
| `counterclockwise` | `boolean \| undefined` |  |

#### `lineTo(x: number, y: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |

#### `moveTo(x: number, y: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |

#### `quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cpx` | `number` |  |
| `cpy` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |

#### `rect(x: number, y: number, width: number, height: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |

#### `roundRect(x: number, y: number, width: number, height: number, radii: BorderRadius \| undefined): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |
| `radii` | `BorderRadius \| undefined` |  |

#### `addPath(path: ContextPath): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `ContextPath` |  |

#### `polyline(points: Point[]): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `points` | `Point[]` |  |

---

### CanvasContext `class`

Canvas 2D rendering context implementation, mapping the unified API to `CanvasRenderingContext2D`.

```ts
class CanvasContext extends Context<HTMLCanvasElement>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement` |  |
| `options?` | `ContextOptions \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `fill` | `string` |  |
| `filter` | `string` |  |
| `direction` | `Direction` |  |
| `font` | `string` |  |
| `fontKerning` | `FontKerning` |  |
| `opacity` | `number` |  |
| `globalCompositeOperation` | `unknown` |  |
| `lineCap` | `LineCap` |  |
| `lineDash` | `number[]` |  |
| `lineDashOffset` | `number` |  |
| `lineJoin` | `LineJoin` |  |
| `lineWidth` | `number` |  |
| `miterLimit` | `number` |  |
| `shadowBlur` | `number` |  |
| `shadowColor` | `string` |  |
| `shadowOffsetX` | `number` |  |
| `shadowOffsetY` | `number` |  |
| `stroke` | `string` |  |
| `textAlign` | `TextAlignment` |  |
| `textBaseline` | `TextBaseline` |  |
| `readonly type` | `string` |  |
| `readonly root` | `HTMLElement` |  |
| `readonly element` | `HTMLCanvasElement` |  |
| `buffer` | `boolean` |  |
| `width` | `number` |  |
| `height` | `number` |  |
| `scaleX` | `Scale&lt;number, number&gt;` |  |
| `scaleY` | `Scale&lt;number, number&gt;` |  |
| `scaleDPR` | `Scale&lt;number, number&gt;` |  |
| `renderElement` | `RenderElement \| undefined` |  |
| `renderedElements` | `RenderElement[]` |  |
| `currentRenderElement` | `RenderElement \| undefined` |  |
| `zIndex` | `number` |  |
| `translateX` | `number` |  |
| `translateY` | `number` |  |
| `transformScaleX` | `number` |  |
| `transformScaleY` | `number` |  |
| `rotation` | `Rotation` |  |
| `transformOriginX` | `TransformOrigin` |  |
| `transformOriginY` | `TransformOrigin` |  |
| `parent` | `EventBus&lt;ContextEventMap&gt; \| undefined` |  |

**Methods:**

#### `save(): void`

Pushes the current state onto the stack and resets to defaults.

#### `restore(): void`

Restores the most recently saved state from the stack.

#### `clear(): void`

Clears the entire rendering surface.

#### `reset(): void`

Resets the context to its initial state.

#### `rotate(angle: number): void`

Applies a rotation transformation.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `angle` | `number` |  |

#### `scale(x: number, y: number): void`

Applies a scale transformation.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |

#### `translate(x: number, y: number): void`

Applies a translation transformation.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |

#### `setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `number` |  |
| `b` | `number` |  |
| `c` | `number` |  |
| `d` | `number` |  |
| `e` | `number` |  |
| `f` | `number` |  |

#### `transform(a: number, b: number, c: number, d: number, e: number, f: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `number` |  |
| `b` | `number` |  |
| `c` | `number` |  |
| `d` | `number` |  |
| `e` | `number` |  |
| `f` | `number` |  |

#### `measureText(text: string, font: string \| undefined): TextMetrics`

Measures text dimensions using the context's current font or an optional override.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `text` | `string` |  |
| `font` | `string \| undefined` |  |

#### `createPath(id: string \| undefined): CanvasPath`

Creates a new path element, optionally reusing an id for SVG diffing efficiency.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string \| undefined` |  |

#### `applyClip(path: CanvasPath, fillRule: FillRule \| undefined): void`

Clips subsequent drawing operations to the given path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `CanvasPath` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `drawImage(image: CanvasImageSource, x: number, y: number, width: number \| undefined, height: number \| undefined): void`

Draws an image onto the rendering surface at the given position and optional size.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `image` | `CanvasImageSource` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number \| undefined` |  |
| `height` | `number \| undefined` |  |

#### `applyFill(element: ContextText \| CanvasPath, fillRule: FillRule \| undefined): void`

Fills the given path or text element using the current fill style.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `ContextText \| CanvasPath` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `applyStroke(element: ContextText \| CanvasPath): void`

Strokes the given path or text element using the current stroke style.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `ContextText \| CanvasPath` |  |

#### `isPointInPath(path: CanvasPath, x: number, y: number, fillRule: FillRule \| undefined): boolean`

Tests whether a point is inside the filled region of a path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `CanvasPath` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `isPointInStroke(path: CanvasPath, x: number, y: number): boolean`

Tests whether a point is on the stroked outline of a path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `CanvasPath` |  |
| `x` | `number` |  |
| `y` | `number` |  |

#### `batch(body: () =&gt; TResult): TResult`

Executes a callback within a save/restore pair, returning the callback's result.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `body` | `() =&gt; TResult` |  |

#### `invalidateTrackedElements(event: string): void`

Clears the cached list of tracked elements for interaction, forcing a rebuild on the next hit test.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `string` |  |

#### `markRenderStart(): void`

Signals the start of a render pass; resets the rendered-elements list at depth 0.

#### `markRenderEnd(): void`

Signals the end of a render pass.

#### `createText(options: TextOptions): ContextText`

Creates a new text element from the given options.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `TextOptions` |  |

#### `enableInteraction(): void`

Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing.

#### `disableInteraction(): void`

Disables DOM interaction events and clears the active element set.

#### `destroy(): void`

Destroys the context, removing the DOM element and disposing all resources.

#### `has(type: keyof ContextEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof ContextEventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;ContextEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ContextEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;ContextEventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ContextEventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;ContextEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;ContextEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### RenderElementIntersectionOptions `interface`

Options for render element intersection testing.

```ts
interface RenderElementIntersectionOptions {
    isPointer: boolean;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `isPointer` | `boolean` |  |
---

### RenderElement `interface`

Minimal interface for any element that can be rendered and hit-tested by a context.

```ts
interface RenderElement {
    readonly id: string;
    parent?: RenderElement;
    abstract: boolean;
    pointerEvents: RenderElementPointerEvents;
    renderDepth?: number;
    zIndex: number;
    getBoundingBox?(): Box;
    has(event: string): boolean;
    intersectsWith(x: number, y: number, options?: Partial<RenderElementIntersectionOptions>): boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(type: string, data: any): void;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `parent?` | `RenderElement \| undefined` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `RenderElementPointerEvents` |  |
| `renderDepth?` | `number \| undefined` |  |
| `zIndex` | `number` |  |
| `getBoundingBox?` | `(() =&gt; Box) \| undefined` |  |
| `has` | `(event: string) =&gt; boolean` |  |
| `intersectsWith` | `(x: number, y: number, options?: Partial&lt;RenderElementIntersectionOptions&gt;) =&gt; boolean` |  |
| `emit` | `(type: string, data: any) =&gt; void` |  |
---

### ContextEventMap `interface`

Event map for a rendering context, including resize and pointer events.

```ts
interface ContextEventMap extends EventMap {
    resize: null;
    mouseenter: null;
    mouseleave: null;
    mousemove: {
        x: number;
        y: number;
    };
    click: {
        x: number;
        y: number;
    };
    dragstart: {
        x: number;
        y: number;
    };
    drag: {
        x: number;
        y: number;
        startX: number;
        startY: number;
        deltaX: number;
        deltaY: number;
    };
    dragend: {
        x: number;
        y: number;
        startX: number;
        startY: number;
        deltaX: number;
        deltaY: number;
    };
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `resize` | `null` |  |
| `mouseenter` | `null` |  |
| `mouseleave` | `null` |  |
| `mousemove` | `{ x: number; y: number; }` |  |
| `click` | `{ x: number; y: number; }` |  |
| `dragstart` | `{ x: number; y: number; }` |  |
| `drag` | `{ x: number; y: number; startX: number; startY: number; deltaX: number; deltaY: number; }` |  |
| `dragend` | `{ x: number; y: number; startX: number; startY: number; deltaX: number; deltaY: number; }` |  |
| `destroyed` | `null` |  |
---

### ContextOptions `interface`

Options for constructing a rendering context.

```ts
interface ContextOptions {
    interactive?: boolean;
    dragThreshold?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `interactive?` | `boolean \| undefined` |  |
| `dragThreshold?` | `number \| undefined` |  |
---

### ContextElement `interface`

Minimal interface for context-level elements (paths, text) identified by a unique id.

```ts
interface ContextElement {
    readonly id: string;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
---

### BaseState `interface`

The full set of visual state properties inherited by every renderable element.

```ts
interface BaseState {
    fill: string;
    filter: string;
    direction: Direction;
    font: string;
    fontKerning: FontKerning;
    opacity: number;
    globalCompositeOperation: unknown;
    lineCap: LineCap;
    lineDash: number[];
    lineDashOffset: number;
    lineJoin: LineJoin;
    lineWidth: number;
    miterLimit: number;
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
    stroke: string;
    textAlign: TextAlignment;
    textBaseline: TextBaseline;
    zIndex: number;
    translateX: number;
    translateY: number;
    transformScaleX: number;
    transformScaleY: number;
    rotation: Rotation;
    transformOriginX: TransformOrigin;
    transformOriginY: TransformOrigin;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `fill` | `string` |  |
| `filter` | `string` |  |
| `direction` | `Direction` |  |
| `font` | `string` |  |
| `fontKerning` | `FontKerning` |  |
| `opacity` | `number` |  |
| `globalCompositeOperation` | `unknown` |  |
| `lineCap` | `LineCap` |  |
| `lineDash` | `number[]` |  |
| `lineDashOffset` | `number` |  |
| `lineJoin` | `LineJoin` |  |
| `lineWidth` | `number` |  |
| `miterLimit` | `number` |  |
| `shadowBlur` | `number` |  |
| `shadowColor` | `string` |  |
| `shadowOffsetX` | `number` |  |
| `shadowOffsetY` | `number` |  |
| `stroke` | `string` |  |
| `textAlign` | `TextAlignment` |  |
| `textBaseline` | `TextBaseline` |  |
| `zIndex` | `number` |  |
| `translateX` | `number` |  |
| `translateY` | `number` |  |
| `transformScaleX` | `number` |  |
| `transformScaleY` | `number` |  |
| `rotation` | `Rotation` |  |
| `transformOriginX` | `TransformOrigin` |  |
| `transformOriginY` | `TransformOrigin` |  |
---

### Direction `type`

Text direction for the rendering context.

```ts
type Direction = 'inherit' | 'ltr' | 'rtl';
```

---

### FontKerning `type`

Font kerning mode for the rendering context.

```ts
type FontKerning = 'auto' | 'none' | 'normal';
```

---

### LineCap `type`

Line cap style for stroke endpoints.

```ts
type LineCap = 'butt' | 'round' | 'square';
```

---

### LineJoin `type`

Line join style for stroke corners.

```ts
type LineJoin = 'bevel' | 'miter' | 'round';
```

---

### TextAlignment `type`

Horizontal text alignment relative to the drawing position.

```ts
type TextAlignment = 'center' | 'end' | 'left' | 'right' | 'start';
```

---

### TextBaseline `type`

Vertical text baseline used when rendering text.

```ts
type TextBaseline = 'alphabetic' | 'bottom' | 'hanging' | 'ideographic' | 'middle' | 'top';
```

---

### FillRule `type`

Fill rule algorithm used to determine if a point is inside a path.

```ts
type FillRule = 'evenodd' | 'nonzero';
```

---

### TransformOrigin `type`

Transform origin value — a numeric pixel offset or a percentage string.

```ts
type TransformOrigin = number | string;
```

---

### Rotation `type`

Rotation value — a numeric radian value or a string with `deg`/`rad` suffix.

```ts
type Rotation = number | string;
```

---

### RenderElementPointerEvents `type`

Controls which pointer events a render element responds to during hit testing.

```ts
type RenderElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';
```

---

### TextOptions `type`

Options for creating a text element within the context.

```ts
type TextOptions = {
    id?: string;
    x: number;
    y: number;
    content: string;
    maxWidth?: number;
    pathData?: string;
    startOffset?: number;
};
```

---

### MeasureTextOptions `type`

Options for measuring text dimensions.

```ts
type MeasureTextOptions = {
    context?: CanvasRenderingContext2D;
    font?: CanvasRenderingContext2D['font'];
};
```

---

### resolveRotation `function`

Resolves a rotation value (number, degrees string, or radians string) to radians.

```ts
function resolveRotation(value: Rotation): number;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `Rotation` |  |

**Returns:** `number`

---

### resolveTransformOrigin `function`

Resolves a transform-origin value (number or percentage string) to a pixel offset relative to the given dimension.

```ts
function resolveTransformOrigin(value: TransformOrigin, dimension: number): number;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `TransformOrigin` |  |
| `dimension` | `number` |  |

**Returns:** `number`

---

### measureText `function`

Measures the dimensions of a text string using an optional font and context override.

```ts
function measureText(value: string, options?: MeasureTextOptions): TextMetrics;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |
| `options` | `MeasureTextOptions \| undefined` |  |

**Returns:** `TextMetrics`

---

### typeIsContext `function`

Type guard that checks whether a value is a `Context` instance.

```ts
function typeIsContext(value: unknown): value is Context;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createContext `function`

Creates a Canvas 2D rendering context attached to the given DOM target.

```ts
function createContext(target: string | HTMLElement, options?: ContextOptions): Context;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement` |  |
| `options` | `ContextOptions \| undefined` |  |

**Returns:** `Context&lt;Element&gt;`

---

### getRefContext `const`

Returns a shared offscreen `CanvasRenderingContext2D` used for text measurement and default state retrieval.

```ts
const getRefContext: CachedFunction<() => CanvasRenderingContext2D>;
```

---

### scaleDPR `const`

A scale that maps logical pixels to physical device pixels using `devicePixelRatio`.

```ts
const scaleDPR: Scale<number, number>;
```

---

