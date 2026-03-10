---
outline: "deep"
---

# Context3D

<p class="api-package-badge"><code>@ripl/3d</code></p>

3D rendering context extending CanvasContext with projection.

## Overview

**Classes:** [`Context3D`](#context3d)

**Interfaces:** [`Context3DOptions`](#context3doptions)

**Functions:** [`createContext`](#createcontext)

### Context3D `class`

3D rendering context extending the Canvas context with view/projection matrices and a face buffer for painter's algorithm sorting.

```ts
class Context3D extends CanvasContext
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement` |  |
| `options?` | `Context3DOptions \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `viewMatrix` | `Matrix4` |  |
| `projectionMatrix` | `Matrix4` |  |
| `viewProjectionMatrix` | `Matrix4` |  |
| `lightDirection` | `Vector3` |  |
| `faceBuffer` | `ProjectedFace3D[]` |  |
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

#### `setCamera(eye: Vector3, target: Vector3, up: Vector3): void`

Sets the view matrix from an eye position, look-at target, and up direction.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `eye` | `Vector3` |  |
| `target` | `Vector3` |  |
| `up` | `Vector3` |  |

#### `setPerspective(fov: number, near: number, far: number): void`

Updates the perspective projection with the given field of view, near, and far planes.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `fov` | `number` |  |
| `near` | `number` |  |
| `far` | `number` |  |

#### `setOrthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): void`

Sets an orthographic projection with explicit frustum bounds.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `left` | `number` |  |
| `right` | `number` |  |
| `bottom` | `number` |  |
| `top` | `number` |  |
| `near` | `number` |  |
| `far` | `number` |  |

#### `project(point: Vector3): ProjectedPoint`

Projects a 3D world-space point to 2D screen coordinates.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `point` | `Vector3` |  |

#### `markRenderStart(): void`

Signals the start of a render pass; resets the rendered-elements list at depth 0.

#### `markRenderEnd(): void`

Signals the end of a render pass.

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

#### `createText(options: TextOptions): ContextText`

Creates a new text element from the given options.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `TextOptions` |  |

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

### Context3DOptions `interface`

Options for the 3D rendering context, extending the base context options with camera parameters.

```ts
interface Context3DOptions extends ContextOptions {
    fov?: number;
    near?: number;
    far?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `fov?` | `number \| undefined` |  |
| `near?` | `number \| undefined` |  |
| `far?` | `number \| undefined` |  |
| `interactive?` | `boolean \| undefined` |  |
---

### createContext `function`

Creates a 3D rendering context attached to the given DOM target.

```ts
function createContext(target: string | HTMLElement, options?: Context3DOptions): Context3D
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement` |  |
| `options` | `Context3DOptions \| undefined` |  |

**Returns:** `Context3D`

---

