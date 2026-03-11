[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Renderer

# Class: Renderer

Defined in: [packages/core/src/core/renderer.ts:128](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L128)

Drives the animation loop via `requestAnimationFrame`, managing per-element transitions and rendering the scene each frame.

## Extends

- [`EventBus`](EventBus.md)\<[`RendererEventMap`](../interfaces/RendererEventMap.md)\>

## Constructors

### Constructor

> **new Renderer**(`scene`, `options?`): `Renderer`

Defined in: [packages/core/src/core/renderer.ts:152](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L152)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scene` | [`Scene`](Scene.md) |
| `options?` | [`RendererOptions`](../interfaces/RendererOptions.md) |

#### Returns

`Renderer`

#### Overrides

[`EventBus`](EventBus.md).[`constructor`](EventBus.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-autostart"></a> `autoStart` | `public` | `boolean` | `true` | - | [packages/core/src/core/renderer.ts:143](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L143) |
| <a id="property-autostop"></a> `autoStop` | `public` | `boolean` | `true` | - | [packages/core/src/core/renderer.ts:144](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L144) |
| <a id="property-parent"></a> `parent?` | `public` | [`EventBus`](EventBus.md)\<[`RendererEventMap`](../interfaces/RendererEventMap.md)\> | `undefined` | [`EventBus`](EventBus.md).[`parent`](EventBus.md#property-parent) | [packages/core/src/core/event-bus.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L72) |
| <a id="property-sortbuffer"></a> `sortBuffer?` | `public` | (`buffer`) => [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>[] | `undefined` | - | [packages/core/src/core/renderer.ts:145](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L145) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](Disposer.md#property-defaultkey) | `undefined` | [`EventBus`](EventBus.md).[`defaultKey`](EventBus.md#property-defaultkey) | [packages/core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Accessors

### isBusy

#### Get Signature

> **get** **isBusy**(): `boolean`

Defined in: [packages/core/src/core/renderer.ts:148](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L148)

Whether there are any active transitions in progress.

##### Returns

`boolean`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/core/renderer.ts:425](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L425)

Stops the renderer and destroys all event subscriptions.

#### Returns

`void`

#### Overrides

[`EventBus`](EventBus.md).[`destroy`](EventBus.md#destroy)

***

### dispose()

> `protected` **dispose**(`key?`): `void`

Defined in: [packages/core/src/core/disposer.ts:24](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L24)

Disposes all resources under the given key, or all resources if no key is provided.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key?` | `PropertyKey` |

#### Returns

`void`

#### Inherited from

[`EventBus`](EventBus.md).[`dispose`](EventBus.md#dispose)

***

### emit()

#### Call Signature

> **emit**\<`TEvent`\>(`event`): `TEvent`

Defined in: [packages/core/src/core/event-bus.ts:120](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L120)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEvent` *extends* [`Event`](Event.md)\<`undefined`\> | [`Event`](Event.md)\<`undefined`\> |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `TEvent` |

##### Returns

`TEvent`

##### Inherited from

[`EventBus`](EventBus.md).[`emit`](EventBus.md#emit)

#### Call Signature

> **emit**\<`TEvent`\>(`type`, `data`): [`Event`](Event.md)\<[`RendererEventMap`](../interfaces/RendererEventMap.md)\[`TEvent`\]\>

Defined in: [packages/core/src/core/event-bus.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L121)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`RendererEventMap`](../interfaces/RendererEventMap.md) |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `data` | [`RendererEventMap`](../interfaces/RendererEventMap.md)\[`TEvent`\] |

##### Returns

[`Event`](Event.md)\<[`RendererEventMap`](../interfaces/RendererEventMap.md)\[`TEvent`\]\>

##### Inherited from

[`EventBus`](EventBus.md).[`emit`](EventBus.md#emit)

***

### has()

> **has**(`type`): `boolean`

Defined in: [packages/core/src/core/event-bus.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L77)

Returns whether there are any listeners registered for the given event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | keyof [`RendererEventMap`](../interfaces/RendererEventMap.md) |

#### Returns

`boolean`

#### Inherited from

[`EventBus`](EventBus.md).[`has`](EventBus.md#has)

***

### off()

> **off**\<`TEvent`\>(`type`, `handler`): `void`

Defined in: [packages/core/src/core/event-bus.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L95)

Removes a previously registered handler for the given event type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`RendererEventMap`](../interfaces/RendererEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`RendererEventMap`](../interfaces/RendererEventMap.md)\[`TEvent`\]\> |

#### Returns

`void`

#### Inherited from

[`EventBus`](EventBus.md).[`off`](EventBus.md#off)

***

### on()

> **on**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [packages/core/src/core/event-bus.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L82)

Subscribes a handler to the given event type and returns a disposable for cleanup.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`RendererEventMap`](../interfaces/RendererEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`RendererEventMap`](../interfaces/RendererEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`EventBus`](EventBus.md).[`on`](EventBus.md#on)

***

### once()

> **once**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [packages/core/src/core/event-bus.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L110)

Subscribes a handler that is automatically removed after it fires once.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`RendererEventMap`](../interfaces/RendererEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`RendererEventMap`](../interfaces/RendererEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`EventBus`](EventBus.md).[`once`](EventBus.md#once)

***

### retain()

> `protected` **retain**(`value`, `key?`): `void`

Defined in: [packages/core/src/core/disposer.ts:13](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L13)

Registers a disposable resource under an optional key for later cleanup.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `value` | [`Disposable`](../../utilities/interfaces/Disposable.md) | `undefined` |
| `key` | `PropertyKey` | `Disposer.defaultKey` |

#### Returns

`void`

#### Inherited from

[`EventBus`](EventBus.md).[`retain`](EventBus.md#retain)

***

### start()

> **start**(): `void`

Defined in: [packages/core/src/core/renderer.ts:259](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L259)

Starts the animation loop if it is not already running.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/core/src/core/renderer.ts:276](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L276)

Stops the animation loop, cancels pending frames, and clears all transitions.

#### Returns

`void`

***

### transition()

> **transition**\<`TElement`\>(`element`, `options?`): [`Transition`](Transition.md)

Defined in: [packages/core/src/core/renderer.ts:301](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L301)

Schedules an animated transition for one or more elements, returning a `Transition` that resolves when all complete.

#### Type Parameters

| Type Parameter |
| ------ |
| `TElement` *extends* [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`OneOrMore`](../../utilities/type-aliases/OneOrMore.md)\<`TElement`\> |
| `options?` | [`RendererTransitionOptionsArg`](../type-aliases/RendererTransitionOptionsArg.md)\<`TElement`\> |

#### Returns

[`Transition`](Transition.md)
