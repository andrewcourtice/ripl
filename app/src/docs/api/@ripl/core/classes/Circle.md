[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Circle

# Class: Circle

Defined in: [packages/core/src/elements/circle.ts:23](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L23)

A circle shape rendered at a center point with a given radius.

## Extends

- [`Shape2D`](Shape2D.md)\<[`CircleState`](../interfaces/CircleState.md)\>

## Constructors

### Constructor

> **new Circle**(`options`): `Circle`

Defined in: [packages/core/src/elements/circle.ts:49](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L49)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`Shape2DOptions`](../type-aliases/Shape2DOptions.md)\<[`CircleState`](../interfaces/CircleState.md)\> |

#### Returns

`Circle`

#### Overrides

[`Shape2D`](Shape2D.md).[`constructor`](Shape2D.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-abstract"></a> `abstract` | `public` | `boolean` | `false` | [`Shape2D`](Shape2D.md).[`abstract`](Shape2D.md#property-abstract) | [packages/core/src/core/element.ts:279](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L279) |
| <a id="property-autofill"></a> `autoFill` | `public` | `boolean` | `undefined` | [`Shape2D`](Shape2D.md).[`autoFill`](Shape2D.md#property-autofill) | [packages/core/src/core/shape.ts:35](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/shape.ts#L35) |
| <a id="property-autostroke"></a> `autoStroke` | `public` | `boolean` | `undefined` | [`Shape2D`](Shape2D.md).[`autoStroke`](Shape2D.md#property-autostroke) | [packages/core/src/core/shape.ts:34](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/shape.ts#L34) |
| <a id="property-classlist"></a> `classList` | `readonly` | `Set`\<`string`\> | `undefined` | [`Shape2D`](Shape2D.md).[`classList`](Shape2D.md#property-classlist) | [packages/core/src/core/element.ts:277](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L277) |
| <a id="property-clip"></a> `clip` | `public` | `boolean` | `undefined` | [`Shape2D`](Shape2D.md).[`clip`](Shape2D.md#property-clip) | [packages/core/src/core/shape.ts:36](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/shape.ts#L36) |
| <a id="property-context"></a> `context?` | `protected` | [`Context`](Context.md)\<`Element`\> | `undefined` | [`Shape2D`](Shape2D.md).[`context`](Shape2D.md#property-context) | [packages/core/src/core/element.ts:273](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L273) |
| <a id="property-data"></a> `data` | `public` | `unknown` | `undefined` | [`Shape2D`](Shape2D.md).[`data`](Shape2D.md#property-data) | [packages/core/src/core/element.ts:282](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L282) |
| <a id="property-id"></a> `id` | `public` | `string` | `undefined` | [`Shape2D`](Shape2D.md).[`id`](Shape2D.md#property-id) | [packages/core/src/core/element.ts:275](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L275) |
| <a id="property-parent"></a> `parent?` | `public` | [`Group`](Group.md)\<[`ElementEventMap`](../interfaces/ElementEventMap.md)\> | `undefined` | [`Shape2D`](Shape2D.md).[`parent`](Shape2D.md#property-parent) | [packages/core/src/core/element.ts:281](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L281) |
| <a id="property-path"></a> `path?` | `protected` | [`ContextPath`](ContextPath.md) | `undefined` | [`Shape2D`](Shape2D.md).[`path`](Shape2D.md#property-path) | [packages/core/src/core/shape.ts:32](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/shape.ts#L32) |
| <a id="property-pointerevents"></a> `pointerEvents` | `public` | [`ElementPointerEvents`](../type-aliases/ElementPointerEvents.md) | `'all'` | [`Shape2D`](Shape2D.md).[`pointerEvents`](Shape2D.md#property-pointerevents) | [packages/core/src/core/element.ts:280](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L280) |
| <a id="property-state"></a> `state` | `protected` | [`CircleState`](../interfaces/CircleState.md) | `undefined` | [`Shape2D`](Shape2D.md).[`state`](Shape2D.md#property-state) | [packages/core/src/core/element.ts:272](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L272) |
| <a id="property-type"></a> `type` | `readonly` | `string` | `undefined` | [`Shape2D`](Shape2D.md).[`type`](Shape2D.md#property-type) | [packages/core/src/core/element.ts:276](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L276) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](Disposer.md#property-defaultkey) | `undefined` | [`Shape2D`](Shape2D.md).[`defaultKey`](Shape2D.md#property-defaultkey) | [packages/core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Accessors

### cx

#### Get Signature

> **get** **cx**(): `number`

Defined in: [packages/core/src/elements/circle.ts:25](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L25)

##### Returns

`number`

#### Set Signature

> **set** **cx**(`value`): `void`

Defined in: [packages/core/src/elements/circle.ts:29](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L29)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### cy

#### Get Signature

> **get** **cy**(): `number`

Defined in: [packages/core/src/elements/circle.ts:33](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L33)

##### Returns

`number`

#### Set Signature

> **set** **cy**(`value`): `void`

Defined in: [packages/core/src/elements/circle.ts:37](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L37)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

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

[`Shape2D`](Shape2D.md).[`direction`](Shape2D.md#direction)

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

[`Shape2D`](Shape2D.md).[`fill`](Shape2D.md#fill)

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

[`Shape2D`](Shape2D.md).[`filter`](Shape2D.md#filter)

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

[`Shape2D`](Shape2D.md).[`font`](Shape2D.md#font)

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

[`Shape2D`](Shape2D.md).[`globalCompositeOperation`](Shape2D.md#globalcompositeoperation)

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

[`Shape2D`](Shape2D.md).[`lineCap`](Shape2D.md#linecap)

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

[`Shape2D`](Shape2D.md).[`lineDash`](Shape2D.md#linedash)

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

[`Shape2D`](Shape2D.md).[`lineDashOffset`](Shape2D.md#linedashoffset)

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

[`Shape2D`](Shape2D.md).[`lineJoin`](Shape2D.md#linejoin)

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

[`Shape2D`](Shape2D.md).[`lineWidth`](Shape2D.md#linewidth)

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

[`Shape2D`](Shape2D.md).[`miterLimit`](Shape2D.md#miterlimit)

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

[`Shape2D`](Shape2D.md).[`opacity`](Shape2D.md#opacity)

***

### radius

#### Get Signature

> **get** **radius**(): `number`

Defined in: [packages/core/src/elements/circle.ts:41](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L41)

##### Returns

`number`

#### Set Signature

> **set** **radius**(`value`): `void`

Defined in: [packages/core/src/elements/circle.ts:45](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L45)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

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

[`Shape2D`](Shape2D.md).[`rotation`](Shape2D.md#rotation)

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

[`Shape2D`](Shape2D.md).[`shadowBlur`](Shape2D.md#shadowblur)

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

[`Shape2D`](Shape2D.md).[`shadowColor`](Shape2D.md#shadowcolor)

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

[`Shape2D`](Shape2D.md).[`shadowOffsetX`](Shape2D.md#shadowoffsetx)

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

[`Shape2D`](Shape2D.md).[`shadowOffsetY`](Shape2D.md#shadowoffsety)

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

[`Shape2D`](Shape2D.md).[`stroke`](Shape2D.md#stroke)

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

[`Shape2D`](Shape2D.md).[`textAlign`](Shape2D.md#textalign)

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

[`Shape2D`](Shape2D.md).[`textBaseline`](Shape2D.md#textbaseline)

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

[`Shape2D`](Shape2D.md).[`transformOriginX`](Shape2D.md#transformoriginx)

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

[`Shape2D`](Shape2D.md).[`transformOriginY`](Shape2D.md#transformoriginy)

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

[`Shape2D`](Shape2D.md).[`transformScaleX`](Shape2D.md#transformscalex)

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

[`Shape2D`](Shape2D.md).[`transformScaleY`](Shape2D.md#transformscaley)

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

[`Shape2D`](Shape2D.md).[`translateX`](Shape2D.md#translatex)

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

[`Shape2D`](Shape2D.md).[`translateY`](Shape2D.md#translatey)

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

[`Shape2D`](Shape2D.md).[`zIndex`](Shape2D.md#zindex)

## Methods

### clone()

> **clone**(): [`Element`](Element.md)\<[`CircleState`](../interfaces/CircleState.md), [`ElementEventMap`](../interfaces/ElementEventMap.md)\>

Defined in: [packages/core/src/core/element.ts:554](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L554)

Creates a shallow clone of this element with the same id, classes, and state.

#### Returns

[`Element`](Element.md)\<[`CircleState`](../interfaces/CircleState.md), [`ElementEventMap`](../interfaces/ElementEventMap.md)\>

#### Inherited from

[`Shape2D`](Shape2D.md).[`clone`](Shape2D.md#clone)

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/core/element.ts:631](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L631)

Emits a `destroyed` event, clears all listeners, and disposes retained resources.

#### Returns

`void`

#### Inherited from

[`Shape2D`](Shape2D.md).[`destroy`](Shape2D.md#destroy)

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

[`Shape2D`](Shape2D.md).[`dispose`](Shape2D.md#dispose)

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

[`Shape2D`](Shape2D.md).[`emit`](Shape2D.md#emit)

#### Call Signature

> **emit**\<`TEvent`\>(`type`, `data`): [`Event`](Event.md)\<[`ElementEventMap`](../interfaces/ElementEventMap.md)\[`TEvent`\]\>

Defined in: [packages/core/src/core/event-bus.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L121)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ElementEventMap`](../interfaces/ElementEventMap.md) |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `data` | [`ElementEventMap`](../interfaces/ElementEventMap.md)\[`TEvent`\] |

##### Returns

[`Event`](Event.md)\<[`ElementEventMap`](../interfaces/ElementEventMap.md)\[`TEvent`\]\>

##### Inherited from

[`Shape2D`](Shape2D.md).[`emit`](Shape2D.md#emit)

***

### getBoundingBox()

> **getBoundingBox**(): [`Box`](Box.md)

Defined in: [packages/core/src/elements/circle.ts:53](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L53)

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### Returns

[`Box`](Box.md)

#### Overrides

[`Shape2D`](Shape2D.md).[`getBoundingBox`](Shape2D.md#getboundingbox)

***

### getStateValue()

> `protected` **getStateValue**\<`TKey`\>(`key`): [`CircleState`](../interfaces/CircleState.md)\[`TKey`\]

Defined in: [packages/core/src/core/element.ts:524](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L524)

Reads a state value, falling back to the parent’s value if the local value is nil (property inheritance).

#### Type Parameters

| Type Parameter |
| ------ |
| `TKey` *extends* keyof [`CircleState`](../interfaces/CircleState.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `TKey` |

#### Returns

[`CircleState`](../interfaces/CircleState.md)\[`TKey`\]

#### Inherited from

[`Shape2D`](Shape2D.md).[`getStateValue`](Shape2D.md#getstatevalue)

***

### has()

> **has**(`type`): `boolean`

Defined in: [packages/core/src/core/event-bus.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L77)

Returns whether there are any listeners registered for the given event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | keyof [`ElementEventMap`](../interfaces/ElementEventMap.md) |

#### Returns

`boolean`

#### Inherited from

[`Shape2D`](Shape2D.md).[`has`](Shape2D.md#has)

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

[`Shape2D`](Shape2D.md).[`interpolate`](Shape2D.md#interpolate)

***

### intersectsWith()

> **intersectsWith**(`x`, `y`, `options?`): `boolean`

Defined in: [packages/core/src/core/shape.ts:54](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/shape.ts#L54)

Tests whether a point intersects this shape using path-based fill and stroke hit testing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `options?` | `Partial`\<[`ElementIntersectionOptions`](../type-aliases/ElementIntersectionOptions.md)\> |

#### Returns

`boolean`

#### Inherited from

[`Shape2D`](Shape2D.md).[`intersectsWith`](Shape2D.md#intersectswith)

***

### off()

> **off**\<`TEvent`\>(`type`, `handler`): `void`

Defined in: [packages/core/src/core/event-bus.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L95)

Removes a previously registered handler for the given event type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ElementEventMap`](../interfaces/ElementEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`ElementEventMap`](../interfaces/ElementEventMap.md)\[`TEvent`\]\> |

#### Returns

`void`

#### Inherited from

[`Shape2D`](Shape2D.md).[`off`](Shape2D.md#off)

***

### on()

> **on**\<`TEvent`\>(`event`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [packages/core/src/core/element.ts:534](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L534)

Subscribes a handler to the given event type and returns a disposable for cleanup.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ElementEventMap`](../interfaces/ElementEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`ElementEventMap`](../interfaces/ElementEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Shape2D`](Shape2D.md).[`on`](Shape2D.md#on)

***

### once()

> **once**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [packages/core/src/core/event-bus.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L110)

Subscribes a handler that is automatically removed after it fires once.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ElementEventMap`](../interfaces/ElementEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`ElementEventMap`](../interfaces/ElementEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Shape2D`](Shape2D.md).[`once`](Shape2D.md#once)

***

### render()

> **render**(`context`): `void`

Defined in: [packages/core/src/elements/circle.ts:62](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/elements/circle.ts#L62)

Renders this shape by creating a path, invoking the callback, and automatically applying fill/stroke or clipping.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](Context.md) |

#### Returns

`void`

#### Overrides

[`Shape2D`](Shape2D.md).[`render`](Shape2D.md#render)

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

[`Shape2D`](Shape2D.md).[`retain`](Shape2D.md#retain)

***

### setStateValue()

> `protected` **setStateValue**\<`TKey`\>(`key`, `value`): `void`

Defined in: [packages/core/src/core/element.ts:529](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L529)

Sets a state value and emits an `updated` event.

#### Type Parameters

| Type Parameter |
| ------ |
| `TKey` *extends* keyof [`CircleState`](../interfaces/CircleState.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `TKey` |
| `value` | [`CircleState`](../interfaces/CircleState.md)\[`TKey`\] |

#### Returns

`void`

#### Inherited from

[`Shape2D`](Shape2D.md).[`setStateValue`](Shape2D.md#setstatevalue)
