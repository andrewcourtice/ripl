[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Group

# Class: Group\<TEventMap\>

Defined in: [packages/core/src/core/group.ts:164](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L164)

A container element that manages child elements, providing scenegraph traversal, CSS-like querying, and composite bounding boxes.

## Extends

- [`Element`](Element.md)\<[`BaseElementState`](../type-aliases/BaseElementState.md), `TEventMap`\>

## Extended by

- [`Scene`](Scene.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEventMap` *extends* [`ElementEventMap`](../interfaces/ElementEventMap.md) | [`ElementEventMap`](../interfaces/ElementEventMap.md) |

## Constructors

### Constructor

> **new Group**\<`TEventMap`\>(`__namedParameters?`): `Group`\<`TEventMap`\>

Defined in: [packages/core/src/core/group.ts:173](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L173)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters` | [`GroupOptions`](../interfaces/GroupOptions.md) |

#### Returns

`Group`\<`TEventMap`\>

#### Overrides

[`Element`](Element.md).[`constructor`](Element.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-abstract"></a> `abstract` | `public` | `boolean` | `false` | [`Element`](Element.md).[`abstract`](Element.md#property-abstract) | [packages/core/src/core/element.ts:279](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L279) |
| <a id="property-classlist"></a> `classList` | `readonly` | `Set`\<`string`\> | `undefined` | [`Element`](Element.md).[`classList`](Element.md#property-classlist) | [packages/core/src/core/element.ts:277](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L277) |
| <a id="property-context"></a> `context?` | `protected` | [`Context`](Context.md)\<`Element`\> | `undefined` | [`Element`](Element.md).[`context`](Element.md#property-context) | [packages/core/src/core/element.ts:273](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L273) |
| <a id="property-data"></a> `data` | `public` | `unknown` | `undefined` | [`Element`](Element.md).[`data`](Element.md#property-data) | [packages/core/src/core/element.ts:282](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L282) |
| <a id="property-id"></a> `id` | `public` | `string` | `undefined` | [`Element`](Element.md).[`id`](Element.md#property-id) | [packages/core/src/core/element.ts:275](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L275) |
| <a id="property-parent"></a> `parent?` | `public` | `Group`\<`TEventMap`\> | `undefined` | [`Element`](Element.md).[`parent`](Element.md#property-parent) | [packages/core/src/core/element.ts:281](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L281) |
| <a id="property-pointerevents"></a> `pointerEvents` | `public` | [`ElementPointerEvents`](../type-aliases/ElementPointerEvents.md) | `'all'` | [`Element`](Element.md).[`pointerEvents`](Element.md#property-pointerevents) | [packages/core/src/core/element.ts:280](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L280) |
| <a id="property-state"></a> `state` | `protected` | `TState` | `undefined` | [`Element`](Element.md).[`state`](Element.md#property-state) | [packages/core/src/core/element.ts:272](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L272) |
| <a id="property-type"></a> `type` | `readonly` | `string` | `undefined` | [`Element`](Element.md).[`type`](Element.md#property-type) | [packages/core/src/core/element.ts:276](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L276) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](Disposer.md#property-defaultkey) | `undefined` | [`Element`](Element.md).[`defaultKey`](Element.md#property-defaultkey) | [packages/core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Accessors

### children

#### Get Signature

> **get** **children**(): [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>[]

Defined in: [packages/core/src/core/group.ts:169](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L169)

Returns a snapshot array of this group's direct child elements.

##### Returns

[`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>[]

***

### direction

#### Get Signature

> **get** **direction**(): `TState`\[`"direction"`\]

Defined in: [packages/core/src/core/element.ts:286](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L286)

##### Returns

`TState`\[`"direction"`\]

#### Set Signature

> **set** **direction**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:290](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L290)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"direction"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`direction`](Element.md#direction)

***

### fill

#### Get Signature

> **get** **fill**(): `TState`\[`"fill"`\]

Defined in: [packages/core/src/core/element.ts:294](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L294)

##### Returns

`TState`\[`"fill"`\]

#### Set Signature

> **set** **fill**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:298](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L298)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"fill"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`fill`](Element.md#fill)

***

### filter

#### Get Signature

> **get** **filter**(): `TState`\[`"filter"`\]

Defined in: [packages/core/src/core/element.ts:302](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L302)

##### Returns

`TState`\[`"filter"`\]

#### Set Signature

> **set** **filter**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:306](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L306)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"filter"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`filter`](Element.md#filter)

***

### font

#### Get Signature

> **get** **font**(): `TState`\[`"font"`\]

Defined in: [packages/core/src/core/element.ts:310](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L310)

##### Returns

`TState`\[`"font"`\]

#### Set Signature

> **set** **font**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:314](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L314)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"font"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`font`](Element.md#font)

***

### globalCompositeOperation

#### Get Signature

> **get** **globalCompositeOperation**(): `TState`\[`"globalCompositeOperation"`\]

Defined in: [packages/core/src/core/element.ts:326](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L326)

##### Returns

`TState`\[`"globalCompositeOperation"`\]

#### Set Signature

> **set** **globalCompositeOperation**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:330](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L330)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"globalCompositeOperation"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`globalCompositeOperation`](Element.md#globalcompositeoperation)

***

### lineCap

#### Get Signature

> **get** **lineCap**(): `TState`\[`"lineCap"`\]

Defined in: [packages/core/src/core/element.ts:334](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L334)

##### Returns

`TState`\[`"lineCap"`\]

#### Set Signature

> **set** **lineCap**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:338](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L338)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineCap"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`lineCap`](Element.md#linecap)

***

### lineDash

#### Get Signature

> **get** **lineDash**(): `TState`\[`"lineDash"`\]

Defined in: [packages/core/src/core/element.ts:342](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L342)

##### Returns

`TState`\[`"lineDash"`\]

#### Set Signature

> **set** **lineDash**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:346](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L346)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineDash"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`lineDash`](Element.md#linedash)

***

### lineDashOffset

#### Get Signature

> **get** **lineDashOffset**(): `TState`\[`"lineDashOffset"`\]

Defined in: [packages/core/src/core/element.ts:350](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L350)

##### Returns

`TState`\[`"lineDashOffset"`\]

#### Set Signature

> **set** **lineDashOffset**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:354](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L354)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineDashOffset"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`lineDashOffset`](Element.md#linedashoffset)

***

### lineJoin

#### Get Signature

> **get** **lineJoin**(): `TState`\[`"lineJoin"`\]

Defined in: [packages/core/src/core/element.ts:358](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L358)

##### Returns

`TState`\[`"lineJoin"`\]

#### Set Signature

> **set** **lineJoin**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:362](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L362)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineJoin"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`lineJoin`](Element.md#linejoin)

***

### lineWidth

#### Get Signature

> **get** **lineWidth**(): `TState`\[`"lineWidth"`\]

Defined in: [packages/core/src/core/element.ts:366](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L366)

##### Returns

`TState`\[`"lineWidth"`\]

#### Set Signature

> **set** **lineWidth**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:370](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L370)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineWidth"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`lineWidth`](Element.md#linewidth)

***

### miterLimit

#### Get Signature

> **get** **miterLimit**(): `TState`\[`"miterLimit"`\]

Defined in: [packages/core/src/core/element.ts:374](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L374)

##### Returns

`TState`\[`"miterLimit"`\]

#### Set Signature

> **set** **miterLimit**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:378](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L378)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"miterLimit"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`miterLimit`](Element.md#miterlimit)

***

### opacity

#### Get Signature

> **get** **opacity**(): `TState`\[`"opacity"`\]

Defined in: [packages/core/src/core/element.ts:318](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L318)

##### Returns

`TState`\[`"opacity"`\]

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:322](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L322)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"opacity"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`opacity`](Element.md#opacity)

***

### rotation

#### Get Signature

> **get** **rotation**(): `TState`\[`"rotation"`\]

Defined in: [packages/core/src/core/element.ts:478](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L478)

##### Returns

`TState`\[`"rotation"`\]

#### Set Signature

> **set** **rotation**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:482](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L482)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"rotation"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`rotation`](Element.md#rotation)

***

### shadowBlur

#### Get Signature

> **get** **shadowBlur**(): `TState`\[`"shadowBlur"`\]

Defined in: [packages/core/src/core/element.ts:382](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L382)

##### Returns

`TState`\[`"shadowBlur"`\]

#### Set Signature

> **set** **shadowBlur**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:386](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L386)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"shadowBlur"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`shadowBlur`](Element.md#shadowblur)

***

### shadowColor

#### Get Signature

> **get** **shadowColor**(): `TState`\[`"shadowColor"`\]

Defined in: [packages/core/src/core/element.ts:390](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L390)

##### Returns

`TState`\[`"shadowColor"`\]

#### Set Signature

> **set** **shadowColor**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:394](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L394)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"shadowColor"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`shadowColor`](Element.md#shadowcolor)

***

### shadowOffsetX

#### Get Signature

> **get** **shadowOffsetX**(): `TState`\[`"shadowOffsetX"`\]

Defined in: [packages/core/src/core/element.ts:398](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L398)

##### Returns

`TState`\[`"shadowOffsetX"`\]

#### Set Signature

> **set** **shadowOffsetX**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:402](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L402)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"shadowOffsetX"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`shadowOffsetX`](Element.md#shadowoffsetx)

***

### shadowOffsetY

#### Get Signature

> **get** **shadowOffsetY**(): `TState`\[`"shadowOffsetY"`\]

Defined in: [packages/core/src/core/element.ts:406](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L406)

##### Returns

`TState`\[`"shadowOffsetY"`\]

#### Set Signature

> **set** **shadowOffsetY**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:410](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L410)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"shadowOffsetY"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`shadowOffsetY`](Element.md#shadowoffsety)

***

### stroke

#### Get Signature

> **get** **stroke**(): `TState`\[`"stroke"`\]

Defined in: [packages/core/src/core/element.ts:414](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L414)

##### Returns

`TState`\[`"stroke"`\]

#### Set Signature

> **set** **stroke**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:418](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L418)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"stroke"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`stroke`](Element.md#stroke)

***

### textAlign

#### Get Signature

> **get** **textAlign**(): `TState`\[`"textAlign"`\]

Defined in: [packages/core/src/core/element.ts:422](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L422)

##### Returns

`TState`\[`"textAlign"`\]

#### Set Signature

> **set** **textAlign**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:426](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L426)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"textAlign"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`textAlign`](Element.md#textalign)

***

### textBaseline

#### Get Signature

> **get** **textBaseline**(): `TState`\[`"textBaseline"`\]

Defined in: [packages/core/src/core/element.ts:430](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L430)

##### Returns

`TState`\[`"textBaseline"`\]

#### Set Signature

> **set** **textBaseline**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:434](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L434)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"textBaseline"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`textBaseline`](Element.md#textbaseline)

***

### transformOriginX

#### Get Signature

> **get** **transformOriginX**(): `TState`\[`"transformOriginX"`\]

Defined in: [packages/core/src/core/element.ts:486](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L486)

##### Returns

`TState`\[`"transformOriginX"`\]

#### Set Signature

> **set** **transformOriginX**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:490](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L490)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"transformOriginX"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`transformOriginX`](Element.md#transformoriginx)

***

### transformOriginY

#### Get Signature

> **get** **transformOriginY**(): `TState`\[`"transformOriginY"`\]

Defined in: [packages/core/src/core/element.ts:494](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L494)

##### Returns

`TState`\[`"transformOriginY"`\]

#### Set Signature

> **set** **transformOriginY**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:498](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L498)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"transformOriginY"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`transformOriginY`](Element.md#transformoriginy)

***

### transformScaleX

#### Get Signature

> **get** **transformScaleX**(): `TState`\[`"transformScaleX"`\]

Defined in: [packages/core/src/core/element.ts:462](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L462)

##### Returns

`TState`\[`"transformScaleX"`\]

#### Set Signature

> **set** **transformScaleX**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:466](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L466)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"transformScaleX"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`transformScaleX`](Element.md#transformscalex)

***

### transformScaleY

#### Get Signature

> **get** **transformScaleY**(): `TState`\[`"transformScaleY"`\]

Defined in: [packages/core/src/core/element.ts:470](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L470)

##### Returns

`TState`\[`"transformScaleY"`\]

#### Set Signature

> **set** **transformScaleY**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:474](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L474)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"transformScaleY"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`transformScaleY`](Element.md#transformscaley)

***

### translateX

#### Get Signature

> **get** **translateX**(): `TState`\[`"translateX"`\]

Defined in: [packages/core/src/core/element.ts:446](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L446)

##### Returns

`TState`\[`"translateX"`\]

#### Set Signature

> **set** **translateX**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:450](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L450)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"translateX"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`translateX`](Element.md#translatex)

***

### translateY

#### Get Signature

> **get** **translateY**(): `TState`\[`"translateY"`\]

Defined in: [packages/core/src/core/element.ts:454](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L454)

##### Returns

`TState`\[`"translateY"`\]

#### Set Signature

> **set** **translateY**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:458](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L458)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"translateY"`\] |

##### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`translateY`](Element.md#translatey)

***

### zIndex

#### Get Signature

> **get** **zIndex**(): `number`

Defined in: [packages/core/src/core/element.ts:438](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L438)

##### Returns

`number`

#### Set Signature

> **set** **zIndex**(`value`): `void`

Defined in: [packages/core/src/core/element.ts:442](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L442)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`zIndex`](Text.md#zindex)

## Methods

### add()

> **add**(`element`): `void`

Defined in: [packages/core/src/core/group.ts:195](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L195)

Adds one or more elements as children, re-parenting them if necessary.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`OneOrMore`](../../utilities/type-aliases/OneOrMore.md)\<[`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>\> |

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: [packages/core/src/core/group.ts:231](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L231)

Removes all children from this group.

#### Returns

`void`

***

### clone()

> **clone**(): [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>

Defined in: [packages/core/src/core/element.ts:554](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L554)

Creates a shallow clone of this element with the same id, classes, and state.

#### Returns

[`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>

#### Inherited from

[`Element`](Element.md).[`clone`](Element.md#clone)

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/core/element.ts:631](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L631)

Emits a `destroyed` event, clears all listeners, and disposes retained resources.

#### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`destroy`](Element.md#destroy)

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

[`Element`](Element.md).[`dispose`](Element.md#dispose)

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

[`Element`](Element.md).[`emit`](Element.md#emit)

#### Call Signature

> **emit**\<`TEvent`\>(`type`, `data`): [`Event`](Event.md)\<`TEventMap`\[`TEvent`\]\>

Defined in: [packages/core/src/core/event-bus.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L121)

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

[`Event`](Event.md)\<`TEventMap`\[`TEvent`\]\>

##### Inherited from

[`Element`](Element.md).[`emit`](Element.md#emit)

***

### getBoundingBox()

> **getBoundingBox**(): [`Box`](Box.md)

Defined in: [packages/core/src/core/group.ts:277](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L277)

Returns the composite bounding box enclosing all children.

#### Returns

[`Box`](Box.md)

#### Overrides

[`Element`](Element.md).[`getBoundingBox`](Element.md#getboundingbox)

***

### getElementByID()

> **getElementByID**\<`TElement`\>(`id`): `TElement`

Defined in: [packages/core/src/core/group.ts:260](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L260)

Finds a descendant element by its unique id.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TElement` *extends* [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> | [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`TElement`

***

### getElementsByClass()

> **getElementsByClass**\<`TElement`\>(`classes`): `TElement`[]

Defined in: [packages/core/src/core/group.ts:271](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L271)

Returns all descendant elements that have all of the given CSS class names.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TElement` *extends* [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> | [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `classes` | [`OneOrMore`](../../utilities/type-aliases/OneOrMore.md)\<`string`\> |

#### Returns

`TElement`[]

***

### getElementsByType()

> **getElementsByType**\<`TElement`\>(`types`): `TElement`[]

Defined in: [packages/core/src/core/group.ts:265](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L265)

Returns all descendant elements whose type matches one of the given type names.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TElement` *extends* [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> | [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `types` | [`OneOrMore`](../../utilities/type-aliases/OneOrMore.md)\<`string`\> |

#### Returns

`TElement`[]

***

### getStateValue()

> `protected` **getStateValue**\<`TKey`\>(`key`): `Partial`\<[`BaseState`](../interfaces/BaseState.md)\>\[`TKey`\]

Defined in: [packages/core/src/core/element.ts:524](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L524)

Reads a state value, falling back to the parent’s value if the local value is nil (property inheritance).

#### Type Parameters

| Type Parameter |
| ------ |
| `TKey` *extends* keyof [`BaseState`](../interfaces/BaseState.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `TKey` |

#### Returns

`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>\[`TKey`\]

#### Inherited from

[`Element`](Element.md).[`getStateValue`](Element.md#getstatevalue)

***

### graph()

> **graph**(`includeGroups?`): [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>[]

Defined in: [packages/core/src/core/group.ts:236](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L236)

Returns a flattened array of all descendant elements, optionally including intermediate groups.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `includeGroups?` | `boolean` |

#### Returns

[`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>[]

***

### has()

> **has**(`type`): `boolean`

Defined in: [packages/core/src/core/event-bus.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L77)

Returns whether there are any listeners registered for the given event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | keyof `TEventMap` |

#### Returns

`boolean`

#### Inherited from

[`Element`](Element.md).[`has`](Element.md#has)

***

### interpolate()

> **interpolate**(`newState`, `interpolators?`): [`Interpolator`](../type-aliases/Interpolator.md)\<`void`\>

Defined in: [packages/core/src/core/element.ts:574](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L574)

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `newState` | `Partial`\<[`ElementInterpolationState`](../type-aliases/ElementInterpolationState.md)\<`TState`\>\> |
| `interpolators` | `Partial`\<[`ElementInterpolators`](../type-aliases/ElementInterpolators.md)\<`TState`\>\> |

#### Returns

[`Interpolator`](../type-aliases/Interpolator.md)\<`void`\>

#### Inherited from

[`Element`](Element.md).[`interpolate`](Element.md#interpolate)

***

### intersectsWith()

> **intersectsWith**(`x`, `y`, `options?`): `boolean`

Defined in: [packages/core/src/core/element.ts:569](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L569)

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `options?` | `Partial`\<[`ElementIntersectionOptions`](../type-aliases/ElementIntersectionOptions.md)\> |

#### Returns

`boolean`

#### Inherited from

[`Element`](Element.md).[`intersectsWith`](Element.md#intersectswith)

***

### off()

> **off**\<`TEvent`\>(`type`, `handler`): `void`

Defined in: [packages/core/src/core/event-bus.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L95)

Removes a previously registered handler for the given event type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<`TEventMap`\[`TEvent`\]\> |

#### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`off`](Element.md#off)

***

### on()

> **on**\<`TEvent`\>(`event`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [packages/core/src/core/element.ts:534](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L534)

Subscribes a handler to the given event type and returns a disposable for cleanup.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<`TEventMap`\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Element`](Element.md).[`on`](Element.md#on)

***

### once()

> **once**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [packages/core/src/core/event-bus.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L110)

Subscribes a handler that is automatically removed after it fires once.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<`TEventMap`\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Element`](Element.md).[`once`](Element.md#once)

***

### query()

> **query**\<`TElement`\>(`selector`): `TElement` \| `undefined`

Defined in: [packages/core/src/core/group.ts:250](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L250)

Returns the first descendant matching the CSS-like selector, or `undefined`.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TElement` *extends* [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> | [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `string` |

#### Returns

`TElement` \| `undefined`

***

### queryAll()

> **queryAll**\<`TElement`\>(`selector`): `TElement`[]

Defined in: [packages/core/src/core/group.ts:255](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L255)

Returns all descendants matching the CSS-like selector.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TElement` *extends* [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> | [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `string` |

#### Returns

`TElement`[]

***

### remove()

> **remove**(`element`): `void`

Defined in: [packages/core/src/core/group.ts:215](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L215)

Removes one or more child elements from this group.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`OneOrMore`](../../utilities/type-aliases/OneOrMore.md)\<[`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>\> |

#### Returns

`void`

***

### render()

> **render**(`context`): `void`

Defined in: [packages/core/src/core/group.ts:282](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L282)

Renders all child elements in order within a save/restore context.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](Context.md) |

#### Returns

`void`

#### Overrides

[`Element`](Element.md).[`render`](Element.md#render)

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

[`Element`](Element.md).[`retain`](Element.md#retain)

***

### set()

> **set**(`elements`): `void`

Defined in: [packages/core/src/core/group.ts:189](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L189)

Replaces all children with the given elements.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `elements` | [`Element`](Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\>[] |

#### Returns

`void`

***

### setStateValue()

> `protected` **setStateValue**\<`TKey`\>(`key`, `value`): `void`

Defined in: [packages/core/src/core/element.ts:529](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L529)

Sets a state value and emits an `updated` event.

#### Type Parameters

| Type Parameter |
| ------ |
| `TKey` *extends* keyof [`BaseState`](../interfaces/BaseState.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `TKey` |
| `value` | `Partial`\<[`BaseState`](../interfaces/BaseState.md)\>\[`TKey`\] |

#### Returns

`void`

#### Inherited from

[`Element`](Element.md).[`setStateValue`](Element.md#setstatevalue)

***

### updateSceneGraph()

> **updateSceneGraph**(): `void`

Defined in: [packages/core/src/core/group.ts:184](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L184)

Emits a `graph` event to notify the scene that the element tree has changed.

#### Returns

`void`
