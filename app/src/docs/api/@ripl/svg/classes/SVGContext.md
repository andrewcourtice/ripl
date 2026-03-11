[Documentation](../../../packages.md) / [@ripl/svg](../index.md) / SVGContext

# Class: SVGContext

Defined in: [svg/src/index.ts:437](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L437)

SVG rendering context implementation, mapping the unified API to SVG DOM elements via virtual-DOM reconciliation.

## Extends

- [`Context`](../../core/classes/Context.md)\<`SVGSVGElement`\>

## Constructors

### Constructor

> **new SVGContext**(`target`, `options?`): `SVGContext`

Defined in: [svg/src/index.ts:455](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L455)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` |
| `options?` | [`ContextOptions`](../../core/interfaces/ContextOptions.md) |

#### Returns

`SVGContext`

#### Overrides

[`Context`](../../core/classes/Context.md).[`constructor`](../../core/classes/Context.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-buffer"></a> `buffer` | `public` | `boolean` | `false` | [`Context`](../../core/classes/Context.md).[`buffer`](../../core/classes/Context.md#property-buffer) | [core/src/context/\_base/index.ts:396](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L396) |
| <a id="property-currentstate"></a> `currentState` | `protected` | [`BaseState`](../../core/interfaces/BaseState.md) | `undefined` | [`Context`](../../core/classes/Context.md).[`currentState`](../../core/classes/Context.md#property-currentstate) | [core/src/context/\_base/index.ts:404](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L404) |
| <a id="property-element"></a> `element` | `readonly` | `SVGSVGElement` | `undefined` | [`Context`](../../core/classes/Context.md).[`element`](../../core/classes/Context.md#property-element) | [core/src/context/\_base/index.ts:394](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L394) |
| <a id="property-height"></a> `height` | `public` | `number` | `undefined` | [`Context`](../../core/classes/Context.md).[`height`](../../core/classes/Context.md#property-height) | [core/src/context/\_base/index.ts:398](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L398) |
| <a id="property-parent"></a> `parent?` | `public` | [`EventBus`](../../core/classes/EventBus.md)\<[`ContextEventMap`](../../core/interfaces/ContextEventMap.md)\> | `undefined` | [`Context`](../../core/classes/Context.md).[`parent`](../../core/classes/Context.md#property-parent) | [core/src/core/event-bus.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L72) |
| <a id="property-renderdepth"></a> `renderDepth` | `protected` | `number` | `0` | [`Context`](../../core/classes/Context.md).[`renderDepth`](../../core/classes/Context.md#property-renderdepth) | [core/src/context/\_base/index.ts:405](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L405) |
| <a id="property-renderedelements"></a> `renderedElements` | `public` | [`RenderElement`](../../core/interfaces/RenderElement.md)[] | `undefined` | [`Context`](../../core/classes/Context.md).[`renderedElements`](../../core/classes/Context.md#property-renderedelements) | [core/src/context/\_base/index.ts:414](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L414) |
| <a id="property-renderelement"></a> `renderElement?` | `public` | [`RenderElement`](../../core/interfaces/RenderElement.md) | `undefined` | [`Context`](../../core/classes/Context.md).[`renderElement`](../../core/classes/Context.md#property-renderelement) | [core/src/context/\_base/index.ts:413](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L413) |
| <a id="property-root"></a> `root` | `readonly` | `HTMLElement` | `undefined` | [`Context`](../../core/classes/Context.md).[`root`](../../core/classes/Context.md#property-root) | [core/src/context/\_base/index.ts:393](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L393) |
| <a id="property-scaledpr"></a> `scaleDPR` | `public` | [`Scale`](../../core/interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`Context`](../../core/classes/Context.md).[`scaleDPR`](../../core/classes/Context.md#property-scaledpr) | [core/src/context/\_base/index.ts:401](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L401) |
| <a id="property-scalex"></a> `scaleX` | `public` | [`Scale`](../../core/interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`Context`](../../core/classes/Context.md).[`scaleX`](../../core/classes/Context.md#property-scalex) | [core/src/context/\_base/index.ts:399](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L399) |
| <a id="property-scaley"></a> `scaleY` | `public` | [`Scale`](../../core/interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`Context`](../../core/classes/Context.md).[`scaleY`](../../core/classes/Context.md#property-scaley) | [core/src/context/\_base/index.ts:400](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L400) |
| <a id="property-states"></a> `states` | `protected` | [`BaseState`](../../core/interfaces/BaseState.md)[] | `undefined` | [`Context`](../../core/classes/Context.md).[`states`](../../core/classes/Context.md#property-states) | [core/src/context/\_base/index.ts:403](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L403) |
| <a id="property-type"></a> `type` | `readonly` | `string` | `undefined` | [`Context`](../../core/classes/Context.md).[`type`](../../core/classes/Context.md#property-type) | [core/src/context/\_base/index.ts:392](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L392) |
| <a id="property-width"></a> `width` | `public` | `number` | `undefined` | [`Context`](../../core/classes/Context.md).[`width`](../../core/classes/Context.md#property-width) | [core/src/context/\_base/index.ts:397](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L397) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](#property-defaultkey) | `undefined` | [`Context`](../../core/classes/Context.md).[`defaultKey`](../../core/classes/Context.md#property-defaultkey) | [core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Accessors

### currentRenderElement

#### Get Signature

> **get** **currentRenderElement**(): [`RenderElement`](../../core/interfaces/RenderElement.md) \| `undefined`

Defined in: [core/src/context/\_base/index.ts:416](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L416)

##### Returns

[`RenderElement`](../../core/interfaces/RenderElement.md) \| `undefined`

#### Set Signature

> **set** **currentRenderElement**(`element`): `void`

Defined in: [core/src/context/\_base/index.ts:420](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L420)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`RenderElement`](../../core/interfaces/RenderElement.md) \| `undefined` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`currentRenderElement`](../../core/classes/Context.md#currentrenderelement)

***

### direction

#### Get Signature

> **get** **direction**(): [`Direction`](../../core/type-aliases/Direction.md)

Defined in: [core/src/context/\_base/index.ts:444](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L444)

##### Returns

[`Direction`](../../core/type-aliases/Direction.md)

#### Set Signature

> **set** **direction**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:448](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L448)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Direction`](../../core/type-aliases/Direction.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`direction`](../../core/classes/Context.md#direction)

***

### fill

#### Get Signature

> **get** **fill**(): `string`

Defined in: [core/src/context/\_base/index.ts:428](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L428)

##### Returns

`string`

#### Set Signature

> **set** **fill**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:432](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L432)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`fill`](../../core/classes/Context.md#fill)

***

### filter

#### Get Signature

> **get** **filter**(): `string`

Defined in: [core/src/context/\_base/index.ts:436](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L436)

##### Returns

`string`

#### Set Signature

> **set** **filter**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:440](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L440)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`filter`](../../core/classes/Context.md#filter)

***

### font

#### Get Signature

> **get** **font**(): `string`

Defined in: [core/src/context/\_base/index.ts:452](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L452)

##### Returns

`string`

#### Set Signature

> **set** **font**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:456](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L456)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`font`](../../core/classes/Context.md#font)

***

### fontKerning

#### Get Signature

> **get** **fontKerning**(): [`FontKerning`](../../core/type-aliases/FontKerning.md)

Defined in: [core/src/context/\_base/index.ts:460](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L460)

##### Returns

[`FontKerning`](../../core/type-aliases/FontKerning.md)

#### Set Signature

> **set** **fontKerning**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:464](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L464)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`FontKerning`](../../core/type-aliases/FontKerning.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`fontKerning`](../../core/classes/Context.md#fontkerning)

***

### globalCompositeOperation

#### Get Signature

> **get** **globalCompositeOperation**(): `unknown`

Defined in: [core/src/context/\_base/index.ts:476](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L476)

##### Returns

`unknown`

#### Set Signature

> **set** **globalCompositeOperation**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:480](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L480)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`globalCompositeOperation`](../../core/classes/Context.md#globalcompositeoperation)

***

### lineCap

#### Get Signature

> **get** **lineCap**(): [`LineCap`](../../core/type-aliases/LineCap.md)

Defined in: [core/src/context/\_base/index.ts:484](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L484)

##### Returns

[`LineCap`](../../core/type-aliases/LineCap.md)

#### Set Signature

> **set** **lineCap**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:488](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L488)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`LineCap`](../../core/type-aliases/LineCap.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`lineCap`](../../core/classes/Context.md#linecap)

***

### lineDash

#### Get Signature

> **get** **lineDash**(): `number`[]

Defined in: [core/src/context/\_base/index.ts:492](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L492)

##### Returns

`number`[]

#### Set Signature

> **set** **lineDash**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:496](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L496)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number`[] |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`lineDash`](../../core/classes/Context.md#linedash)

***

### lineDashOffset

#### Get Signature

> **get** **lineDashOffset**(): `number`

Defined in: [core/src/context/\_base/index.ts:500](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L500)

##### Returns

`number`

#### Set Signature

> **set** **lineDashOffset**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:504](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L504)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`lineDashOffset`](../../core/classes/Context.md#linedashoffset)

***

### lineJoin

#### Get Signature

> **get** **lineJoin**(): [`LineJoin`](../../core/type-aliases/LineJoin.md)

Defined in: [core/src/context/\_base/index.ts:508](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L508)

##### Returns

[`LineJoin`](../../core/type-aliases/LineJoin.md)

#### Set Signature

> **set** **lineJoin**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:512](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L512)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`LineJoin`](../../core/type-aliases/LineJoin.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`lineJoin`](../../core/classes/Context.md#linejoin)

***

### lineWidth

#### Get Signature

> **get** **lineWidth**(): `number`

Defined in: [core/src/context/\_base/index.ts:516](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L516)

##### Returns

`number`

#### Set Signature

> **set** **lineWidth**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:520](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L520)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`lineWidth`](../../core/classes/Context.md#linewidth)

***

### miterLimit

#### Get Signature

> **get** **miterLimit**(): `number`

Defined in: [core/src/context/\_base/index.ts:524](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L524)

##### Returns

`number`

#### Set Signature

> **set** **miterLimit**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:528](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L528)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`miterLimit`](../../core/classes/Context.md#miterlimit)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/src/context/\_base/index.ts:468](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L468)

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:472](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L472)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`opacity`](../../core/classes/Context.md#opacity)

***

### rotation

#### Get Signature

> **get** **rotation**(): [`Rotation`](../../core/type-aliases/Rotation.md)

Defined in: [core/src/context/\_base/index.ts:628](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L628)

##### Returns

[`Rotation`](../../core/type-aliases/Rotation.md)

#### Set Signature

> **set** **rotation**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:632](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L632)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Rotation`](../../core/type-aliases/Rotation.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`rotation`](../../core/classes/Context.md#rotation)

***

### shadowBlur

#### Get Signature

> **get** **shadowBlur**(): `number`

Defined in: [core/src/context/\_base/index.ts:532](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L532)

##### Returns

`number`

#### Set Signature

> **set** **shadowBlur**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:536](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L536)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`shadowBlur`](../../core/classes/Context.md#shadowblur)

***

### shadowColor

#### Get Signature

> **get** **shadowColor**(): `string`

Defined in: [core/src/context/\_base/index.ts:540](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L540)

##### Returns

`string`

#### Set Signature

> **set** **shadowColor**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:544](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L544)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`shadowColor`](../../core/classes/Context.md#shadowcolor)

***

### shadowOffsetX

#### Get Signature

> **get** **shadowOffsetX**(): `number`

Defined in: [core/src/context/\_base/index.ts:548](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L548)

##### Returns

`number`

#### Set Signature

> **set** **shadowOffsetX**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:552](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L552)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`shadowOffsetX`](../../core/classes/Context.md#shadowoffsetx)

***

### shadowOffsetY

#### Get Signature

> **get** **shadowOffsetY**(): `number`

Defined in: [core/src/context/\_base/index.ts:556](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L556)

##### Returns

`number`

#### Set Signature

> **set** **shadowOffsetY**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:560](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L560)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`shadowOffsetY`](../../core/classes/Context.md#shadowoffsety)

***

### stroke

#### Get Signature

> **get** **stroke**(): `string`

Defined in: [core/src/context/\_base/index.ts:564](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L564)

##### Returns

`string`

#### Set Signature

> **set** **stroke**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:568](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L568)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`stroke`](../../core/classes/Context.md#stroke)

***

### textAlign

#### Get Signature

> **get** **textAlign**(): [`TextAlignment`](../../core/type-aliases/TextAlignment.md)

Defined in: [core/src/context/\_base/index.ts:572](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L572)

##### Returns

[`TextAlignment`](../../core/type-aliases/TextAlignment.md)

#### Set Signature

> **set** **textAlign**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:576](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L576)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TextAlignment`](../../core/type-aliases/TextAlignment.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`textAlign`](../../core/classes/Context.md#textalign)

***

### textBaseline

#### Get Signature

> **get** **textBaseline**(): [`TextBaseline`](../../core/type-aliases/TextBaseline.md)

Defined in: [core/src/context/\_base/index.ts:580](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L580)

##### Returns

[`TextBaseline`](../../core/type-aliases/TextBaseline.md)

#### Set Signature

> **set** **textBaseline**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:584](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L584)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TextBaseline`](../../core/type-aliases/TextBaseline.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`textBaseline`](../../core/classes/Context.md#textbaseline)

***

### transformOriginX

#### Get Signature

> **get** **transformOriginX**(): [`TransformOrigin`](../../core/type-aliases/TransformOrigin.md)

Defined in: [core/src/context/\_base/index.ts:636](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L636)

##### Returns

[`TransformOrigin`](../../core/type-aliases/TransformOrigin.md)

#### Set Signature

> **set** **transformOriginX**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:640](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L640)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TransformOrigin`](../../core/type-aliases/TransformOrigin.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`transformOriginX`](../../core/classes/Context.md#transformoriginx)

***

### transformOriginY

#### Get Signature

> **get** **transformOriginY**(): [`TransformOrigin`](../../core/type-aliases/TransformOrigin.md)

Defined in: [core/src/context/\_base/index.ts:644](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L644)

##### Returns

[`TransformOrigin`](../../core/type-aliases/TransformOrigin.md)

#### Set Signature

> **set** **transformOriginY**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:648](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L648)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TransformOrigin`](../../core/type-aliases/TransformOrigin.md) |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`transformOriginY`](../../core/classes/Context.md#transformoriginy)

***

### transformScaleX

#### Get Signature

> **get** **transformScaleX**(): `number`

Defined in: [core/src/context/\_base/index.ts:612](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L612)

##### Returns

`number`

#### Set Signature

> **set** **transformScaleX**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:616](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L616)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`transformScaleX`](../../core/classes/Context.md#transformscalex)

***

### transformScaleY

#### Get Signature

> **get** **transformScaleY**(): `number`

Defined in: [core/src/context/\_base/index.ts:620](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L620)

##### Returns

`number`

#### Set Signature

> **set** **transformScaleY**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:624](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L624)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`transformScaleY`](../../core/classes/Context.md#transformscaley)

***

### translateX

#### Get Signature

> **get** **translateX**(): `number`

Defined in: [core/src/context/\_base/index.ts:596](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L596)

##### Returns

`number`

#### Set Signature

> **set** **translateX**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:600](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L600)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`translateX`](../../core/classes/Context.md#translatex)

***

### translateY

#### Get Signature

> **get** **translateY**(): `number`

Defined in: [core/src/context/\_base/index.ts:604](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L604)

##### Returns

`number`

#### Set Signature

> **set** **translateY**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:608](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L608)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`translateY`](../../core/classes/Context.md#translatey)

***

### zIndex

#### Get Signature

> **get** **zIndex**(): `number`

Defined in: [core/src/context/\_base/index.ts:588](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L588)

##### Returns

`number`

#### Set Signature

> **set** **zIndex**(`value`): `void`

Defined in: [core/src/context/\_base/index.ts:592](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L592)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`zIndex`](../../core/classes/Context.md#zindex)

## Methods

### applyClip()

> **applyClip**(`path`, `fillRule?`): `void`

Defined in: [svg/src/index.ts:758](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L758)

Clips subsequent drawing operations to the given path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`SVGPath`](SVGPath.md) |
| `fillRule?` | [`FillRule`](../../core/type-aliases/FillRule.md) |

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`applyClip`](../../core/classes/Context.md#applyclip)

***

### applyFill()

> **applyFill**(`element`, `fillRule?`): `void`

Defined in: [svg/src/index.ts:795](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L795)

Fills the given path or text element using the current fill style.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`SVGContextElement`](../interfaces/SVGContextElement.md) |
| `fillRule?` | [`FillRule`](../../core/type-aliases/FillRule.md) |

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`applyFill`](../../core/classes/Context.md#applyfill)

***

### applyStroke()

> **applyStroke**(`element`): `void`

Defined in: [svg/src/index.ts:801](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L801)

Strokes the given path or text element using the current stroke style.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`SVGContextElement`](../interfaces/SVGContextElement.md) |

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`applyStroke`](../../core/classes/Context.md#applystroke)

***

### batch()

> **batch**\<`TResult`\>(`body`): `TResult`

Defined in: [core/src/context/\_base/index.ts:769](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L769)

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

#### Inherited from

[`Context`](../../core/classes/Context.md).[`batch`](../../core/classes/Context.md#batch)

***

### clear()

> **clear**(): `void`

Defined in: [core/src/context/\_base/index.ts:742](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L742)

Clears the entire rendering surface.

#### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`clear`](../../core/classes/Context.md#clear)

***

### createPath()

> **createPath**(`id?`): [`SVGPath`](SVGPath.md)

Defined in: [svg/src/index.ts:647](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L647)

Creates a new path element, optionally reusing an id for SVG diffing efficiency.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id?` | `string` |

#### Returns

[`SVGPath`](SVGPath.md)

#### Overrides

[`Context`](../../core/classes/Context.md).[`createPath`](../../core/classes/Context.md#createpath)

***

### createText()

> **createText**(`options`): [`ContextText`](../../core/classes/ContextText.md)

Defined in: [svg/src/index.ts:654](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L654)

Creates a new text element from the given options.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TextOptions`](../../core/type-aliases/TextOptions.md) |

#### Returns

[`ContextText`](../../core/classes/ContextText.md)

#### Overrides

[`Context`](../../core/classes/Context.md).[`createText`](../../core/classes/Context.md#createtext)

***

### destroy()

> **destroy**(): `void`

Defined in: [core/src/context/\_base/index.ts:1066](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1066)

Destroys the context, removing the DOM element and disposing all resources.

#### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`destroy`](../../core/classes/Context.md#destroy)

***

### disableInteraction()

> **disableInteraction**(): `void`

Defined in: [core/src/context/\_base/index.ts:1054](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1054)

Disables DOM interaction events and clears the active element set.

#### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`disableInteraction`](../../core/classes/Context.md#disableinteraction)

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

[`Context`](../../core/classes/Context.md).[`dispose`](../../core/classes/Context.md#dispose)

***

### drawImage()

> **drawImage**(`image`, `x`, `y`, `width?`, `height?`): `void`

Defined in: [svg/src/index.ts:708](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L708)

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

#### Overrides

[`Context`](../../core/classes/Context.md).[`drawImage`](../../core/classes/Context.md#drawimage)

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

[`Context`](../../core/classes/Context.md).[`emit`](../../core/classes/Context.md#emit)

#### Call Signature

> **emit**\<`TEvent`\>(`type`, `data`): [`Event`](../../core/classes/Event.md)\<[`ContextEventMap`](../../core/interfaces/ContextEventMap.md)\[`TEvent`\]\>

Defined in: [core/src/core/event-bus.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L121)

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.

##### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ContextEventMap`](../../core/interfaces/ContextEventMap.md) |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `data` | [`ContextEventMap`](../../core/interfaces/ContextEventMap.md)\[`TEvent`\] |

##### Returns

[`Event`](../../core/classes/Event.md)\<[`ContextEventMap`](../../core/interfaces/ContextEventMap.md)\[`TEvent`\]\>

##### Inherited from

[`Context`](../../core/classes/Context.md).[`emit`](../../core/classes/Context.md#emit)

***

### enableInteraction()

> **enableInteraction**(): `void`

Defined in: [core/src/context/\_base/index.ts:1026](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1026)

Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing.

#### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`enableInteraction`](../../core/classes/Context.md#enableinteraction)

***

### getDefaultState()

> `protected` **getDefaultState**(): `object`

Defined in: [core/src/context/\_base/index.ts:715](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L715)

#### Returns

`object`

##### direction

> **direction**: [`Direction`](../../core/type-aliases/Direction.md)

##### fill

> **fill**: `string`

##### filter

> **filter**: `string`

##### font

> **font**: `string`

##### fontKerning

> **fontKerning**: [`FontKerning`](../../core/type-aliases/FontKerning.md)

##### globalCompositeOperation

> **globalCompositeOperation**: `unknown`

##### lineCap

> **lineCap**: [`LineCap`](../../core/type-aliases/LineCap.md)

##### lineDash

> **lineDash**: `number`[]

##### lineDashOffset

> **lineDashOffset**: `number`

##### lineJoin

> **lineJoin**: [`LineJoin`](../../core/type-aliases/LineJoin.md)

##### lineWidth

> **lineWidth**: `number`

##### miterLimit

> **miterLimit**: `number`

##### opacity

> **opacity**: `number`

##### rotation

> **rotation**: [`Rotation`](../../core/type-aliases/Rotation.md)

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

> **textAlign**: [`TextAlignment`](../../core/type-aliases/TextAlignment.md)

##### textBaseline

> **textBaseline**: [`TextBaseline`](../../core/type-aliases/TextBaseline.md)

##### transformOriginX

> **transformOriginX**: [`TransformOrigin`](../../core/type-aliases/TransformOrigin.md)

##### transformOriginY

> **transformOriginY**: [`TransformOrigin`](../../core/type-aliases/TransformOrigin.md)

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

#### Inherited from

[`Context`](../../core/classes/Context.md).[`getDefaultState`](../../core/classes/Context.md#getdefaultstate)

***

### has()

> **has**(`type`): `boolean`

Defined in: [core/src/core/event-bus.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L77)

Returns whether there are any listeners registered for the given event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | keyof [`ContextEventMap`](../../core/interfaces/ContextEventMap.md) |

#### Returns

`boolean`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`has`](../../core/classes/Context.md#has)

***

### init()

> `protected` **init**(): `void`

Defined in: [core/src/context/\_base/index.ts:690](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L690)

#### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`init`](../../core/classes/Context.md#init)

***

### invalidateTrackedElements()

> **invalidateTrackedElements**(`event`): `void`

Defined in: [core/src/context/\_base/index.ts:750](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L750)

Clears the cached list of tracked elements for interaction, forcing a rebuild on the next hit test.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `string` |

#### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`invalidateTrackedElements`](../../core/classes/Context.md#invalidatetrackedelements)

***

### isPointInPath()

> **isPointInPath**(`path`, `x`, `y`, `fillRule?`): `boolean`

Defined in: [svg/src/index.ts:820](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L820)

Tests whether a point is inside the filled region of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`SVGPath`](SVGPath.md) |
| `x` | `number` |
| `y` | `number` |
| `fillRule?` | [`FillRule`](../../core/type-aliases/FillRule.md) |

#### Returns

`boolean`

#### Overrides

[`Context`](../../core/classes/Context.md).[`isPointInPath`](../../core/classes/Context.md#ispointinpath)

***

### isPointInStroke()

> **isPointInStroke**(`path`, `x`, `y`): `boolean`

Defined in: [svg/src/index.ts:824](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L824)

Tests whether a point is on the stroked outline of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`SVGPath`](SVGPath.md) |
| `x` | `number` |
| `y` | `number` |

#### Returns

`boolean`

#### Overrides

[`Context`](../../core/classes/Context.md).[`isPointInStroke`](../../core/classes/Context.md#ispointinstroke)

***

### layer()

> **layer**\<`TResult`\>(`body`): `TResult`

Defined in: [core/src/context/\_base/index.ts:731](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L731)

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

#### Inherited from

[`Context`](../../core/classes/Context.md).[`layer`](../../core/classes/Context.md#layer)

***

### markRenderEnd()

> **markRenderEnd**(): `void`

Defined in: [svg/src/index.ts:633](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L633)

Signals the end of a render pass.

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`markRenderEnd`](../../core/classes/Context.md#markrenderend)

***

### markRenderStart()

> **markRenderStart**(): `void`

Defined in: [svg/src/index.ts:621](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L621)

Signals the start of a render pass; resets the rendered-elements list at depth 0.

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`markRenderStart`](../../core/classes/Context.md#markrenderstart)

***

### measureText()

> **measureText**(`text`, `font?`): `TextMetrics`

Defined in: [svg/src/index.ts:813](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L813)

Measures text dimensions using the context's current font or an optional override.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `font?` | `string` |

#### Returns

`TextMetrics`

#### Overrides

[`Context`](../../core/classes/Context.md).[`measureText`](../../core/classes/Context.md#measuretext)

***

### off()

> **off**\<`TEvent`\>(`type`, `handler`): `void`

Defined in: [core/src/core/event-bus.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L95)

Removes a previously registered handler for the given event type.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ContextEventMap`](../../core/interfaces/ContextEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`ContextEventMap`](../../core/interfaces/ContextEventMap.md)\[`TEvent`\]\> |

#### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`off`](../../core/classes/Context.md#off)

***

### on()

> **on**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [core/src/core/event-bus.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L82)

Subscribes a handler to the given event type and returns a disposable for cleanup.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ContextEventMap`](../../core/interfaces/ContextEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`ContextEventMap`](../../core/interfaces/ContextEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../../core/type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Context`](../../core/classes/Context.md).[`on`](../../core/classes/Context.md#on)

***

### once()

> **once**\<`TEvent`\>(`type`, `handler`, `options?`): [`Disposable`](../../utilities/interfaces/Disposable.md)

Defined in: [core/src/core/event-bus.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L110)

Subscribes a handler that is automatically removed after it fires once.

#### Type Parameters

| Type Parameter |
| ------ |
| `TEvent` *extends* keyof [`ContextEventMap`](../../core/interfaces/ContextEventMap.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TEvent` |
| `handler` | [`EventHandler`](../../core/type-aliases/EventHandler.md)\<[`ContextEventMap`](../../core/interfaces/ContextEventMap.md)\[`TEvent`\]\> |
| `options?` | [`EventSubscriptionOptions`](../../core/type-aliases/EventSubscriptionOptions.md) |

#### Returns

[`Disposable`](../../utilities/interfaces/Disposable.md)

#### Inherited from

[`Context`](../../core/classes/Context.md).[`once`](../../core/classes/Context.md#once)

***

### rescale()

> `protected` **rescale**(`width`, `height`): `void`

Defined in: [svg/src/index.ts:546](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L546)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `width` | `number` |
| `height` | `number` |

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`rescale`](../../core/classes/Context.md#rescale)

***

### reset()

> **reset**(): `void`

Defined in: [core/src/context/\_base/index.ts:746](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L746)

Resets the context to its initial state.

#### Returns

`void`

#### Inherited from

[`Context`](../../core/classes/Context.md).[`reset`](../../core/classes/Context.md#reset)

***

### restore()

> **restore**(): `void`

Defined in: [svg/src/index.ts:730](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L730)

Restores the most recently saved state from the stack.

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`restore`](../../core/classes/Context.md#restore)

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

[`Context`](../../core/classes/Context.md).[`retain`](../../core/classes/Context.md#retain)

***

### rotate()

> **rotate**(`angle`): `void`

Defined in: [svg/src/index.ts:736](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L736)

Applies a rotation transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `angle` | `number` |

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`rotate`](../../core/classes/Context.md#rotate)

***

### save()

> **save**(): `void`

Defined in: [svg/src/index.ts:724](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L724)

Pushes the current state onto the stack and resets to defaults.

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`save`](../../core/classes/Context.md#save)

***

### scale()

> **scale**(`x`, `y`): `void`

Defined in: [svg/src/index.ts:740](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L740)

Applies a scale transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`scale`](../../core/classes/Context.md#scale)

***

### setTransform()

> **setTransform**(`a`, `b`, `c`, `d`, `e`, `f`): `void`

Defined in: [svg/src/index.ts:749](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L749)

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

#### Overrides

[`Context`](../../core/classes/Context.md).[`setTransform`](../../core/classes/Context.md#settransform)

***

### transform()

> **transform**(`a`, `b`, `c`, `d`, `e`, `f`): `void`

Defined in: [svg/src/index.ts:754](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L754)

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

#### Overrides

[`Context`](../../core/classes/Context.md).[`transform`](../../core/classes/Context.md#transform)

***

### translate()

> **translate**(`x`, `y`): `void`

Defined in: [svg/src/index.ts:744](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L744)

Applies a translation transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`Context`](../../core/classes/Context.md).[`translate`](../../core/classes/Context.md#translate)
