[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Event

# Class: Event\<TData\>

Defined in: [packages/core/src/core/event-bus.ts:34](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L34)

An event object carrying type, data, target reference, and propagation control.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `undefined` |

## Constructors

### Constructor

> **new Event**\<`TData`\>(`type`, `target`, `options?`): `Event`\<`TData`\>

Defined in: [packages/core/src/core/event-bus.ts:49](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L49)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `string` |
| `target` | [`EventBus`](EventBus.md)\<`any`\> |
| `options?` | [`EventOptions`](../type-aliases/EventOptions.md)\<`TData`\> |

#### Returns

`Event`\<`TData`\>

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data"></a> `data` | `readonly` | `TData` | [packages/core/src/core/event-bus.ts:39](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L39) |
| <a id="property-target"></a> `target` | `readonly` | [`EventBus`](EventBus.md)\<`any`\> | [packages/core/src/core/event-bus.ts:42](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L42) |
| <a id="property-timestamp"></a> `timestamp` | `readonly` | `number` | [packages/core/src/core/event-bus.ts:40](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L40) |
| <a id="property-type"></a> `type` | `readonly` | `string` | [packages/core/src/core/event-bus.ts:38](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L38) |

## Accessors

### bubbles

#### Get Signature

> **get** **bubbles**(): `boolean`

Defined in: [packages/core/src/core/event-bus.ts:44](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L44)

##### Returns

`boolean`

## Methods

### stopPropagation()

> **stopPropagation**(): `void`

Defined in: [packages/core/src/core/event-bus.ts:63](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L63)

Prevents this event from bubbling further up the parent chain.

#### Returns

`void`
