[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / AreaChart

# Class: AreaChart\<TData\>

Defined in: [charts/src/charts/area.ts:108](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/area.ts#L108)

Area chart rendering filled regions beneath series lines.

Supports stacked and unstacked modes with optional markers, crosshair,
tooltips, legend, and grid. Areas animate upward from the baseline on
entry and smoothly transition on update.

## Extends

- [`Chart`](Chart.md)\<[`AreaChartOptions`](../interfaces/AreaChartOptions.md)\<`TData`\>\>

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TData` | `unknown` | The type of each data item in the dataset. |

## Constructors

### Constructor

> **new AreaChart**\<`TData`\>(`target`, `options`): `AreaChart`\<`TData`\>

Defined in: [charts/src/charts/area.ts:119](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/area.ts#L119)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`AreaChartOptions`](../interfaces/AreaChartOptions.md)\<`TData`\> |

#### Returns

`AreaChart`\<`TData`\>

#### Overrides

[`Chart`](Chart.md).[`constructor`](Chart.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-animationoptions"></a> `animationOptions` | `protected` | [`ChartAnimationOptions`](../interfaces/ChartAnimationOptions.md) | [`Chart`](Chart.md).[`animationOptions`](Chart.md#property-animationoptions) | [charts/src/core/chart.ts:64](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L64) |
| <a id="property-autorender"></a> `autoRender` | `protected` | `boolean` | [`Chart`](Chart.md).[`autoRender`](Chart.md#property-autorender) | [charts/src/core/chart.ts:63](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L63) |
| <a id="property-colorgenerator"></a> `colorGenerator` | `protected` | `Generator`\<`string`, `string`, `any`\> | [`Chart`](Chart.md).[`colorGenerator`](Chart.md#property-colorgenerator) | [charts/src/core/chart.ts:70](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L70) |
| <a id="property-options"></a> `options` | `protected` | [`AreaChartOptions`](../interfaces/AreaChartOptions.md) | [`Chart`](Chart.md).[`options`](Chart.md#property-options) | [charts/src/core/chart.ts:69](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L69) |
| <a id="property-parent"></a> `parent?` | `public` | [`EventBus`](../../core/classes/EventBus.md)\<[`EventMap`](../../core/type-aliases/EventMap.md)\> | [`Chart`](Chart.md).[`parent`](Chart.md#property-parent) | [core/src/core/event-bus.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L72) |
| <a id="property-renderer"></a> `renderer` | `protected` | [`Renderer`](../../core/classes/Renderer.md) | [`Chart`](Chart.md).[`renderer`](Chart.md#property-renderer) | [charts/src/core/chart.ts:62](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L62) |
| <a id="property-scene"></a> `scene` | `protected` | [`Scene`](../../core/classes/Scene.md) | [`Chart`](Chart.md).[`scene`](Chart.md#property-scene) | [charts/src/core/chart.ts:61](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L61) |
| <a id="property-titleoptions"></a> `titleOptions?` | `protected` | [`ChartTitleOptions`](../interfaces/ChartTitleOptions.md) | [`Chart`](Chart.md).[`titleOptions`](Chart.md#property-titleoptions) | [charts/src/core/chart.ts:65](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L65) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](Chart.md#property-defaultkey) | [`Chart`](Chart.md).[`defaultKey`](Chart.md#property-defaultkey) | [core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [charts/src/core/chart.ts:187](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L187)

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### Returns

`void`

#### Inherited from

[`Chart`](Chart.md).[`destroy`](Chart.md#destroy)

***

### dispose()

> `protected` **dispose**(`key?`): `void`

Defined in: [core/src/core/disposer.ts:24](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L24)

Disposes all resources under the given key, or all resources if no key is provided.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key?` | `PropertyKey` |

#### Returns

`void`

#### Inherited from

[`Chart`](Chart.md).[`dispose`](Chart.md#dispose)

***

### emit()

#### Call Signature

> **emit**\<`TEvent`\>(`event`): `TEvent`

Defined in: [core/src/core/event-bus.ts:120](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L120)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEvent` *extends* [`Event`](../../core/classes/Event.md)\<`undefined`\> | [`Event`](../../core/classes/Event.md)\<`undefined`\> |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `TEvent` |

##### Returns

`TEvent`

##### Inherited from

[`Chart`](Chart.md).[`emit`](Chart.md#emit)

#### Call Signature

> **emit**\<`TEvent`\>(`type`, `data`): [`Event`](../../core/classes/Event.md)\<[`EventMap`](../../core/type-aliases/EventMap.md)\[`TEvent`\]\>

Defined in: [core/src/core/event-bus.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L121)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`EventMap`](../../core/type-aliases/EventMap.md) |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `data` | [`EventMap`](../../core/type-aliases/EventMap.md)\[`TEvent`\] |

##### Returns

[`Event`](../../core/classes/Event.md)\<[`EventMap`](../../core/type-aliases/EventMap.md)\[`TEvent`\]\>

##### Inherited from

[`Chart`](Chart.md).[`emit`](Chart.md#emit)

***

### getAnimationDuration()

> `protected` **getAnimationDuration**(`referenceDuration?`): `number`

Defined in: [charts/src/core/chart.ts:124](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L124)

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `referenceDuration` | `number` | `1000` |

#### Returns

`number`

#### Inherited from

[`Chart`](Chart.md).[`getAnimationDuration`](Chart.md#getanimationduration)

***

### getChartArea()

> `protected` **getChartArea**(): [`ChartArea`](../interfaces/ChartArea.md)

Defined in: [charts/src/core/chart.ts:155](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L155)

#### Returns

[`ChartArea`](../interfaces/ChartArea.md)

#### Inherited from

[`Chart`](Chart.md).[`getChartArea`](Chart.md#getchartarea)

***

### getPadding()

> `protected` **getPadding**(): [`ChartPadding`](../interfaces/ChartPadding.md)

Defined in: [charts/src/core/chart.ts:145](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L145)

#### Returns

[`ChartPadding`](../interfaces/ChartPadding.md)

#### Inherited from

[`Chart`](Chart.md).[`getPadding`](Chart.md#getpadding)

***

### getSeriesColor()

> `protected` **getSeriesColor**(`seriesId`): `string`

Defined in: [charts/src/core/chart.ts:182](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L182)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `seriesId` | `string` |

#### Returns

`string`

#### Inherited from

[`Chart`](Chart.md).[`getSeriesColor`](Chart.md#getseriescolor)

***

### has()

> **has**(`type`): `boolean`

Defined in: [core/src/core/event-bus.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L77)

Returns whether there are any listeners registered for the given event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | keyof [`EventMap`](../../core/type-aliases/EventMap.md) |

#### Returns

`boolean`

#### Inherited from

[`Chart`](Chart.md).[`has`](Chart.md#has)

***

### init()

> `protected` **init**(): `void`

Defined in: [charts/src/core/chart.ts:92](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L92)

#### Returns

`void`

#### Inherited from

[`Chart`](Chart.md).[`init`](Chart.md#init)

***

### off()

> **off**\<`TEvent`\>(`type`, `handler`): `void`

Defined in: [core/src/core/event-bus.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L95)

Removes a previously registered handler for the given event type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`EventMap`](../../core/type-aliases/EventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`EventMap`](../../core/type-aliases/EventMap.md)\[`TEvent`\]\> |

#### Returns

`void`

#### Inherited from

[`Chart`](Chart.md).[`off`](Chart.md#off)

***

### on()

> **on**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [core/src/core/event-bus.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L82)

Subscribes a handler to the given event type and returns a disposable for cleanup.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`EventMap`](../../core/type-aliases/EventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`EventMap`](../../core/type-aliases/EventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../../core/type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Chart`](Chart.md).[`on`](Chart.md#on)

***

### once()

> **once**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [core/src/core/event-bus.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L110)

Subscribes a handler that is automatically removed after it fires once.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`EventMap`](../../core/type-aliases/EventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`EventMap`](../../core/type-aliases/EventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../../core/type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Chart`](Chart.md).[`once`](Chart.md#once)

***

### render()

> **render**(): `Promise`\<`void`\>

Defined in: [charts/src/charts/area.ts:513](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/area.ts#L513)

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Chart`](Chart.md).[`render`](Chart.md#render)

***

### resolveSeriesColors()

> `protected` **resolveSeriesColors**(`series`): `void`

Defined in: [charts/src/core/chart.ts:167](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L167)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `series` | `object`[] |

#### Returns

`void`

#### Inherited from

[`Chart`](Chart.md).[`resolveSeriesColors`](Chart.md#resolveseriescolors)

***

### retain()

> `protected` **retain**(`value`, `key?`): `void`

Defined in: [core/src/core/disposer.ts:13](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L13)

Registers a disposable resource under an optional key for later cleanup.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `value` | [`Disposable`](../../utilities/interfaces/Disposable.md) | `undefined` |
| `key` | `PropertyKey` | `Disposer.defaultKey` |

#### Returns

`void`

#### Inherited from

[`Chart`](Chart.md).[`retain`](Chart.md#retain)

***

### update()

> **update**(`options`): `void`

Defined in: [charts/src/core/chart.ts:105](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L105)

Merges partial options into the current options and re-renders if `autoRender` is enabled.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `Partial`\<`TOptions`\> |

#### Returns

`void`

#### Inherited from

[`Chart`](Chart.md).[`update`](Chart.md#update)
