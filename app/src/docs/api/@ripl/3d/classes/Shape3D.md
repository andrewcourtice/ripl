[Documentation](../../../packages.md) / [@ripl/3d](../index.md) / Shape3D

# Class: Shape3D\<TState\>

Defined in: [3d/src/core/shape.ts:80](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L80)

Base class for 3D shapes, handling model transforms, face projection, shading, and hit testing.

## Extends

- [`Shape`](../../core/classes/Shape.md)\<`TState`\>

## Extended by

- [`Cube`](Cube.md)
- [`Sphere`](Sphere.md)
- [`Cylinder`](Cylinder.md)
- [`Cone`](Cone.md)
- [`Plane`](Plane.md)
- [`Torus`](Torus.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* [`Shape3DState`](../interfaces/Shape3DState.md) | [`Shape3DState`](../interfaces/Shape3DState.md) |

## Constructors

### Constructor

> **new Shape3D**\<`TState`\>(`type`, `options`): `Shape3D`\<`TState`\>

Defined in: [3d/src/core/shape.ts:143](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L143)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `string` |
| `options` | [`Shape3DOptions`](../type-aliases/Shape3DOptions.md)\<`TState`\> |

#### Returns

`Shape3D`\<`TState`\>

#### Overrides

[`Shape`](../../core/classes/Shape.md).[`constructor`](../../core/classes/Shape.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-abstract"></a> `abstract` | `public` | `boolean` | `false` | [`Shape`](../../core/classes/Shape.md).[`abstract`](../../core/classes/Shape.md#property-abstract) | [core/src/core/element.ts:279](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L279) |
| <a id="property-classlist"></a> `classList` | `readonly` | `Set`\<`string`\> | `undefined` | [`Shape`](../../core/classes/Shape.md).[`classList`](../../core/classes/Shape.md#property-classlist) | [core/src/core/element.ts:277](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L277) |
| <a id="property-context"></a> `context?` | `protected` | [`Context`](../../core/classes/Context.md)\<`Element`\> | `undefined` | [`Shape`](../../core/classes/Shape.md).[`context`](../../core/classes/Shape.md#property-context) | [core/src/core/element.ts:273](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L273) |
| <a id="property-data"></a> `data` | `public` | `unknown` | `undefined` | [`Shape`](../../core/classes/Shape.md).[`data`](../../core/classes/Shape.md#property-data) | [core/src/core/element.ts:282](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L282) |
| <a id="property-hitpath"></a> `hitPath?` | `protected` | [`ContextPath`](../../core/classes/ContextPath.md) | `undefined` | - | [3d/src/core/shape.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L82) |
| <a id="property-id"></a> `id` | `public` | `string` | `undefined` | [`Shape`](../../core/classes/Shape.md).[`id`](../../core/classes/Shape.md#property-id) | [core/src/core/element.ts:275](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L275) |
| <a id="property-parent"></a> `parent?` | `public` | [`Group`](../../core/classes/Group.md)\<[`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\> | `undefined` | [`Shape`](../../core/classes/Shape.md).[`parent`](../../core/classes/Shape.md#property-parent) | [core/src/core/element.ts:281](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L281) |
| <a id="property-pointerevents"></a> `pointerEvents` | `public` | [`ElementPointerEvents`](../../core/type-aliases/ElementPointerEvents.md) | `'all'` | [`Shape`](../../core/classes/Shape.md).[`pointerEvents`](../../core/classes/Shape.md#property-pointerevents) | [core/src/core/element.ts:280](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L280) |
| <a id="property-state"></a> `state` | `protected` | `TState` | `undefined` | [`Shape`](../../core/classes/Shape.md).[`state`](../../core/classes/Shape.md#property-state) | [core/src/core/element.ts:272](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L272) |
| <a id="property-type"></a> `type` | `readonly` | `string` | `undefined` | [`Shape`](../../core/classes/Shape.md).[`type`](../../core/classes/Shape.md#property-type) | [core/src/core/element.ts:276](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L276) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](Context3D.md#property-defaultkey) | `undefined` | [`Shape`](../../core/classes/Shape.md).[`defaultKey`](../../core/classes/Shape.md#property-defaultkey) | [core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Accessors

### direction

#### Get Signature

> **get** **direction**(): `TState`\[`"direction"`\]

Defined in: [core/src/core/element.ts:286](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L286)

##### Returns

`TState`\[`"direction"`\]

#### Set Signature

> **set** **direction**(`value`): `void`

Defined in: [core/src/core/element.ts:290](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L290)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"direction"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`direction`](../../core/classes/Shape.md#direction)

***

### fill

#### Get Signature

> **get** **fill**(): `TState`\[`"fill"`\]

Defined in: [core/src/core/element.ts:294](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L294)

##### Returns

`TState`\[`"fill"`\]

#### Set Signature

> **set** **fill**(`value`): `void`

Defined in: [core/src/core/element.ts:298](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L298)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"fill"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`fill`](../../core/classes/Shape.md#fill)

***

### filter

#### Get Signature

> **get** **filter**(): `TState`\[`"filter"`\]

Defined in: [core/src/core/element.ts:302](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L302)

##### Returns

`TState`\[`"filter"`\]

#### Set Signature

> **set** **filter**(`value`): `void`

Defined in: [core/src/core/element.ts:306](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L306)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"filter"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`filter`](../../core/classes/Shape.md#filter)

***

### font

#### Get Signature

> **get** **font**(): `TState`\[`"font"`\]

Defined in: [core/src/core/element.ts:310](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L310)

##### Returns

`TState`\[`"font"`\]

#### Set Signature

> **set** **font**(`value`): `void`

Defined in: [core/src/core/element.ts:314](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L314)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"font"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`font`](../../core/classes/Shape.md#font)

***

### globalCompositeOperation

#### Get Signature

> **get** **globalCompositeOperation**(): `TState`\[`"globalCompositeOperation"`\]

Defined in: [core/src/core/element.ts:326](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L326)

##### Returns

`TState`\[`"globalCompositeOperation"`\]

#### Set Signature

> **set** **globalCompositeOperation**(`value`): `void`

Defined in: [core/src/core/element.ts:330](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L330)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"globalCompositeOperation"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`globalCompositeOperation`](../../core/classes/Shape.md#globalcompositeoperation)

***

### lineCap

#### Get Signature

> **get** **lineCap**(): `TState`\[`"lineCap"`\]

Defined in: [core/src/core/element.ts:334](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L334)

##### Returns

`TState`\[`"lineCap"`\]

#### Set Signature

> **set** **lineCap**(`value`): `void`

Defined in: [core/src/core/element.ts:338](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L338)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineCap"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`lineCap`](../../core/classes/Shape.md#linecap)

***

### lineDash

#### Get Signature

> **get** **lineDash**(): `TState`\[`"lineDash"`\]

Defined in: [core/src/core/element.ts:342](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L342)

##### Returns

`TState`\[`"lineDash"`\]

#### Set Signature

> **set** **lineDash**(`value`): `void`

Defined in: [core/src/core/element.ts:346](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L346)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineDash"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`lineDash`](../../core/classes/Shape.md#linedash)

***

### lineDashOffset

#### Get Signature

> **get** **lineDashOffset**(): `TState`\[`"lineDashOffset"`\]

Defined in: [core/src/core/element.ts:350](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L350)

##### Returns

`TState`\[`"lineDashOffset"`\]

#### Set Signature

> **set** **lineDashOffset**(`value`): `void`

Defined in: [core/src/core/element.ts:354](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L354)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineDashOffset"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`lineDashOffset`](../../core/classes/Shape.md#linedashoffset)

***

### lineJoin

#### Get Signature

> **get** **lineJoin**(): `TState`\[`"lineJoin"`\]

Defined in: [core/src/core/element.ts:358](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L358)

##### Returns

`TState`\[`"lineJoin"`\]

#### Set Signature

> **set** **lineJoin**(`value`): `void`

Defined in: [core/src/core/element.ts:362](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L362)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineJoin"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`lineJoin`](../../core/classes/Shape.md#linejoin)

***

### lineWidth

#### Get Signature

> **get** **lineWidth**(): `TState`\[`"lineWidth"`\]

Defined in: [core/src/core/element.ts:366](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L366)

##### Returns

`TState`\[`"lineWidth"`\]

#### Set Signature

> **set** **lineWidth**(`value`): `void`

Defined in: [core/src/core/element.ts:370](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L370)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"lineWidth"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`lineWidth`](../../core/classes/Shape.md#linewidth)

***

### miterLimit

#### Get Signature

> **get** **miterLimit**(): `TState`\[`"miterLimit"`\]

Defined in: [core/src/core/element.ts:374](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L374)

##### Returns

`TState`\[`"miterLimit"`\]

#### Set Signature

> **set** **miterLimit**(`value`): `void`

Defined in: [core/src/core/element.ts:378](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L378)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"miterLimit"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`miterLimit`](../../core/classes/Shape.md#miterlimit)

***

### opacity

#### Get Signature

> **get** **opacity**(): `TState`\[`"opacity"`\]

Defined in: [core/src/core/element.ts:318](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L318)

##### Returns

`TState`\[`"opacity"`\]

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/src/core/element.ts:322](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L322)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"opacity"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`opacity`](../../core/classes/Shape.md#opacity)

***

### rotation

#### Get Signature

> **get** **rotation**(): `TState`\[`"rotation"`\]

Defined in: [core/src/core/element.ts:478](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L478)

##### Returns

`TState`\[`"rotation"`\]

#### Set Signature

> **set** **rotation**(`value`): `void`

Defined in: [core/src/core/element.ts:482](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L482)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"rotation"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`rotation`](../../core/classes/Shape.md#rotation)

***

### rotationX

#### Get Signature

> **get** **rotationX**(): `TState`\[`"rotationX"`\]

Defined in: [3d/src/core/shape.ts:111](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L111)

##### Returns

`TState`\[`"rotationX"`\]

#### Set Signature

> **set** **rotationX**(`value`): `void`

Defined in: [3d/src/core/shape.ts:115](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L115)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"rotationX"`\] |

##### Returns

`void`

***

### rotationY

#### Get Signature

> **get** **rotationY**(): `TState`\[`"rotationY"`\]

Defined in: [3d/src/core/shape.ts:119](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L119)

##### Returns

`TState`\[`"rotationY"`\]

#### Set Signature

> **set** **rotationY**(`value`): `void`

Defined in: [3d/src/core/shape.ts:123](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L123)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"rotationY"`\] |

##### Returns

`void`

***

### rotationZ

#### Get Signature

> **get** **rotationZ**(): `TState`\[`"rotationZ"`\]

Defined in: [3d/src/core/shape.ts:127](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L127)

##### Returns

`TState`\[`"rotationZ"`\]

#### Set Signature

> **set** **rotationZ**(`value`): `void`

Defined in: [3d/src/core/shape.ts:131](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L131)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"rotationZ"`\] |

##### Returns

`void`

***

### shadowBlur

#### Get Signature

> **get** **shadowBlur**(): `TState`\[`"shadowBlur"`\]

Defined in: [core/src/core/element.ts:382](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L382)

##### Returns

`TState`\[`"shadowBlur"`\]

#### Set Signature

> **set** **shadowBlur**(`value`): `void`

Defined in: [core/src/core/element.ts:386](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L386)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"shadowBlur"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`shadowBlur`](../../core/classes/Shape.md#shadowblur)

***

### shadowColor

#### Get Signature

> **get** **shadowColor**(): `TState`\[`"shadowColor"`\]

Defined in: [core/src/core/element.ts:390](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L390)

##### Returns

`TState`\[`"shadowColor"`\]

#### Set Signature

> **set** **shadowColor**(`value`): `void`

Defined in: [core/src/core/element.ts:394](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L394)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"shadowColor"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`shadowColor`](../../core/classes/Shape.md#shadowcolor)

***

### shadowOffsetX

#### Get Signature

> **get** **shadowOffsetX**(): `TState`\[`"shadowOffsetX"`\]

Defined in: [core/src/core/element.ts:398](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L398)

##### Returns

`TState`\[`"shadowOffsetX"`\]

#### Set Signature

> **set** **shadowOffsetX**(`value`): `void`

Defined in: [core/src/core/element.ts:402](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L402)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"shadowOffsetX"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`shadowOffsetX`](../../core/classes/Shape.md#shadowoffsetx)

***

### shadowOffsetY

#### Get Signature

> **get** **shadowOffsetY**(): `TState`\[`"shadowOffsetY"`\]

Defined in: [core/src/core/element.ts:406](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L406)

##### Returns

`TState`\[`"shadowOffsetY"`\]

#### Set Signature

> **set** **shadowOffsetY**(`value`): `void`

Defined in: [core/src/core/element.ts:410](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L410)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"shadowOffsetY"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`shadowOffsetY`](../../core/classes/Shape.md#shadowoffsety)

***

### stroke

#### Get Signature

> **get** **stroke**(): `TState`\[`"stroke"`\]

Defined in: [core/src/core/element.ts:414](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L414)

##### Returns

`TState`\[`"stroke"`\]

#### Set Signature

> **set** **stroke**(`value`): `void`

Defined in: [core/src/core/element.ts:418](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L418)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"stroke"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`stroke`](../../core/classes/Shape.md#stroke)

***

### textAlign

#### Get Signature

> **get** **textAlign**(): `TState`\[`"textAlign"`\]

Defined in: [core/src/core/element.ts:422](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L422)

##### Returns

`TState`\[`"textAlign"`\]

#### Set Signature

> **set** **textAlign**(`value`): `void`

Defined in: [core/src/core/element.ts:426](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L426)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"textAlign"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`textAlign`](../../core/classes/Shape.md#textalign)

***

### textBaseline

#### Get Signature

> **get** **textBaseline**(): `TState`\[`"textBaseline"`\]

Defined in: [core/src/core/element.ts:430](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L430)

##### Returns

`TState`\[`"textBaseline"`\]

#### Set Signature

> **set** **textBaseline**(`value`): `void`

Defined in: [core/src/core/element.ts:434](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L434)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"textBaseline"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`textBaseline`](../../core/classes/Shape.md#textbaseline)

***

### transformOriginX

#### Get Signature

> **get** **transformOriginX**(): `TState`\[`"transformOriginX"`\]

Defined in: [core/src/core/element.ts:486](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L486)

##### Returns

`TState`\[`"transformOriginX"`\]

#### Set Signature

> **set** **transformOriginX**(`value`): `void`

Defined in: [core/src/core/element.ts:490](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L490)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"transformOriginX"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`transformOriginX`](../../core/classes/Shape.md#transformoriginx)

***

### transformOriginY

#### Get Signature

> **get** **transformOriginY**(): `TState`\[`"transformOriginY"`\]

Defined in: [core/src/core/element.ts:494](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L494)

##### Returns

`TState`\[`"transformOriginY"`\]

#### Set Signature

> **set** **transformOriginY**(`value`): `void`

Defined in: [core/src/core/element.ts:498](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L498)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"transformOriginY"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`transformOriginY`](../../core/classes/Shape.md#transformoriginy)

***

### transformScaleX

#### Get Signature

> **get** **transformScaleX**(): `TState`\[`"transformScaleX"`\]

Defined in: [core/src/core/element.ts:462](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L462)

##### Returns

`TState`\[`"transformScaleX"`\]

#### Set Signature

> **set** **transformScaleX**(`value`): `void`

Defined in: [core/src/core/element.ts:466](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L466)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"transformScaleX"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`transformScaleX`](../../core/classes/Shape.md#transformscalex)

***

### transformScaleY

#### Get Signature

> **get** **transformScaleY**(): `TState`\[`"transformScaleY"`\]

Defined in: [core/src/core/element.ts:470](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L470)

##### Returns

`TState`\[`"transformScaleY"`\]

#### Set Signature

> **set** **transformScaleY**(`value`): `void`

Defined in: [core/src/core/element.ts:474](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L474)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"transformScaleY"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`transformScaleY`](../../core/classes/Shape.md#transformscaley)

***

### translateX

#### Get Signature

> **get** **translateX**(): `TState`\[`"translateX"`\]

Defined in: [core/src/core/element.ts:446](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L446)

##### Returns

`TState`\[`"translateX"`\]

#### Set Signature

> **set** **translateX**(`value`): `void`

Defined in: [core/src/core/element.ts:450](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L450)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"translateX"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`translateX`](../../core/classes/Shape.md#translatex)

***

### translateY

#### Get Signature

> **get** **translateY**(): `TState`\[`"translateY"`\]

Defined in: [core/src/core/element.ts:454](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L454)

##### Returns

`TState`\[`"translateY"`\]

#### Set Signature

> **set** **translateY**(`value`): `void`

Defined in: [core/src/core/element.ts:458](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L458)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"translateY"`\] |

##### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`translateY`](../../core/classes/Shape.md#translatey)

***

### x

#### Get Signature

> **get** **x**(): `TState`\[`"x"`\]

Defined in: [3d/src/core/shape.ts:87](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L87)

##### Returns

`TState`\[`"x"`\]

#### Set Signature

> **set** **x**(`value`): `void`

Defined in: [3d/src/core/shape.ts:91](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L91)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"x"`\] |

##### Returns

`void`

***

### y

#### Get Signature

> **get** **y**(): `TState`\[`"y"`\]

Defined in: [3d/src/core/shape.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L95)

##### Returns

`TState`\[`"y"`\]

#### Set Signature

> **set** **y**(`value`): `void`

Defined in: [3d/src/core/shape.ts:99](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L99)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"y"`\] |

##### Returns

`void`

***

### z

#### Get Signature

> **get** **z**(): `TState`\[`"z"`\]

Defined in: [3d/src/core/shape.ts:103](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L103)

##### Returns

`TState`\[`"z"`\]

#### Set Signature

> **set** **z**(`value`): `void`

Defined in: [3d/src/core/shape.ts:107](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L107)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TState`\[`"z"`\] |

##### Returns

`void`

***

### zIndex

#### Get Signature

> **get** **zIndex**(): `number`

Defined in: [3d/src/core/shape.ts:135](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L135)

##### Returns

`number`

#### Set Signature

> **set** **zIndex**(`_value`): `void`

Defined in: [3d/src/core/shape.ts:139](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L139)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `_value` | `number` |

##### Returns

`void`

#### Overrides

[`Shape`](../../core/classes/Shape.md).[`zIndex`](../../core/classes/Shape.md#zindex)

## Methods

### clone()

> **clone**(): [`Element`](../../core/classes/Element.md)\<`TState`, [`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\>

Defined in: [core/src/core/element.ts:554](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L554)

Creates a shallow clone of this element with the same id, classes, and state.

#### Returns

[`Element`](../../core/classes/Element.md)\<`TState`, [`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\>

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`clone`](../../core/classes/Shape.md#clone)

***

### computeFaces()

> `protected` **computeFaces**(): [`Face3D`](../interfaces/Face3D.md)[]

Defined in: [3d/src/core/shape.ts:162](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L162)

#### Returns

[`Face3D`](../interfaces/Face3D.md)[]

***

### destroy()

> **destroy**(): `void`

Defined in: [core/src/core/element.ts:631](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L631)

Emits a `destroyed` event, clears all listeners, and disposes retained resources.

#### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`destroy`](../../core/classes/Shape.md#destroy)

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

[`Shape`](../../core/classes/Shape.md).[`dispose`](../../core/classes/Shape.md#dispose)

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

[`Shape`](../../core/classes/Shape.md).[`emit`](../../core/classes/Shape.md#emit)

#### Call Signature

> **emit**\<`TEvent`\>(`type`, `data`): [`Event`](../../core/classes/Event.md)\<[`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\[`TEvent`\]\>

Defined in: [core/src/core/event-bus.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L121)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ElementEventMap`](../../core/interfaces/ElementEventMap.md) |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `data` | [`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\[`TEvent`\] |

##### Returns

[`Event`](../../core/classes/Event.md)\<[`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\[`TEvent`\]\>

##### Inherited from

[`Shape`](../../core/classes/Shape.md).[`emit`](../../core/classes/Shape.md#emit)

***

### getBoundingBox()

> **getBoundingBox**(): [`Box`](../../core/classes/Box.md)

Defined in: [3d/src/core/shape.ts:188](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L188)

Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry.

#### Returns

[`Box`](../../core/classes/Box.md)

#### Overrides

[`Shape`](../../core/classes/Shape.md).[`getBoundingBox`](../../core/classes/Shape.md#getboundingbox)

***

### getDepth()

> **getDepth**(`context`): `number`

Defined in: [3d/src/core/shape.ts:184](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L184)

Returns the projected depth of this shape's origin in the given 3D context.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context3D`](Context3D.md) |

#### Returns

`number`

***

### getModelMatrix()

> `protected` **getModelMatrix**(): [`Matrix4`](../type-aliases/Matrix4.md)

Defined in: [3d/src/core/shape.ts:166](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L166)

#### Returns

[`Matrix4`](../type-aliases/Matrix4.md)

***

### getStateValue()

> `protected` **getStateValue**\<`TKey`\>(`key`): `TState`\[`TKey`\]

Defined in: [core/src/core/element.ts:524](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L524)

Reads a state value, falling back to the parent’s value if the local value is nil (property inheritance).

#### Type Parameters

| Type Parameter |
| ------ |
| `TKey` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `TKey` |

#### Returns

`TState`\[`TKey`\]

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`getStateValue`](../../core/classes/Shape.md#getstatevalue)

***

### has()

> **has**(`type`): `boolean`

Defined in: [core/src/core/event-bus.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L77)

Returns whether there are any listeners registered for the given event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | keyof [`ElementEventMap`](../../core/interfaces/ElementEventMap.md) |

#### Returns

`boolean`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`has`](../../core/classes/Shape.md#has)

***

### interpolate()

> **interpolate**(`newState`, `interpolators?`): [`Interpolator`](../../core/type-aliases/Interpolator.md)\<`void`\>

Defined in: [core/src/core/element.ts:574](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L574)

Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `newState` | `Partial`\<[`ElementInterpolationState`](../../core/type-aliases/ElementInterpolationState.md)\<`TState`\>\> |
| `interpolators` | `Partial`\<[`ElementInterpolators`](../../core/type-aliases/ElementInterpolators.md)\<`TState`\>\> |

#### Returns

[`Interpolator`](../../core/type-aliases/Interpolator.md)\<`void`\>

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`interpolate`](../../core/classes/Shape.md#interpolate)

***

### intersectsWith()

> **intersectsWith**(`x`, `y`, `options?`): `boolean`

Defined in: [3d/src/core/shape.ts:270](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L270)

Tests whether a point intersects this element’s bounding box. Override for custom hit testing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `options?` | `Partial`\<[`ElementIntersectionOptions`](../../core/type-aliases/ElementIntersectionOptions.md)\> |

#### Returns

`boolean`

#### Overrides

[`Shape`](../../core/classes/Shape.md).[`intersectsWith`](../../core/classes/Shape.md#intersectswith)

***

### off()

> **off**\<`TEvent`\>(`type`, `handler`): `void`

Defined in: [core/src/core/event-bus.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L95)

Removes a previously registered handler for the given event type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ElementEventMap`](../../core/interfaces/ElementEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\[`TEvent`\]\> |

#### Returns

`void`

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`off`](../../core/classes/Shape.md#off)

***

### on()

> **on**\<`TEvent`\>(`event`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [core/src/core/element.ts:534](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L534)

Subscribes a handler to the given event type and returns a disposable for cleanup.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ElementEventMap`](../../core/interfaces/ElementEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../../core/type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`on`](../../core/classes/Shape.md#on)

***

### once()

> **once**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [core/src/core/event-bus.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L110)

Subscribes a handler that is automatically removed after it fires once.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ElementEventMap`](../../core/interfaces/ElementEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`ElementEventMap`](../../core/interfaces/ElementEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../../core/type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Shape`](../../core/classes/Shape.md).[`once`](../../core/classes/Shape.md#once)

***

### render()

> **render**(`context`): `void`

Defined in: [3d/src/core/shape.ts:223](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L223)

Renders this element by applying transforms and context state, then invoking the optional callback.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../../core/classes/Context.md) |

#### Returns

`void`

#### Overrides

[`Shape`](../../core/classes/Shape.md).[`render`](../../core/classes/Shape.md#render)

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

[`Shape`](../../core/classes/Shape.md).[`retain`](../../core/classes/Shape.md#retain)

***

### setStateValue()

> `protected` **setStateValue**\<`TKey`\>(`key`, `value`): `void`

Defined in: [3d/src/core/shape.ts:157](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L157)

Sets a state value and emits an `updated` event.

#### Type Parameters

| Type Parameter |
| ------ |
| `TKey` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `TKey` |
| `value` | `TState`\[`TKey`\] |

#### Returns

`void`

#### Overrides

[`Shape`](../../core/classes/Shape.md).[`setStateValue`](../../core/classes/Shape.md#setstatevalue)

***

### transformVertices()

> `protected` **transformVertices**(`vertices`, `matrix?`): [`Vector3`](../type-aliases/Vector3.md)[]

Defined in: [3d/src/core/shape.ts:177](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/core/shape.ts#L177)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vertices` | [`Vector3`](../type-aliases/Vector3.md)[] |
| `matrix?` | [`Matrix4`](../type-aliases/Matrix4.md) |

#### Returns

[`Vector3`](../type-aliases/Vector3.md)[]
