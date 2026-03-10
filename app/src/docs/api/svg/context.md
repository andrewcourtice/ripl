---
outline: "deep"
---

# SVG Context

<p class="api-package-badge"><code>@ripl/svg</code></p>

SVG rendering context with virtual DOM reconciliation.

## Overview

**Classes:** [`SVGPath`](#svgpath) · [`SVGText`](#svgtext) · [`SVGImage`](#svgimage) · [`SVGTextPath`](#svgtextpath) · [`SVGContext`](#svgcontext)

**Interfaces:** [`SVGContextElementDefinition`](#svgcontextelementdefinition) · [`SVGContextElement`](#svgcontextelement)

**Functions:** [`createContext`](#createcontext)

### SVGPath `class`

SVG-specific path implementation that builds an SVG `d` attribute string from drawing commands.

```ts
class SVGPath extends ContextPath implements SVGContextElement
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `id?` | `string \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `definition` | `SVGContextElementDefinition` |  |
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

### SVGText `class`

SVG-specific text element mapping position and content to SVG `<text>` attributes.

```ts
class SVGText extends ContextText implements SVGContextElement
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `TextOptions` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `definition` | `SVGContextElementDefinition` |  |
| `readonly id` | `string` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `content` | `string` |  |
| `maxWidth` | `number \| undefined` |  |
| `pathData` | `string \| undefined` |  |
| `startOffset` | `number \| undefined` |  |
---

### SVGImage `class`

SVG-specific image element wrapping a `CanvasImageSource` as an SVG `<image>` tag.

```ts
class SVGImage implements SVGContextElement
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `href` | `string` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `width` | `number` |  |
| `height` | `number` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `readonly id` | `string` |  |
| `definition` | `SVGContextElementDefinition` |  |
---

### SVGTextPath `class`

SVG `<textPath>` element for rendering text along a path defined in `<defs>`.

```ts
class SVGTextPath implements SVGContextElement
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `textId` | `string` |  |
| `pathId` | `string` |  |
| `content` | `string` |  |
| `startOffset?` | `number \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `readonly id` | `string` |  |
| `definition` | `SVGContextElementDefinition` |  |
---

### SVGContext `class`

SVG rendering context implementation, mapping the unified API to SVG DOM elements via virtual-DOM reconciliation.

```ts
class SVGContext extends Context<SVGSVGElement>
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
| `readonly type` | `string` |  |
| `readonly root` | `HTMLElement` |  |
| `readonly element` | `SVGSVGElement` |  |
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

#### `markRenderStart(): void`

Signals the start of a render pass; resets the rendered-elements list at depth 0.

#### `markRenderEnd(): void`

Signals the end of a render pass.

#### `createPath(id: string \| undefined): SVGPath`

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

#### `save(): void`

Pushes the current state onto the stack and resets to defaults.

#### `restore(): void`

Restores the most recently saved state from the stack.

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

#### `applyClip(path: SVGPath, fillRule: FillRule \| undefined): void`

Clips subsequent drawing operations to the given path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `SVGPath` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `applyFill(element: SVGContextElement, fillRule: FillRule \| undefined): void`

Fills the given path or text element using the current fill style.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `SVGContextElement` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `applyStroke(element: SVGContextElement): void`

Strokes the given path or text element using the current stroke style.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `SVGContextElement` |  |

#### `measureText(text: string, font: string \| undefined): TextMetrics`

Measures text dimensions using the context's current font or an optional override.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `text` | `string` |  |
| `font` | `string \| undefined` |  |

#### `isPointInPath(path: SVGPath, x: number, y: number, fillRule: FillRule \| undefined): boolean`

Tests whether a point is inside the filled region of a path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `SVGPath` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `fillRule` | `FillRule \| undefined` |  |

#### `isPointInStroke(path: SVGPath, x: number, y: number): boolean`

Tests whether a point is on the stroked outline of a path.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `SVGPath` |  |
| `x` | `number` |  |
| `y` | `number` |  |

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

#### `enableInteraction(): void`

Enables DOM interaction events (mouse enter, leave, move, click) with element hit testing.

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

### SVGContextElementDefinition `interface`

Definition for an SVG context element, describing its tag, inline styles, and attributes.

```ts
interface SVGContextElementDefinition {
    tag: keyof SVGElementTagNameMap;
    styles: Partial<Styles>;
    attributes: Record<string, string>;
    textContent?: string;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `tag` | `keyof SVGElementTagNameMap` |  |
| `styles` | `Partial&lt;Styles&gt;` |  |
| `attributes` | `Record&lt;string, string&gt;` |  |
| `textContent?` | `string \| undefined` |  |
---

### SVGContextElement `interface`

An SVG-specific context element carrying its rendering definition.

```ts
interface SVGContextElement extends ContextElement {
    definition: SVGContextElementDefinition;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `definition` | `SVGContextElementDefinition` |  |
| `id` | `string` |  |
---

### createContext `function`

Creates an SVG rendering context attached to the given DOM target.

```ts
function createContext(target: string | HTMLElement, options?: ContextOptions): Context
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement` |  |
| `options` | `ContextOptions \| undefined` |  |

**Returns:** `Context&lt;Element&gt;`

---

