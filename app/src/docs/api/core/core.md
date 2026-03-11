---
outline: "deep"
---

# Core

<p class="api-package-badge"><code>@ripl/core</code></p>

Element, Shape, Group, Scene, Renderer, and EventBus — the foundational classes.

## Overview

**Classes:** [`Disposer`](#disposer) · [`Element`](#element) · [`Event`](#event) · [`EventBus`](#eventbus) · [`Group`](#group) · [`Renderer`](#renderer) · [`Scene`](#scene) · [`Shape`](#shape) · [`Shape2D`](#shape2d)

**Interfaces:** [`ElementEventMap`](#elementeventmap) · [`ElementValidationResult`](#elementvalidationresult) · [`GroupOptions`](#groupoptions) · [`RendererEventMap`](#renderereventmap) · [`RendererTransition`](#renderertransition) · [`RendererTransitionOptions`](#renderertransitionoptions) · [`RendererDebugOptions`](#rendererdebugoptions) · [`RendererOptions`](#rendereroptions) · [`SceneEventMap`](#sceneeventmap) · [`SceneOptions`](#sceneoptions)

**Type Aliases:** [`ElementPointerEvents`](#elementpointerevents) · [`ElementValidationType`](#elementvalidationtype) · [`ElementIntersectionOptions`](#elementintersectionoptions) · [`BaseElementState`](#baseelementstate) · [`ElementOptions`](#elementoptions) · [`ElementInterpolationKeyFrame`](#elementinterpolationkeyframe) · [`ElementInterpolationStateValue`](#elementinterpolationstatevalue) · [`ElementInterpolators`](#elementinterpolators) · [`ElementInterpolationState`](#elementinterpolationstate) · [`EventMap`](#eventmap) · [`EventOptions`](#eventoptions) · [`EventSubscriptionOptions`](#eventsubscriptionoptions) · [`EventHandler`](#eventhandler) · [`RendererTransitionDirection`](#renderertransitiondirection) · [`RendererTransitionOptionsArg`](#renderertransitionoptionsarg) · [`Shape2DOptions`](#shape2doptions)

**Functions:** [`createElement`](#createelement) · [`typeIsElement`](#typeiselement) · [`queryAll`](#queryall) · [`query`](#query) · [`isGroup`](#isgroup) · [`createGroup`](#creategroup) · [`createRenderer`](#createrenderer) · [`createScene`](#createscene) · [`createShape`](#createshape) · [`elementIsShape`](#elementisshape)

**Constants:** [`CONTEXT_OPERATIONS`](#context-operations) · [`TRANSFORM_INTERPOLATORS`](#transform-interpolators) · [`TRANSFORM_DEFAULTS`](#transform-defaults) · [`TRACKED_EVENTS`](#tracked-events)

### Disposer `class`

Abstract base class that manages disposable resources, supporting keyed retention and bulk disposal.

```ts
class Disposer
```

---

### Element `class`

The base renderable element with state management, event handling, interpolation, transform support, and context rendering.

```ts
class Element<TState extends BaseElementState = BaseElementState, TEventMap extends ElementEventMap = ElementEventMap> extends EventBus<TEventMap>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `string` |  |
| `{
        id = `${type}:${stringUniqueId()}`,
        class: classes = [],
        data,
        pointerEvents = 'all',
        ...state
    }` | `ElementOptions&lt;TState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `readonly type` | `string` |  |
| `readonly classList` | `Set&lt;string&gt;` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `ElementPointerEvents` |  |
| `parent` | `Group&lt;TEventMap&gt; \| undefined` |  |
| `data` | `unknown` |  |
| `direction` | `TState["direction"]` |  |
| `fill` | `TState["fill"]` |  |
| `filter` | `TState["filter"]` |  |
| `font` | `TState["font"]` |  |
| `opacity` | `TState["opacity"]` |  |
| `globalCompositeOperation` | `TState["globalCompositeOperation"]` |  |
| `lineCap` | `TState["lineCap"]` |  |
| `lineDash` | `TState["lineDash"]` |  |
| `lineDashOffset` | `TState["lineDashOffset"]` |  |
| `lineJoin` | `TState["lineJoin"]` |  |
| `lineWidth` | `TState["lineWidth"]` |  |
| `miterLimit` | `TState["miterLimit"]` |  |
| `shadowBlur` | `TState["shadowBlur"]` |  |
| `shadowColor` | `TState["shadowColor"]` |  |
| `shadowOffsetX` | `TState["shadowOffsetX"]` |  |
| `shadowOffsetY` | `TState["shadowOffsetY"]` |  |
| `stroke` | `TState["stroke"]` |  |
| `textAlign` | `TState["textAlign"]` |  |
| `textBaseline` | `TState["textBaseline"]` |  |
| `zIndex` | `number` |  |
| `translateX` | `TState["translateX"]` |  |
| `translateY` | `TState["translateY"]` |  |
| `transformScaleX` | `TState["transformScaleX"]` |  |
| `transformScaleY` | `TState["transformScaleY"]` |  |
| `rotation` | `TState["rotation"]` |  |
| `transformOriginX` | `TState["transformOriginX"]` |  |
| `transformOriginY` | `TState["transformOriginY"]` |  |

**Methods:**

#### `on(event: TEvent, handler: EventHandler&lt;TEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;TEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;TState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;TState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;TState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;TState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;TState&gt;&gt;` |  |

#### `render(context: Context&lt;globalThis.Element&gt;, callback: AnyFunction \| undefined, skipRestore: boolean \| undefined): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;globalThis.Element&gt;` |  |
| `callback` | `AnyFunction \| undefined` |  |
| `skipRestore` | `boolean \| undefined` |  |

#### `destroy(): void`

Emits a `destroyed` event, clears all listeners, and disposes retained resources.

#### `has(type: keyof TEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof TEventMap` |  |

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

### Event `class`

An event object carrying type, data, target reference, and propagation control.

```ts
class Event<TData = undefined>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `string` |  |
| `target` | `EventBus&lt;any&gt;` |  |
| `options?` | `EventOptions&lt;TData&gt; \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `#bubbles` | `boolean` |  |
| `readonly type` | `string` |  |
| `readonly data` | `TData` |  |
| `readonly timestamp` | `number` |  |
| `readonly target` | `EventBus&lt;any&gt;` |  |
| `bubbles` | `boolean` |  |

**Methods:**

#### `stopPropagation(): void`

Prevents this event from bubbling further up the parent chain.

---

### EventBus `class`

A typed pub/sub event system with parent-chain bubbling, disposable subscriptions, and self-filtering.

```ts
class EventBus<TEventMap extends EventMap = EventMap> extends Disposer
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;TEventMap&gt; \| undefined` |  |

**Methods:**

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

#### `destroy(): void`

Emits a `destroyed` event, clears all listeners, and disposes retained resources.

---

### Group `class`

A container element that manages child elements, providing scenegraph traversal, CSS-like querying, and composite bounding boxes.

```ts
class Group<TEventMap extends ElementEventMap = ElementEventMap> extends Element<BaseElementState, TEventMap>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `{
        children = [],
        ...options
    }?` | `GroupOptions` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `#elements` | `Set&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;` |  |
| `children` | `Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]` | Returns a snapshot array of this group's direct child elements. |
| `id` | `string` |  |
| `readonly type` | `string` |  |
| `readonly classList` | `Set&lt;string&gt;` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `ElementPointerEvents` |  |
| `parent` | `Group&lt;TEventMap&gt; \| undefined` |  |
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

#### `updateSceneGraph(): void`

Emits a `graph` event to notify the scene that the element tree has changed.

#### `set(elements: Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]): void`

Replaces all children with the given elements.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `elements` | `Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]` |  |

#### `add(element: OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;): void`

Adds one or more elements as children, re-parenting them if necessary.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;` |  |

#### `remove(element: OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;): void`

Removes one or more child elements from this group.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;` |  |

#### `clear(): void`

Removes all children from this group.

#### `graph(includeGroups: boolean \| undefined): Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]`

Returns a flattened array of all descendant elements, optionally including intermediate groups.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `includeGroups` | `boolean \| undefined` |  |

#### `query(selector: string): TElement \| undefined`

Returns the first descendant matching the CSS-like selector, or `undefined`.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `selector` | `string` |  |

#### `queryAll(selector: string): TElement[]`

Returns all descendants matching the CSS-like selector.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `selector` | `string` |  |

#### `getElementByID(id: string): TElement`

Finds a descendant element by its unique id.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |

#### `getElementsByType(types: OneOrMore&lt;string&gt;): TElement[]`

Returns all descendant elements whose type matches one of the given type names.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `types` | `OneOrMore&lt;string&gt;` |  |

#### `getElementsByClass(classes: OneOrMore&lt;string&gt;): TElement[]`

Returns all descendant elements that have all of the given CSS class names.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `classes` | `OneOrMore&lt;string&gt;` |  |

#### `getBoundingBox(): Box`

Returns the composite bounding box enclosing all children.

#### `render(context: Context&lt;globalThis.Element&gt;): void`

Renders all child elements in order within a save/restore context.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;globalThis.Element&gt;` |  |

#### `on(event: TEvent, handler: EventHandler&lt;TEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;TEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;Partial&lt;BaseState&gt;&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;Partial&lt;BaseState&gt;&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;Partial&lt;BaseState&gt;&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;Partial&lt;BaseState&gt;&gt;&gt;` |  |

#### `destroy(): void`

Emits a `destroyed` event, clears all listeners, and disposes retained resources.

#### `has(type: keyof TEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof TEventMap` |  |

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

### Renderer `class`

Drives the animation loop via `requestAnimationFrame`, managing per-element transitions and rendering the scene each frame.

```ts
class Renderer extends EventBus<RendererEventMap>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `scene` | `Scene&lt;Context&lt;globalThis.Element&gt;&gt;` |  |
| `options?` | `RendererOptions \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `autoStart` | `boolean` |  |
| `autoStop` | `boolean` |  |
| `sortBuffer` | `((buffer: Element[]) =&gt; Element[]) \| undefined` |  |
| `isBusy` | `boolean` | Whether there are any active transitions in progress. |
| `parent` | `EventBus&lt;RendererEventMap&gt; \| undefined` |  |

**Methods:**

#### `start(): void`

Starts the animation loop if it is not already running.

#### `stop(): void`

Stops the animation loop, cancels pending frames, and clears all transitions.

#### `transition(element: OneOrMore&lt;TElement&gt;, options: RendererTransitionOptionsArg&lt;TElement&gt; \| undefined): Transition`

Schedules an animated transition for one or more elements, returning a `Transition` that resolves when all complete.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `OneOrMore&lt;TElement&gt;` |  |
| `options` | `RendererTransitionOptionsArg&lt;TElement&gt; \| undefined` |  |

#### `destroy(): void`

Stops the renderer and destroys all event subscriptions.

#### `has(type: keyof RendererEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof RendererEventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;RendererEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;RendererEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;RendererEventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;RendererEventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;RendererEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;RendererEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### Scene `class`

The top-level group bound to a rendering context, maintaining a hoisted flat buffer for O(n) rendering.

```ts
class Scene<TContext extends Context = Context> extends Group<SceneEventMap>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;globalThis.Element&gt;` |  |
| `options?` | `SceneOptions \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `context` | `TContext` |  |
| `buffer` | `Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]` |  |
| `width` | `number` | The pixel width of the scene's rendering context. |
| `height` | `number` | The pixel height of the scene's rendering context. |
| `#elements` | `Set&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;` |  |
| `children` | `Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]` | Returns a snapshot array of this group's direct child elements. |
| `id` | `string` |  |
| `readonly type` | `string` |  |
| `readonly classList` | `Set&lt;string&gt;` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `ElementPointerEvents` |  |
| `parent` | `Group&lt;SceneEventMap&gt; \| undefined` |  |
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

#### `destroy(includeContext: boolean): void`

Destroys the scene (and optionally the context), removing all children and cleaning up event subscriptions.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `includeContext` | `boolean` |  |

#### `render(): void`

Clears the context and renders the entire element buffer in z-index order.

#### `updateSceneGraph(): void`

Emits a `graph` event to notify the scene that the element tree has changed.

#### `set(elements: Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]): void`

Replaces all children with the given elements.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `elements` | `Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]` |  |

#### `add(element: OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;): void`

Adds one or more elements as children, re-parenting them if necessary.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;` |  |

#### `remove(element: OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;): void`

Removes one or more child elements from this group.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt;` |  |

#### `clear(): void`

Removes all children from this group.

#### `graph(includeGroups: boolean \| undefined): Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;[]`

Returns a flattened array of all descendant elements, optionally including intermediate groups.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `includeGroups` | `boolean \| undefined` |  |

#### `query(selector: string): TElement \| undefined`

Returns the first descendant matching the CSS-like selector, or `undefined`.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `selector` | `string` |  |

#### `queryAll(selector: string): TElement[]`

Returns all descendants matching the CSS-like selector.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `selector` | `string` |  |

#### `getElementByID(id: string): TElement`

Finds a descendant element by its unique id.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |

#### `getElementsByType(types: OneOrMore&lt;string&gt;): TElement[]`

Returns all descendant elements whose type matches one of the given type names.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `types` | `OneOrMore&lt;string&gt;` |  |

#### `getElementsByClass(classes: OneOrMore&lt;string&gt;): TElement[]`

Returns all descendant elements that have all of the given CSS class names.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `classes` | `OneOrMore&lt;string&gt;` |  |

#### `getBoundingBox(): Box`

Returns the composite bounding box enclosing all children.

#### `on(event: TEvent, handler: EventHandler&lt;SceneEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;SceneEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;Partial&lt;BaseState&gt;&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;Partial&lt;BaseState&gt;&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;Partial&lt;BaseState&gt;&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;Partial&lt;BaseState&gt;&gt;&gt;` |  |

#### `has(type: keyof SceneEventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof SceneEventMap` |  |

#### `off(type: TEvent, handler: EventHandler&lt;SceneEventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;SceneEventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;SceneEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;SceneEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### Shape `class`

Abstract base class for renderable shapes, extending `Element` with a type-constrained constructor.

```ts
class Shape<TState extends BaseElementState = BaseElementState> extends Element<TState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `string` |  |
| `options` | `ElementOptions&lt;TState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `readonly type` | `string` |  |
| `readonly classList` | `Set&lt;string&gt;` |  |
| `abstract` | `boolean` |  |
| `pointerEvents` | `ElementPointerEvents` |  |
| `parent` | `Group&lt;ElementEventMap&gt; \| undefined` |  |
| `data` | `unknown` |  |
| `direction` | `TState["direction"]` |  |
| `fill` | `TState["fill"]` |  |
| `filter` | `TState["filter"]` |  |
| `font` | `TState["font"]` |  |
| `opacity` | `TState["opacity"]` |  |
| `globalCompositeOperation` | `TState["globalCompositeOperation"]` |  |
| `lineCap` | `TState["lineCap"]` |  |
| `lineDash` | `TState["lineDash"]` |  |
| `lineDashOffset` | `TState["lineDashOffset"]` |  |
| `lineJoin` | `TState["lineJoin"]` |  |
| `lineWidth` | `TState["lineWidth"]` |  |
| `miterLimit` | `TState["miterLimit"]` |  |
| `shadowBlur` | `TState["shadowBlur"]` |  |
| `shadowColor` | `TState["shadowColor"]` |  |
| `shadowOffsetX` | `TState["shadowOffsetX"]` |  |
| `shadowOffsetY` | `TState["shadowOffsetY"]` |  |
| `stroke` | `TState["stroke"]` |  |
| `textAlign` | `TState["textAlign"]` |  |
| `textBaseline` | `TState["textBaseline"]` |  |
| `zIndex` | `number` |  |
| `translateX` | `TState["translateX"]` |  |
| `translateY` | `TState["translateY"]` |  |
| `transformScaleX` | `TState["transformScaleX"]` |  |
| `transformScaleY` | `TState["transformScaleY"]` |  |
| `rotation` | `TState["rotation"]` |  |
| `transformOriginX` | `TState["transformOriginX"]` |  |
| `transformOriginY` | `TState["transformOriginY"]` |  |

**Methods:**

#### `on(event: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;TState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;TState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;TState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;TState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;TState&gt;&gt;` |  |

#### `render(context: Context&lt;globalThis.Element&gt;, callback: AnyFunction \| undefined, skipRestore: boolean \| undefined): void`

Renders this element by applying transforms and context state, then invoking the optional callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;globalThis.Element&gt;` |  |
| `callback` | `AnyFunction \| undefined` |  |
| `skipRestore` | `boolean \| undefined` |  |

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

### Shape2D `class`

A concrete 2D shape with path management, automatic fill/stroke rendering, clipping support, and path-based hit testing.

```ts
class Shape2D<TState extends BaseElementState = BaseElementState> extends Shape<TState>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `string` |  |
| `options` | `Shape2DOptions&lt;TState&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
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
| `direction` | `TState["direction"]` |  |
| `fill` | `TState["fill"]` |  |
| `filter` | `TState["filter"]` |  |
| `font` | `TState["font"]` |  |
| `opacity` | `TState["opacity"]` |  |
| `globalCompositeOperation` | `TState["globalCompositeOperation"]` |  |
| `lineCap` | `TState["lineCap"]` |  |
| `lineDash` | `TState["lineDash"]` |  |
| `lineDashOffset` | `TState["lineDashOffset"]` |  |
| `lineJoin` | `TState["lineJoin"]` |  |
| `lineWidth` | `TState["lineWidth"]` |  |
| `miterLimit` | `TState["miterLimit"]` |  |
| `shadowBlur` | `TState["shadowBlur"]` |  |
| `shadowColor` | `TState["shadowColor"]` |  |
| `shadowOffsetX` | `TState["shadowOffsetX"]` |  |
| `shadowOffsetY` | `TState["shadowOffsetY"]` |  |
| `stroke` | `TState["stroke"]` |  |
| `textAlign` | `TState["textAlign"]` |  |
| `textBaseline` | `TState["textBaseline"]` |  |
| `zIndex` | `number` |  |
| `translateX` | `TState["translateX"]` |  |
| `translateY` | `TState["translateY"]` |  |
| `transformScaleX` | `TState["transformScaleX"]` |  |
| `transformScaleY` | `TState["transformScaleY"]` |  |
| `rotation` | `TState["rotation"]` |  |
| `transformOriginX` | `TState["transformOriginX"]` |  |
| `transformOriginY` | `TState["transformOriginY"]` |  |

**Methods:**

#### `intersectsWith(x: number, y: number, options: Partial&lt;ElementIntersectionOptions&gt; \| undefined): boolean`

Tests whether a point intersects this shape using path-based fill and stroke hit testing.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `x` | `number` |  |
| `y` | `number` |  |
| `options` | `Partial&lt;ElementIntersectionOptions&gt; \| undefined` |  |

#### `render(context: Context&lt;globalThis.Element&gt;, callback: ((path: ContextPath) =&gt; void) \| undefined): void`

Renders this shape by creating a path, invoking the callback, and automatically applying fill/stroke or clipping.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `context` | `Context&lt;globalThis.Element&gt;` |  |
| `callback` | `((path: ContextPath) =&gt; void) \| undefined` |  |

#### `on(event: TEvent, handler: EventHandler&lt;ElementEventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |
| `handler` | `EventHandler&lt;ElementEventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `clone(): Element&lt;TState, ElementEventMap&gt;`

Creates a shallow clone of this element with the same id, classes, and state.

#### `getBoundingBox(): Box`

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### `interpolate(newState: Partial&lt;ElementInterpolationState&lt;TState&gt;&gt;, interpolators: Partial&lt;ElementInterpolators&lt;TState&gt;&gt;): Interpolator&lt;void&gt;`

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `newState` | `Partial&lt;ElementInterpolationState&lt;TState&gt;&gt;` |  |
| `interpolators` | `Partial&lt;ElementInterpolators&lt;TState&gt;&gt;` |  |

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

### ElementEventMap `interface`

Event map for elements, extending the base event map with lifecycle and interaction events.

```ts
interface ElementEventMap extends EventMap {
    graph: null;
    track: keyof ElementEventMap;
    untrack: keyof ElementEventMap;
    attached: Group;
    detached: Group;
    updated: null;
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
    destroyed: null;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `graph` | `null` |  |
| `track` | `keyof ElementEventMap` |  |
| `untrack` | `keyof ElementEventMap` |  |
| `attached` | `Group&lt;ElementEventMap&gt;` |  |
| `detached` | `Group&lt;ElementEventMap&gt;` |  |
| `updated` | `null` |  |
| `mouseenter` | `null` |  |
| `mouseleave` | `null` |  |
| `mousemove` | `{ x: number; y: number; }` |  |
| `click` | `{ x: number; y: number; }` |  |
| `dragstart` | `{ x: number; y: number; }` |  |
| `drag` | `{ x: number; y: number; startX: number; startY: number; deltaX: number; deltaY: number; }` |  |
| `dragend` | `{ x: number; y: number; startX: number; startY: number; deltaX: number; deltaY: number; }` |  |
| `destroyed` | `null` |  |
---

### ElementValidationResult `interface`

The result of validating an element, with a severity type and descriptive message.

```ts
interface ElementValidationResult {
    type: ElementValidationType;
    message: string;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `type` | `ElementValidationType` |  |
| `message` | `string` |  |
---

### GroupOptions `interface`

Options for constructing a group, extending element options with an optional initial set of children.

```ts
interface GroupOptions extends ElementOptions {
    children?: OneOrMore<Element>;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `children?` | `OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt; \| undefined` |  |
| `id?` | `string \| undefined` |  |
| `class?` | `OneOrMore&lt;string&gt; \| undefined` |  |
| `data?` | `unknown` |  |
| `pointerEvents?` | `ElementPointerEvents \| undefined` |  |
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

### RendererEventMap `interface`

Event map for the renderer, with start, stop, and per-frame tick events.

```ts
interface RendererEventMap extends EventMap {
    start: {
        startTime: number;
    };
    stop: {
        startTime: number;
        endTime: number;
    };
    tick: {
        time: number;
        deltaTime: number;
    };
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `start` | `{ startTime: number; }` |  |
| `stop` | `{ startTime: number; endTime: number; }` |  |
| `tick` | `{ time: number; deltaTime: number; }` |  |
| `destroyed` | `null` |  |
---

### RendererTransition `interface`

Internal representation of an active transition managed by the renderer.

```ts
interface RendererTransition {
    startTime: number;
    duration: number;
    ease: Ease;
    loop: boolean;
    direction: RendererTransitionDirection;
    interpolator: Interpolator<void>;
    callback(): void;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `startTime` | `number` |  |
| `duration` | `number` |  |
| `ease` | `Ease` |  |
| `loop` | `boolean` |  |
| `direction` | `TransitionDirection` |  |
| `interpolator` | `Interpolator&lt;void&gt;` |  |
| `callback` | `() =&gt; void` |  |
---

### RendererTransitionOptions `interface`

Options for scheduling a transition on one or more elements via the renderer.

```ts
interface RendererTransitionOptions<TElement extends Element> {
    duration?: number;
    ease?: Ease;
    loop?: boolean;
    delay?: number;
    direction?: RendererTransitionDirection;
    state: ElementInterpolationState<TElement extends Element<infer TState> ? TState : BaseElementState>;
    onComplete?(element: Element): void;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `duration?` | `number \| undefined` |  |
| `ease?` | `Ease \| undefined` |  |
| `loop?` | `boolean \| undefined` |  |
| `delay?` | `number \| undefined` |  |
| `direction?` | `TransitionDirection \| undefined` |  |
| `state` | `ElementInterpolationState&lt;TElement extends Element&lt;infer TState extends Partial&lt;BaseState&gt;, ElementEventMap&gt; ? TState : Partial&lt;BaseState&gt;&gt;` |  |
| `onComplete?` | `((element: Element) =&gt; void) \| undefined` |  |
---

### RendererDebugOptions `interface`

Options for enabling debug overlays on the renderer.

```ts
interface RendererDebugOptions {
    fps?: boolean;
    elementCount?: boolean;
    boundingBoxes?: boolean;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `fps?` | `boolean \| undefined` |  |
| `elementCount?` | `boolean \| undefined` |  |
| `boundingBoxes?` | `boolean \| undefined` |  |
---

### RendererOptions `interface`

Configuration for the renderer, controlling auto-start/stop behaviour and debug overlays.

```ts
interface RendererOptions {
    autoStart?: boolean;
    autoStop?: boolean;
    immediate?: boolean;
    sortBuffer?: (buffer: Element[]) => Element[];
    debug?: boolean | RendererDebugOptions;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `autoStart?` | `boolean \| undefined` |  |
| `autoStop?` | `boolean \| undefined` |  |
| `immediate?` | `boolean \| undefined` |  |
| `sortBuffer?` | `((buffer: Element[]) =&gt; Element[]) \| undefined` |  |
| `debug?` | `boolean \| RendererDebugOptions \| undefined` |  |
---

### SceneEventMap `interface`

Event map for the scene, adding a `resize` event to the standard element events.

```ts
interface SceneEventMap extends ElementEventMap {
    resize: null;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `resize` | `null` |  |
| `graph` | `null` |  |
| `track` | `keyof ElementEventMap` |  |
| `untrack` | `keyof ElementEventMap` |  |
| `attached` | `Group&lt;ElementEventMap&gt;` |  |
| `detached` | `Group&lt;ElementEventMap&gt;` |  |
| `updated` | `null` |  |
| `mouseenter` | `null` |  |
| `mouseleave` | `null` |  |
| `mousemove` | `{ x: number; y: number; }` |  |
| `click` | `{ x: number; y: number; }` |  |
| `dragstart` | `{ x: number; y: number; }` |  |
| `drag` | `{ x: number; y: number; startX: number; startY: number; deltaX: number; deltaY: number; }` |  |
| `dragend` | `{ x: number; y: number; startX: number; startY: number; deltaX: number; deltaY: number; }` |  |
| `destroyed` | `null` |  |
---

### SceneOptions `interface`

Options for constructing a scene, extending group options with an optional auto-render-on-resize flag.

```ts
interface SceneOptions extends GroupOptions {
    renderOnResize?: boolean;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `renderOnResize?` | `boolean \| undefined` |  |
| `children?` | `OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;&gt; \| undefined` |  |
| `id?` | `string \| undefined` |  |
| `class?` | `OneOrMore&lt;string&gt; \| undefined` |  |
| `data?` | `unknown` |  |
| `pointerEvents?` | `ElementPointerEvents \| undefined` |  |
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

### ElementPointerEvents `type`

Controls which pointer events an element responds to during hit testing.

```ts
type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';
```

---

### ElementValidationType `type`

Severity level of an element validation result.

```ts
type ElementValidationType = 'info' | 'warning' | 'error';
```

---

### ElementIntersectionOptions `type`

Options for element intersection (hit) testing.

```ts
type ElementIntersectionOptions = {
    isPointer: boolean;
};
```

---

### BaseElementState `type`

Base state interface for all elements. All visual properties are optional at the element level.

```ts
type BaseElementState = Partial<BaseState>;
```

---

### ElementOptions `type`

Options for constructing an element, combining an optional id, CSS classes, data, pointer events, and initial state.

```ts
type ElementOptions<TState extends BaseElementState = BaseElementState> = {
    id?: string;
    class?: OneOrMore<string>;
    data?: unknown;
    pointerEvents?: ElementPointerEvents;
} & TState;
```

---

### ElementInterpolationKeyFrame `type`

A single keyframe in a multi-step interpolation, with an optional offset (0–1) and a target value.

```ts
type ElementInterpolationKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
};
```

---

### ElementInterpolationStateValue `type`

An interpolation target: a direct value, an array of keyframes, or a custom interpolator function.

```ts
type ElementInterpolationStateValue<TValue = number> = TValue
| ElementInterpolationKeyFrame<TValue>[]
| Interpolator<TValue>;
```

---

### ElementInterpolators `type`

A map of interpolator factories keyed by state property, used to override default interpolation behaviour.

```ts
type ElementInterpolators<TState extends BaseElementState> = {
    [TKey in keyof TState]: InterpolatorFactory<TState[TKey]>;
};
```

---

### ElementInterpolationState `type`

Partial state where each property can be a target value, keyframe array, or interpolator function.

```ts
type ElementInterpolationState<TState extends BaseElementState> = {
    [TKey in keyof TState]?: ElementInterpolationStateValue<TState[TKey]>;
};
```

---

### EventMap `type`

Base event map interface; all custom event maps should extend this.

```ts
type EventMap = {
    [key: string]: unknown;
    destroyed: null;
};
```

---

### EventOptions `type`

Options for emitting an event, controlling bubbling and attached data.

```ts
type EventOptions<TData = undefined> = {
    bubbles?: boolean;
    data?: TData;
};
```

---

### EventSubscriptionOptions `type`

Options for subscribing to an event, such as filtering to self-targeted events only.

```ts
type EventSubscriptionOptions = {
    self?: boolean;
};
```

---

### EventHandler `type`

A callable event handler function with optional subscription options.

```ts
type EventHandler<TData = any> = {
    (event: Event<TData>): void;
} & EventSubscriptionOptions;
```

---

### RendererTransitionDirection `type`

Alias for the transition playback direction within the renderer.

```ts
type RendererTransitionDirection = TransitionDirection;
```

---

### RendererTransitionOptionsArg `type`

Transition options can be a static object or a per-element factory function.

```ts
type RendererTransitionOptionsArg<TElement extends Element> = RendererTransitionOptions<TElement> | ((
    element: TElement extends Group ? Element : TElement,
    index: number,
    length: number
) => RendererTransitionOptions<TElement>);
```

---

### Shape2DOptions `type`

Options for a 2D shape, adding automatic fill/stroke and clipping controls.

```ts
type Shape2DOptions<TState extends BaseElementState = BaseElementState> = ElementOptions<TState> & {
    autoStroke?: boolean;
    autoFill?: boolean;
    clip?: boolean;
};
```

---

### createElement `function`

Factory function that creates a new `Element` instance.

```ts
function createElement(...options: ConstructorParameters<typeof Element>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[type: string, ElementOptions&lt;Partial&lt;BaseState&gt;&gt;]` |  |

**Returns:** `Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt;`

---

### typeIsElement `function`

Type guard that checks whether a value is an `Element` instance.

```ts
function typeIsElement(value: unknown): value is Element
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### queryAll `function`

Queries all elements matching a CSS-like selector across the given element(s) and their descendants.

```ts
function queryAll<TElement extends Element = Element>(elements: OneOrMore<Element | Group>, selector: string)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `elements` | `OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt; \| Group&lt;ElementEventMap&gt;&gt;` |  |
| `selector` | `string` |  |

**Returns:** `TElement[]`

---

### query `function`

Returns the first element matching a CSS-like selector, or `undefined` if none match.

```ts
function query<TElement extends Element = Element>(elements: OneOrMore<Element | Group>, selector: string)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `elements` | `OneOrMore&lt;Element&lt;Partial&lt;BaseState&gt;, ElementEventMap&gt; \| Group&lt;ElementEventMap&gt;&gt;` |  |
| `selector` | `string` |  |

**Returns:** `TElement \| undefined`

---

### isGroup `function`

Type guard that checks whether a value is a `Group` instance.

```ts
function isGroup(value: unknown): value is Group
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### createGroup `function`

Factory function that creates a new `Group` instance.

```ts
function createGroup(...options: ConstructorParameters<typeof Group>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[(GroupOptions \| undefined)?]` |  |

**Returns:** `Group&lt;ElementEventMap&gt;`

---

### createRenderer `function`

Factory function that creates a new `Renderer` bound to the given scene.

```ts
function createRenderer(...options: ConstructorParameters<typeof Renderer>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[scene: Scene&lt;Context&lt;globalThis.Element&gt;&gt;, options?: RendererOptions \| undefined]` |  |

**Returns:** `Renderer`

---

### createScene `function`

Factory function that creates a new `Scene` instance from a context, selector, or element.

```ts
function createScene(...options: ConstructorParameters<typeof Scene>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[target: string \| HTMLElement \| Context&lt;globalThis.Element&gt;, options?: SceneOptions \| undefined]` |  |

**Returns:** `Scene&lt;Context&lt;globalThis.Element&gt;&gt;`

---

### createShape `function`

Factory function that creates a new `Shape2D` instance.

```ts
function createShape(...options: ConstructorParameters<typeof Shape2D>)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `[type: string, options: Shape2DOptions&lt;Partial&lt;BaseState&gt;&gt;]` |  |

**Returns:** `Shape2D&lt;Partial&lt;BaseState&gt;&gt;`

---

### elementIsShape `function`

Type guard that checks whether a value is a `Shape` instance.

```ts
function elementIsShape(value: unknown): value is Shape
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### CONTEXT_OPERATIONS `const`

Maps element state properties to their corresponding context setter functions.

```ts
const CONTEXT_OPERATIONS: { fill: (context: Context, value: string) => void; filter: (context: Context, value: string) => void; direction: (context: Context, value: NonNullable<Direction | undefined>) => void; font: (context: Context, value: string) => void; fontKerning: (context: Context, value: NonNullable<FontKerning | undefined>) => void; opacity: (context: Context, value: number) => void; globalCompositeOperation: (context: Context, value: {}) => void; lineCap: (context: Context, value: NonNullable<LineCap | undefined>) => void; lineDash: (context: Context, value: number[]) => void; lineDashOffset: (context: Context, value: number) => void; lineJoin: (context: Context, value: NonNullable<LineJoin | undefined>) => void; lineWidth: (context: Context, value: number) => void; miterLimit: (context: Context, value: number) => void; shadowBlur: (context: Context, value: number) => void; shadowColor: (context: Context, value: string) => void; shadowOffsetX: (context: Context, value: number) => void; shadowOffsetY: (context: Context, value: number) => void; stroke: (context: Context, value: string) => void; textAlign: (context: Context, value: NonNullable<TextAlignment | undefined>) => void; textBaseline: (context: Context, value: NonNullable<TextBaseline | undefined>) => void; zIndex: (context: Context, value: number) => void; translateX: (context: Context, value: number) => void; translateY: (context: Context, value: number) => void; transformScaleX: (context: Context, value: number) => void; transformScaleY: (context: Context, value: number) => void; rotation: (context: Context, value: NonNullable<Rotation | undefined>) => void; transformOriginX: (context: Context, value: NonNullable<TransformOrigin | undefined>) => void; transformOriginY: (context: Context, value: NonNullable<TransformOrigin | undefined>) => void; }
```

---

### TRANSFORM_INTERPOLATORS `const`

Interpolator factories for transform-related properties that require special interpolation (rotation, transform-origin).

```ts
const TRANSFORM_INTERPOLATORS: Record<string, InterpolatorFactory<any>>
```

---

### TRANSFORM_DEFAULTS `const`

Default numeric values for transform properties (translate, scale, rotation, transform-origin).

```ts
const TRANSFORM_DEFAULTS: Record<string, number>
```

---

### TRACKED_EVENTS `const`

DOM event types that are tracked and forwarded to elements for hit testing and interaction.

```ts
const TRACKED_EVENTS: (keyof ElementEventMap)[]
```

---

