[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / Chart

# Class: Chart\<TOptions, TEventMap\>

Defined in: [charts/src/core/chart.ts:56](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L56)

Abstract base class for all chart types, providing scene, renderer, animation, color management, and lifecycle.

## Extends

- [`EventBus`](../../core/classes/EventBus.md)\<`TEventMap`\>

## Extended by

- [`AreaChart`](AreaChart.md)
- [`BarChart`](BarChart.md)
- [`ChordChart`](ChordChart.md)
- [`FunnelChart`](FunnelChart.md)
- [`GanttChart`](GanttChart.md)
- [`GaugeChart`](GaugeChart.md)
- [`HeatmapChart`](HeatmapChart.md)
- [`LineChart`](LineChart.md)
- [`PieChart`](PieChart.md)
- [`PolarAreaChart`](PolarAreaChart.md)
- [`RadarChart`](RadarChart.md)
- [`SankeyChart`](SankeyChart.md)
- [`ScatterChart`](ScatterChart.md)
- [`StockChart`](StockChart.md)
- [`SunburstChart`](SunburstChart.md)
- [`TreemapChart`](TreemapChart.md)
- [`RealtimeChart`](RealtimeChart.md)
- [`TrendChart`](TrendChart.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOptions` *extends* [`BaseChartOptions`](../interfaces/BaseChartOptions.md) | - |
| `TEventMap` *extends* [`EventMap`](../../core/type-aliases/EventMap.md) | [`EventMap`](../../core/type-aliases/EventMap.md) |

## Constructors

### Constructor

> **new Chart**\<`TOptions`, `TEventMap`\>(`target`, `options?`): `Chart`\<`TOptions`, `TEventMap`\>

Defined in: [charts/src/core/chart.ts:73](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L73)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options?` | `TOptions` |

#### Returns

`Chart`\<`TOptions`, `TEventMap`\>

#### Overrides

[`EventBus`](../../core/classes/EventBus.md).[`constructor`](../../core/classes/EventBus.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-animationoptions"></a> `animationOptions` | `protected` | [`ChartAnimationOptions`](../interfaces/ChartAnimationOptions.md) | - | [charts/src/core/chart.ts:64](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L64) |
| <a id="property-autorender"></a> `autoRender` | `protected` | `boolean` | - | [charts/src/core/chart.ts:63](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L63) |
| <a id="property-colorgenerator"></a> `colorGenerator` | `protected` | `Generator`\<`string`, `string`, `any`\> | - | [charts/src/core/chart.ts:70](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L70) |
| <a id="property-options"></a> `options` | `protected` | `TOptions` | - | [charts/src/core/chart.ts:69](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L69) |
| <a id="property-parent"></a> `parent?` | `public` | [`EventBus`](../../core/classes/EventBus.md)\<`TEventMap`\> | [`EventBus`](../../core/classes/EventBus.md).[`parent`](../../core/classes/EventBus.md#property-parent) | [core/src/core/event-bus.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L72) |
| <a id="property-renderer"></a> `renderer` | `protected` | [`Renderer`](../../core/classes/Renderer.md) | - | [charts/src/core/chart.ts:62](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L62) |
| <a id="property-scene"></a> `scene` | `protected` | [`Scene`](../../core/classes/Scene.md) | - | [charts/src/core/chart.ts:61](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L61) |
| <a id="property-titleoptions"></a> `titleOptions?` | `protected` | [`ChartTitleOptions`](../interfaces/ChartTitleOptions.md) | - | [charts/src/core/chart.ts:65](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L65) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](#property-defaultkey) | [`EventBus`](../../core/classes/EventBus.md).[`defaultKey`](../../core/classes/EventBus.md#property-defaultkey) | [core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [charts/src/core/chart.ts:187](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L187)

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### Returns

`void`

#### Overrides

[`EventBus`](../../core/classes/EventBus.md).[`destroy`](../../core/classes/EventBus.md#destroy)

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

[`EventBus`](../../core/classes/EventBus.md).[`dispose`](../../core/classes/EventBus.md#dispose)

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

[`EventBus`](../../core/classes/EventBus.md).[`emit`](../../core/classes/EventBus.md#emit)

#### Call Signature

> **emit**\<`TEvent`\>(`type`, `data`): [`Event`](../../core/classes/Event.md)\<`TEventMap`\[`TEvent`\]\>

Defined in: [core/src/core/event-bus.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L121)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* `string` \| `number` \| `symbol` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `data` | `TEventMap`\[`TEvent`\] |

##### Returns

[`Event`](../../core/classes/Event.md)\<`TEventMap`\[`TEvent`\]\>

##### Inherited from

[`EventBus`](../../core/classes/EventBus.md).[`emit`](../../core/classes/EventBus.md#emit)

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

***

### getChartArea()

> `protected` **getChartArea**(): [`ChartArea`](../interfaces/ChartArea.md)

Defined in: [charts/src/core/chart.ts:155](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L155)

#### Returns

[`ChartArea`](../interfaces/ChartArea.md)

***

### getPadding()

> `protected` **getPadding**(): [`ChartPadding`](../interfaces/ChartPadding.md)

Defined in: [charts/src/core/chart.ts:145](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L145)

#### Returns

[`ChartPadding`](../interfaces/ChartPadding.md)

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

***

### has()

> **has**(`type`): `boolean`

Defined in: [core/src/core/event-bus.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L77)

Returns whether there are any listeners registered for the given event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | keyof `TEventMap` |

#### Returns

`boolean`

#### Inherited from

[`EventBus`](../../core/classes/EventBus.md).[`has`](../../core/classes/EventBus.md#has)

***

### init()

> `protected` **init**(): `void`

Defined in: [charts/src/core/chart.ts:92](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L92)

#### Returns

`void`

***

### off()

> **off**\<`TEvent`\>(`type`, `handler`): `void`

Defined in: [core/src/core/event-bus.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L95)

Removes a previously registered handler for the given event type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<`TEventMap`\[`TEvent`\]\> |

#### Returns

`void`

#### Inherited from

[`EventBus`](../../core/classes/EventBus.md).[`off`](../../core/classes/EventBus.md#off)

***

### on()

> **on**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [core/src/core/event-bus.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L82)

Subscribes a handler to the given event type and returns a disposable for cleanup.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<`TEventMap`\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../../core/type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`EventBus`](../../core/classes/EventBus.md).[`on`](../../core/classes/EventBus.md#on)

***

### once()

> **once**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [core/src/core/event-bus.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L110)

Subscribes a handler that is automatically removed after it fires once.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<`TEventMap`\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../../core/type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`EventBus`](../../core/classes/EventBus.md).[`once`](../../core/classes/EventBus.md#once)

***

### render()

> **render**(`callback?`): `Promise`\<`void`\>

Defined in: [charts/src/core/chart.ts:134](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L134)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | (`scene`, `renderer`) => `Promise`\<`any`\> |

#### Returns

`Promise`\<`void`\>

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

[`EventBus`](../../core/classes/EventBus.md).[`retain`](../../core/classes/EventBus.md#retain)

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
