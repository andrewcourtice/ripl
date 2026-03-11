[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Context

# Abstract Class: Context\<TElement\>

Defined in: [packages/core/src/context/\_base/index.ts:390](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L390)

Abstract rendering context providing a unified API for Canvas and SVG, with state management, coordinate scaling, and interaction handling.

## Extends

- [`EventBus`](EventBus.md)\<[`ContextEventMap`](../interfaces/ContextEventMap.md)\>

## Extended by

- [`CanvasContext`](CanvasContext.md)
- [`SVGContext`](../../svg/classes/SVGContext.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TElement` *extends* `Element` | `Element` |

## Implements

- [`BaseState`](../interfaces/BaseState.md)

## Constructors

### Constructor

> **new Context**\<`TElement`\>(`type`, `target`, `element`, `options?`): `Context`\<`TElement`\>

Defined in: [packages/core/src/context/\_base/index.ts:652](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L652)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `string` |
| `target` | `string` \| `HTMLElement` |
| `element` | `TElement` |
| `options?` | [`ContextOptions`](../interfaces/ContextOptions.md) |

#### Returns

`Context`\<`TElement`\>

#### Overrides

[`EventBus`](EventBus.md).[`constructor`](EventBus.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-buffer"></a> `buffer` | `public` | `boolean` | `false` | - | [packages/core/src/context/\_base/index.ts:396](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L396) |
| <a id="property-currentstate"></a> `currentState` | `protected` | [`BaseState`](../interfaces/BaseState.md) | `undefined` | - | [packages/core/src/context/\_base/index.ts:404](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L404) |
| <a id="property-element"></a> `element` | `readonly` | `TElement` | `undefined` | - | [packages/core/src/context/\_base/index.ts:394](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L394) |
| <a id="property-height"></a> `height` | `public` | `number` | `undefined` | - | [packages/core/src/context/\_base/index.ts:398](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L398) |
| <a id="property-parent"></a> `parent?` | `public` | [`EventBus`](EventBus.md)\<[`ContextEventMap`](../interfaces/ContextEventMap.md)\> | `undefined` | [`EventBus`](EventBus.md).[`parent`](EventBus.md#property-parent) | [packages/core/src/core/event-bus.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L72) |
| <a id="property-renderdepth"></a> `renderDepth` | `protected` | `number` | `0` | - | [packages/core/src/context/\_base/index.ts:405](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L405) |
| <a id="property-renderedelements"></a> `renderedElements` | `public` | [`RenderElement`](../interfaces/RenderElement.md)[] | `undefined` | - | [packages/core/src/context/\_base/index.ts:414](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L414) |
| <a id="property-renderelement"></a> `renderElement?` | `public` | [`RenderElement`](../interfaces/RenderElement.md) | `undefined` | - | [packages/core/src/context/\_base/index.ts:413](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L413) |
| <a id="property-root"></a> `root` | `readonly` | `HTMLElement` | `undefined` | - | [packages/core/src/context/\_base/index.ts:393](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L393) |
| <a id="property-scaledpr"></a> `scaleDPR` | `public` | [`Scale`](../interfaces/Scale.md)\<`number`, `number`\> | `undefined` | - | [packages/core/src/context/\_base/index.ts:401](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L401) |
| <a id="property-scalex"></a> `scaleX` | `public` | [`Scale`](../interfaces/Scale.md)\<`number`, `number`\> | `undefined` | - | [packages/core/src/context/\_base/index.ts:399](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L399) |
| <a id="property-scaley"></a> `scaleY` | `public` | [`Scale`](../interfaces/Scale.md)\<`number`, `number`\> | `undefined` | - | [packages/core/src/context/\_base/index.ts:400](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L400) |
| <a id="property-states"></a> `states` | `protected` | [`BaseState`](../interfaces/BaseState.md)[] | `undefined` | - | [packages/core/src/context/\_base/index.ts:403](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L403) |
| <a id="property-type"></a> `type` | `readonly` | `string` | `undefined` | - | [packages/core/src/context/\_base/index.ts:392](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L392) |
| <a id="property-width"></a> `width` | `public` | `number` | `undefined` | - | [packages/core/src/context/\_base/index.ts:397](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L397) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](Disposer.md#property-defaultkey) | `undefined` | [`EventBus`](EventBus.md).[`defaultKey`](EventBus.md#property-defaultkey) | [packages/core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Accessors

### currentRenderElement

#### Get Signature

> **get** **currentRenderElement**(): [`RenderElement`](../interfaces/RenderElement.md) \| `undefined`

Defined in: [packages/core/src/context/\_base/index.ts:416](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L416)

##### Returns

[`RenderElement`](../interfaces/RenderElement.md) \| `undefined`

#### Set Signature

> **set** **currentRenderElement**(`element`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:420](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L420)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`RenderElement`](../interfaces/RenderElement.md) \| `undefined` |

##### Returns

`void`

***

### direction

#### Get Signature

> **get** **direction**(): [`Direction`](../type-aliases/Direction.md)

Defined in: [packages/core/src/context/\_base/index.ts:444](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L444)

##### Returns

[`Direction`](../type-aliases/Direction.md)

#### Set Signature

> **set** **direction**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:448](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L448)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Direction`](../type-aliases/Direction.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`direction`](../interfaces/BaseState.md#property-direction)

***

### fill

#### Get Signature

> **get** **fill**(): `string`

Defined in: [packages/core/src/context/\_base/index.ts:428](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L428)

##### Returns

`string`

#### Set Signature

> **set** **fill**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:432](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L432)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`fill`](../interfaces/BaseState.md#property-fill)

***

### filter

#### Get Signature

> **get** **filter**(): `string`

Defined in: [packages/core/src/context/\_base/index.ts:436](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L436)

##### Returns

`string`

#### Set Signature

> **set** **filter**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:440](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L440)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`filter`](../interfaces/BaseState.md#property-filter)

***

### font

#### Get Signature

> **get** **font**(): `string`

Defined in: [packages/core/src/context/\_base/index.ts:452](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L452)

##### Returns

`string`

#### Set Signature

> **set** **font**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:456](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L456)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`font`](../interfaces/BaseState.md#property-font)

***

### fontKerning

#### Get Signature

> **get** **fontKerning**(): [`FontKerning`](../type-aliases/FontKerning.md)

Defined in: [packages/core/src/context/\_base/index.ts:460](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L460)

##### Returns

[`FontKerning`](../type-aliases/FontKerning.md)

#### Set Signature

> **set** **fontKerning**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:464](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L464)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`FontKerning`](../type-aliases/FontKerning.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`fontKerning`](../interfaces/BaseState.md#property-fontkerning)

***

### globalCompositeOperation

#### Get Signature

> **get** **globalCompositeOperation**(): `unknown`

Defined in: [packages/core/src/context/\_base/index.ts:476](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L476)

##### Returns

`unknown`

#### Set Signature

> **set** **globalCompositeOperation**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:480](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L480)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`globalCompositeOperation`](../interfaces/BaseState.md#property-globalcompositeoperation)

***

### lineCap

#### Get Signature

> **get** **lineCap**(): [`LineCap`](../type-aliases/LineCap.md)

Defined in: [packages/core/src/context/\_base/index.ts:484](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L484)

##### Returns

[`LineCap`](../type-aliases/LineCap.md)

#### Set Signature

> **set** **lineCap**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:488](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L488)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`LineCap`](../type-aliases/LineCap.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`lineCap`](../interfaces/BaseState.md#property-linecap)

***

### lineDash

#### Get Signature

> **get** **lineDash**(): `number`[]

Defined in: [packages/core/src/context/\_base/index.ts:492](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L492)

##### Returns

`number`[]

#### Set Signature

> **set** **lineDash**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:496](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L496)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number`[] |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`lineDash`](../interfaces/BaseState.md#property-linedash)

***

### lineDashOffset

#### Get Signature

> **get** **lineDashOffset**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:500](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L500)

##### Returns

`number`

#### Set Signature

> **set** **lineDashOffset**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:504](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L504)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`lineDashOffset`](../interfaces/BaseState.md#property-linedashoffset)

***

### lineJoin

#### Get Signature

> **get** **lineJoin**(): [`LineJoin`](../type-aliases/LineJoin.md)

Defined in: [packages/core/src/context/\_base/index.ts:508](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L508)

##### Returns

[`LineJoin`](../type-aliases/LineJoin.md)

#### Set Signature

> **set** **lineJoin**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:512](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L512)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`LineJoin`](../type-aliases/LineJoin.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`lineJoin`](../interfaces/BaseState.md#property-linejoin)

***

### lineWidth

#### Get Signature

> **get** **lineWidth**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:516](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L516)

##### Returns

`number`

#### Set Signature

> **set** **lineWidth**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:520](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L520)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`lineWidth`](../interfaces/BaseState.md#property-linewidth)

***

### miterLimit

#### Get Signature

> **get** **miterLimit**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:524](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L524)

##### Returns

`number`

#### Set Signature

> **set** **miterLimit**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:528](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L528)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`miterLimit`](../interfaces/BaseState.md#property-miterlimit)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:468](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L468)

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:472](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L472)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`opacity`](../interfaces/BaseState.md#property-opacity)

***

### rotation

#### Get Signature

> **get** **rotation**(): [`Rotation`](../type-aliases/Rotation.md)

Defined in: [packages/core/src/context/\_base/index.ts:628](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L628)

##### Returns

[`Rotation`](../type-aliases/Rotation.md)

#### Set Signature

> **set** **rotation**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:632](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L632)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Rotation`](../type-aliases/Rotation.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`rotation`](../interfaces/BaseState.md#property-rotation)

***

### shadowBlur

#### Get Signature

> **get** **shadowBlur**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:532](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L532)

##### Returns

`number`

#### Set Signature

> **set** **shadowBlur**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:536](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L536)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`shadowBlur`](../interfaces/BaseState.md#property-shadowblur)

***

### shadowColor

#### Get Signature

> **get** **shadowColor**(): `string`

Defined in: [packages/core/src/context/\_base/index.ts:540](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L540)

##### Returns

`string`

#### Set Signature

> **set** **shadowColor**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:544](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L544)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`shadowColor`](../interfaces/BaseState.md#property-shadowcolor)

***

### shadowOffsetX

#### Get Signature

> **get** **shadowOffsetX**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:548](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L548)

##### Returns

`number`

#### Set Signature

> **set** **shadowOffsetX**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:552](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L552)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`shadowOffsetX`](../interfaces/BaseState.md#property-shadowoffsetx)

***

### shadowOffsetY

#### Get Signature

> **get** **shadowOffsetY**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:556](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L556)

##### Returns

`number`

#### Set Signature

> **set** **shadowOffsetY**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:560](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L560)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`shadowOffsetY`](../interfaces/BaseState.md#property-shadowoffsety)

***

### stroke

#### Get Signature

> **get** **stroke**(): `string`

Defined in: [packages/core/src/context/\_base/index.ts:564](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L564)

##### Returns

`string`

#### Set Signature

> **set** **stroke**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:568](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L568)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`stroke`](../interfaces/BaseState.md#property-stroke)

***

### textAlign

#### Get Signature

> **get** **textAlign**(): [`TextAlignment`](../type-aliases/TextAlignment.md)

Defined in: [packages/core/src/context/\_base/index.ts:572](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L572)

##### Returns

[`TextAlignment`](../type-aliases/TextAlignment.md)

#### Set Signature

> **set** **textAlign**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:576](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L576)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TextAlignment`](../type-aliases/TextAlignment.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`textAlign`](../interfaces/BaseState.md#property-textalign)

***

### textBaseline

#### Get Signature

> **get** **textBaseline**(): [`TextBaseline`](../type-aliases/TextBaseline.md)

Defined in: [packages/core/src/context/\_base/index.ts:580](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L580)

##### Returns

[`TextBaseline`](../type-aliases/TextBaseline.md)

#### Set Signature

> **set** **textBaseline**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:584](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L584)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TextBaseline`](../type-aliases/TextBaseline.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`textBaseline`](../interfaces/BaseState.md#property-textbaseline)

***

### transformOriginX

#### Get Signature

> **get** **transformOriginX**(): [`TransformOrigin`](../type-aliases/TransformOrigin.md)

Defined in: [packages/core/src/context/\_base/index.ts:636](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L636)

##### Returns

[`TransformOrigin`](../type-aliases/TransformOrigin.md)

#### Set Signature

> **set** **transformOriginX**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:640](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L640)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TransformOrigin`](../type-aliases/TransformOrigin.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`transformOriginX`](../interfaces/BaseState.md#property-transformoriginx)

***

### transformOriginY

#### Get Signature

> **get** **transformOriginY**(): [`TransformOrigin`](../type-aliases/TransformOrigin.md)

Defined in: [packages/core/src/context/\_base/index.ts:644](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L644)

##### Returns

[`TransformOrigin`](../type-aliases/TransformOrigin.md)

#### Set Signature

> **set** **transformOriginY**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:648](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L648)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TransformOrigin`](../type-aliases/TransformOrigin.md) |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`transformOriginY`](../interfaces/BaseState.md#property-transformoriginy)

***

### transformScaleX

#### Get Signature

> **get** **transformScaleX**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:612](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L612)

##### Returns

`number`

#### Set Signature

> **set** **transformScaleX**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:616](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L616)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`transformScaleX`](../interfaces/BaseState.md#property-transformscalex)

***

### transformScaleY

#### Get Signature

> **get** **transformScaleY**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:620](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L620)

##### Returns

`number`

#### Set Signature

> **set** **transformScaleY**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:624](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L624)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`transformScaleY`](../interfaces/BaseState.md#property-transformscaley)

***

### translateX

#### Get Signature

> **get** **translateX**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:596](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L596)

##### Returns

`number`

#### Set Signature

> **set** **translateX**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:600](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L600)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`translateX`](../interfaces/BaseState.md#property-translatex)

***

### translateY

#### Get Signature

> **get** **translateY**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:604](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L604)

##### Returns

`number`

#### Set Signature

> **set** **translateY**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:608](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L608)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`translateY`](../interfaces/BaseState.md#property-translatey)

***

### zIndex

#### Get Signature

> **get** **zIndex**(): `number`

Defined in: [packages/core/src/context/\_base/index.ts:588](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L588)

##### Returns

`number`

#### Set Signature

> **set** **zIndex**(`value`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:592](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L592)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

[`BaseState`](../interfaces/BaseState.md).[`zIndex`](../interfaces/BaseState.md#property-zindex)

## Methods

### applyClip()

> **applyClip**(`path`, `fillRule?`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:820](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L820)

Clips subsequent drawing operations to the given path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`ContextPath`](ContextPath.md) |
| `fillRule?` | [`FillRule`](../type-aliases/FillRule.md) |

#### Returns

`void`

***

### applyFill()

> **applyFill**(`path`, `fillRule?`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:824](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L824)

Fills the given path or text element using the current fill style.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`ContextElement`](../interfaces/ContextElement.md) |
| `fillRule?` | [`FillRule`](../type-aliases/FillRule.md) |

#### Returns

`void`

***

### applyStroke()

> **applyStroke**(`path`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:828](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L828)

Strokes the given path or text element using the current stroke style.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`ContextElement`](../interfaces/ContextElement.md) |

#### Returns

`void`

***

### batch()

> **batch**\<`TResult`\>(`body`): `TResult`

Defined in: [packages/core/src/context/\_base/index.ts:769](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L769)

Clears the rendering surface and brackets the callback in markRenderStart/markRenderEnd, returning the callback's result.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TResult` | `void` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | () => `TResult` |

#### Returns

`TResult`

***

### clear()

> **clear**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:742](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L742)

Clears the entire rendering surface.

#### Returns

`void`

***

### createPath()

> **createPath**(`id?`): [`ContextPath`](ContextPath.md)

Defined in: [packages/core/src/context/\_base/index.ts:806](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L806)

Creates a new path element, optionally reusing an id for SVG diffing efficiency.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id?` | `string` |

#### Returns

[`ContextPath`](ContextPath.md)

***

### createText()

> **createText**(`options`): [`ContextText`](ContextText.md)

Defined in: [packages/core/src/context/\_base/index.ts:811](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L811)

Creates a new text element from the given options.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TextOptions`](../type-aliases/TextOptions.md) |

#### Returns

[`ContextText`](ContextText.md)

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:1066](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1066)

Destroys the context, removing the DOM element and disposing all resources.

#### Returns

`void`

#### Overrides

[`EventBus`](EventBus.md).[`destroy`](EventBus.md#destroy)

***

### disableInteraction()

> **disableInteraction**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:1054](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1054)

Disables DOM interaction events and clears the active element set.

#### Returns

`void`

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

### drawImage()

> **drawImage**(`image`, `x`, `y`, `width?`, `height?`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:816](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L816)

Draws an image onto the rendering surface at the given position and optional size.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `image` | `CanvasImageSource` |
| `x` | `number` |
| `y` | `number` |
| `width?` | `number` |
| `height?` | `number` |

#### Returns

`void`

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

> **emit**\<`TEvent`\>(`type`, `data`): [`Event`](Event.md)\<[`ContextEventMap`](../interfaces/ContextEventMap.md)\[`TEvent`\]\>

Defined in: [packages/core/src/core/event-bus.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L121)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ContextEventMap`](../interfaces/ContextEventMap.md) |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `data` | [`ContextEventMap`](../interfaces/ContextEventMap.md)\[`TEvent`\] |

##### Returns

[`Event`](Event.md)\<[`ContextEventMap`](../interfaces/ContextEventMap.md)\[`TEvent`\]\>

##### Inherited from

[`EventBus`](EventBus.md).[`emit`](EventBus.md#emit)

***

### enableInteraction()

> **enableInteraction**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:1026](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1026)

Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing.

#### Returns

`void`

***

### getDefaultState()

> `protected` **getDefaultState**(): `object`

Defined in: [packages/core/src/context/\_base/index.ts:715](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L715)

#### Returns

`object`

##### direction

> **direction**: [`Direction`](../type-aliases/Direction.md)

##### fill

> **fill**: `string`

##### filter

> **filter**: `string`

##### font

> **font**: `string`

##### fontKerning

> **fontKerning**: [`FontKerning`](../type-aliases/FontKerning.md)

##### globalCompositeOperation

> **globalCompositeOperation**: `unknown`

##### lineCap

> **lineCap**: [`LineCap`](../type-aliases/LineCap.md)

##### lineDash

> **lineDash**: `number`[]

##### lineDashOffset

> **lineDashOffset**: `number`

##### lineJoin

> **lineJoin**: [`LineJoin`](../type-aliases/LineJoin.md)

##### lineWidth

> **lineWidth**: `number`

##### miterLimit

> **miterLimit**: `number`

##### opacity

> **opacity**: `number`

##### rotation

> **rotation**: [`Rotation`](../type-aliases/Rotation.md)

##### shadowBlur

> **shadowBlur**: `number`

##### shadowColor

> **shadowColor**: `string`

##### shadowOffsetX

> **shadowOffsetX**: `number`

##### shadowOffsetY

> **shadowOffsetY**: `number`

##### stroke

> **stroke**: `string`

##### textAlign

> **textAlign**: [`TextAlignment`](../type-aliases/TextAlignment.md)

##### textBaseline

> **textBaseline**: [`TextBaseline`](../type-aliases/TextBaseline.md)

##### transformOriginX

> **transformOriginX**: [`TransformOrigin`](../type-aliases/TransformOrigin.md)

##### transformOriginY

> **transformOriginY**: [`TransformOrigin`](../type-aliases/TransformOrigin.md)

##### transformScaleX

> **transformScaleX**: `number`

##### transformScaleY

> **transformScaleY**: `number`

##### translateX

> **translateX**: `number`

##### translateY

> **translateY**: `number`

##### zIndex

> **zIndex**: `number`

***

### has()

> **has**(`type`): `boolean`

Defined in: [packages/core/src/core/event-bus.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L77)

Returns whether there are any listeners registered for the given event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | keyof [`ContextEventMap`](../interfaces/ContextEventMap.md) |

#### Returns

`boolean`

#### Inherited from

[`EventBus`](EventBus.md).[`has`](EventBus.md#has)

***

### init()

> `protected` **init**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:690](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L690)

#### Returns

`void`

***

### invalidateTrackedElements()

> **invalidateTrackedElements**(`event`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:750](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L750)

Clears the cached list of tracked elements for interaction, forcing a rebuild on the next hit test.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `string` |

#### Returns

`void`

***

### isPointInPath()

> **isPointInPath**(`path`, `x`, `y`, `fillRule?`): `boolean`

Defined in: [packages/core/src/context/\_base/index.ts:832](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L832)

Tests whether a point is inside the filled region of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`ContextPath`](ContextPath.md) |
| `x` | `number` |
| `y` | `number` |
| `fillRule?` | [`FillRule`](../type-aliases/FillRule.md) |

#### Returns

`boolean`

***

### isPointInStroke()

> **isPointInStroke**(`path`, `x`, `y`): `boolean`

Defined in: [packages/core/src/context/\_base/index.ts:837](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L837)

Tests whether a point is on the stroked outline of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`ContextPath`](ContextPath.md) |
| `x` | `number` |
| `y` | `number` |

#### Returns

`boolean`

***

### layer()

> **layer**\<`TResult`\>(`body`): `TResult`

Defined in: [packages/core/src/context/\_base/index.ts:731](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L731)

Executes a callback within a save/restore pair, returning the callback's result.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TResult` | `void` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | () => `TResult` |

#### Returns

`TResult`

***

### markRenderEnd()

> **markRenderEnd**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:764](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L764)

Signals the end of a render pass.

#### Returns

`void`

***

### markRenderStart()

> **markRenderStart**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:755](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L755)

Signals the start of a render pass; resets the rendered-elements list at depth 0.

#### Returns

`void`

***

### measureText()

> **measureText**(`text`, `font?`): `TextMetrics`

Defined in: [packages/core/src/context/\_base/index.ts:801](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L801)

Measures text dimensions using the context's current font or an optional override.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `font?` | `string` |

#### Returns

`TextMetrics`

***

### off()

> **off**\<`TEvent`\>(`type`, `handler`): `void`

Defined in: [packages/core/src/core/event-bus.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L95)

Removes a previously registered handler for the given event type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ContextEventMap`](../interfaces/ContextEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`ContextEventMap`](../interfaces/ContextEventMap.md)\[`TEvent`\]\> |

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
| `TEvent` *extends* keyof [`ContextEventMap`](../interfaces/ContextEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`ContextEventMap`](../interfaces/ContextEventMap.md)\[`TEvent`\]\> |
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
| `TEvent` *extends* keyof [`ContextEventMap`](../interfaces/ContextEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md)\<[`ContextEventMap`](../interfaces/ContextEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`EventBus`](EventBus.md).[`once`](EventBus.md#once)

***

### rescale()

> `protected` **rescale**(`width`, `height`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:705](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L705)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `width` | `number` |
| `height` | `number` |

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:746](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L746)

Resets the context to its initial state.

#### Returns

`void`

***

### restore()

> **restore**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:726](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L726)

Restores the most recently saved state from the stack.

#### Returns

`void`

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

### rotate()

> **rotate**(`angle`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:781](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L781)

Applies a rotation transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `angle` | `number` |

#### Returns

`void`

***

### save()

> **save**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:720](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L720)

Pushes the current state onto the stack and resets to defaults.

#### Returns

`void`

***

### scale()

> **scale**(`x`, `y`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:785](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L785)

Applies a scale transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

***

### setTransform()

> **setTransform**(`a`, `b`, `c`, `d`, `e`, `f`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:793](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L793)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | `number` |
| `b` | `number` |
| `c` | `number` |
| `d` | `number` |
| `e` | `number` |
| `f` | `number` |

#### Returns

`void`

***

### transform()

> **transform**(`a`, `b`, `c`, `d`, `e`, `f`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:797](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L797)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | `number` |
| `b` | `number` |
| `c` | `number` |
| `d` | `number` |
| `e` | `number` |
| `f` | `number` |

#### Returns

`void`

***

### translate()

> **translate**(`x`, `y`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:789](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L789)

Applies a translation transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`
