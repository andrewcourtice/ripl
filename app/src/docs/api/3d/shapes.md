---
outline: "deep"
---

# Shapes

<p class="api-package-badge"><code>@ripl/3d</code></p>

Built-in 3D shapes: Cube, Sphere, Cylinder, Cone, Plane, Torus.

## Overview

**Classes:** [`Cube`](#cube) · [`Sphere`](#sphere) · [`Cylinder`](#cylinder) · [`Cone`](#cone) · [`Plane`](#plane) · [`Torus`](#torus)

**Interfaces:** [`CubeState`](#cubestate) · [`SphereState`](#spherestate) · [`CylinderState`](#cylinderstate) · [`ConeState`](#conestate) · [`PlaneState`](#planestate) · [`TorusState`](#torusstate)

**Functions:** [`createCube`](#createcube) · [`elementIsCube`](#elementiscube) · [`createSphere`](#createsphere) · [`elementIsSphere`](#elementissphere) · [`createCylinder`](#createcylinder) · [`elementIsCylinder`](#elementiscylinder) · [`createCone`](#createcone) · [`elementIsCone`](#elementiscone) · [`createPlane`](#createplane) · [`elementIsPlane`](#elementisplane) · [`createTorus`](#createtorus) · [`elementIsTorus`](#elementistorus)

### Cube `class`

A 3D cube shape with uniform edge size.

```ts
class Cube extends Shape3D<CubeState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;ElementOptions&lt;CubeState&gt;&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `size` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

#### `getDepth(context: Context3D): number`

Returns the projected depth of this shape's origin in the given 3D context.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context3D` |  |

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `render(context: Context&lt;Element&gt;): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;Element&gt;` |  |

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


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

#### `clone(): Element&lt;CubeState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;CubeState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;CubeState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;CubeState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;CubeState&gt;&gt;` |  |

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

### Sphere `class`

A 3D sphere shape tessellated with configurable segments and rings.

```ts
class Sphere extends Shape3D<SphereState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;ElementOptions&lt;SphereState&gt;&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `radius` | `number` |  |
| `segments` | `number` |  |
| `rings` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

#### `getDepth(context: Context3D): number`

Returns the projected depth of this shape's origin in the given 3D context.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context3D` |  |

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `render(context: Context&lt;Element&gt;): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;Element&gt;` |  |

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


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

#### `clone(): Element&lt;SphereState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;SphereState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;SphereState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;SphereState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;SphereState&gt;&gt;` |  |

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

### Cylinder `class`

A 3D cylinder shape with independent top and bottom radii for truncated cones.

```ts
class Cylinder extends Shape3D<CylinderState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;ElementOptions&lt;CylinderState&gt;&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `radiusTop` | `number` |  |
| `radiusBottom` | `number` |  |
| `height` | `number` |  |
| `segments` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

#### `getDepth(context: Context3D): number`

Returns the projected depth of this shape's origin in the given 3D context.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context3D` |  |

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `render(context: Context&lt;Element&gt;): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;Element&gt;` |  |

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


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

#### `clone(): Element&lt;CylinderState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;CylinderState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;CylinderState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;CylinderState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;CylinderState&gt;&gt;` |  |

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

### Cone `class`

A 3D cone shape with configurable radius, height, and segment resolution.

```ts
class Cone extends Shape3D<ConeState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;ElementOptions&lt;ConeState&gt;&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `radius` | `number` |  |
| `height` | `number` |  |
| `segments` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

#### `getDepth(context: Context3D): number`

Returns the projected depth of this shape's origin in the given 3D context.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context3D` |  |

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `render(context: Context&lt;Element&gt;): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;Element&gt;` |  |

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


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

#### `clone(): Element&lt;ConeState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;ConeState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;ConeState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;ConeState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;ConeState&gt;&gt;` |  |

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

### Plane `class`

A flat rectangular 3D plane oriented along the XY plane.

```ts
class Plane extends Shape3D<PlaneState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;ElementOptions&lt;PlaneState&gt;&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `width` | `number` |  |
| `height` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

#### `getDepth(context: Context3D): number`

Returns the projected depth of this shape's origin in the given 3D context.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context3D` |  |

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `render(context: Context&lt;Element&gt;): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;Element&gt;` |  |

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


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

#### `clone(): Element&lt;PlaneState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;PlaneState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;PlaneState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;PlaneState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;PlaneState&gt;&gt;` |  |

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

### Torus `class`

A 3D torus (donut) shape with configurable major radius, tube radius, and tessellation.

```ts
class Torus extends Shape3D<TorusState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;ElementOptions&lt;TorusState&gt;&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `radius` | `number` |  |
| `tube` | `number` |  |
| `radialSegments` | `number` |  |
| `tubularSegments` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

#### `getDepth(context: Context3D): number`

Returns the projected depth of this shape's origin in the given 3D context.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context3D` |  |

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `render(context: Context&lt;Element&gt;): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;Element&gt;` |  |

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


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

#### `clone(): Element&lt;TorusState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;TorusState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;TorusState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;TorusState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;TorusState&gt;&gt;` |  |

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

### CubeState `interface`

State interface for a cube, defining uniform edge size.

```ts
interface CubeState extends Shape3DState {
    size: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `size` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

### SphereState `interface`

State interface for a sphere, defining radius, longitudinal segments, and latitudinal rings.

```ts
interface SphereState extends Shape3DState {
    radius: number;
    segments: number;
    rings: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `radius` | `number` |  |
| `segments` | `number` |  |
| `rings` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

### CylinderState `interface`

State interface for a cylinder, defining top/bottom radii, height, and segment count.

```ts
interface CylinderState extends Shape3DState {
    radiusTop: number;
    radiusBottom: number;
    height: number;
    segments: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `radiusTop` | `number` |  |
| `radiusBottom` | `number` |  |
| `height` | `number` |  |
| `segments` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

### ConeState `interface`

State interface for a cone, defining radius, height, and segment count.

```ts
interface ConeState extends Shape3DState {
    radius: number;
    height: number;
    segments: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `radius` | `number` |  |
| `height` | `number` |  |
| `segments` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

### PlaneState `interface`

State interface for a plane, defining width and height.

```ts
interface PlaneState extends Shape3DState {
    width: number;
    height: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `width` | `number` |  |
| `height` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

### TorusState `interface`

State interface for a torus, defining major radius, tube radius, and segment counts.

```ts
interface TorusState extends Shape3DState {
    radius: number;
    tube: number;
    radialSegments: number;
    tubularSegments: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `radius` | `number` |  |
| `tube` | `number` |  |
| `radialSegments` | `number` |  |
| `tubularSegments` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |
| `z` | `number` |  |
| `rotationX` | `number` |  |
| `rotationY` | `number` |  |
| `rotationZ` | `number` |  |
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

### createCube `function`

Factory function that creates a new `Cube` instance.

```ts
function createCube(...options: ConstructorParameters<typeof Cube>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Partial&lt;ElementOptions&lt;CubeState&gt;&gt;]` |  |

**Returns:** `Cube`

---

### elementIsCube `function`

Type guard that checks whether a value is a `Cube` instance.

```ts
function elementIsCube(value: unknown): value is Cube
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createSphere `function`

Factory function that creates a new `Sphere` instance.

```ts
function createSphere(...options: ConstructorParameters<typeof Sphere>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Partial&lt;ElementOptions&lt;SphereState&gt;&gt;]` |  |

**Returns:** `Sphere`

---

### elementIsSphere `function`

Type guard that checks whether a value is a `Sphere` instance.

```ts
function elementIsSphere(value: unknown): value is Sphere
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createCylinder `function`

Factory function that creates a new `Cylinder` instance.

```ts
function createCylinder(...options: ConstructorParameters<typeof Cylinder>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Partial&lt;ElementOptions&lt;CylinderState&gt;&gt;]` |  |

**Returns:** `Cylinder`

---

### elementIsCylinder `function`

Type guard that checks whether a value is a `Cylinder` instance.

```ts
function elementIsCylinder(value: unknown): value is Cylinder
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createCone `function`

Factory function that creates a new `Cone` instance.

```ts
function createCone(...options: ConstructorParameters<typeof Cone>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Partial&lt;ElementOptions&lt;ConeState&gt;&gt;]` |  |

**Returns:** `Cone`

---

### elementIsCone `function`

Type guard that checks whether a value is a `Cone` instance.

```ts
function elementIsCone(value: unknown): value is Cone
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createPlane `function`

Factory function that creates a new `Plane` instance.

```ts
function createPlane(...options: ConstructorParameters<typeof Plane>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Partial&lt;ElementOptions&lt;PlaneState&gt;&gt;]` |  |

**Returns:** `Plane`

---

### elementIsPlane `function`

Type guard that checks whether a value is a `Plane` instance.

```ts
function elementIsPlane(value: unknown): value is Plane
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createTorus `function`

Factory function that creates a new `Torus` instance.

```ts
function createTorus(...options: ConstructorParameters<typeof Torus>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[options: Partial&lt;ElementOptions&lt;TorusState&gt;&gt;]` |  |

**Returns:** `Torus`

---

### elementIsTorus `function`

Type guard that checks whether a value is a `Torus` instance.

```ts
function elementIsTorus(value: unknown): value is Torus
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

