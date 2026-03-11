[Documentation](../../../packages.md) / [@ripl/core](../index.md) / CanvasContext

# Class: CanvasContext

Defined in: [packages/core/src/context/canvas.ts:160](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L160)

Canvas 2D rendering context implementation, mapping the unified API to `CanvasRenderingContext2D`.

## Extends

- [`Context`](Context.md)\<`HTMLCanvasElement`\>

## Extended by

- [`Context3D`](../../3d/classes/Context3D.md)

## Constructors

### Constructor

> **new CanvasContext**(`target`, `options?`): `CanvasContext`

Defined in: [packages/core/src/context/canvas.ts:370](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L370)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` |
| `options?` | [`ContextOptions`](../interfaces/ContextOptions.md) |

#### Returns

`CanvasContext`

#### Overrides

[`Context`](Context.md).[`constructor`](Context.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-buffer"></a> `buffer` | `public` | `boolean` | `false` | [`Context`](Context.md).[`buffer`](Context.md#property-buffer) | [packages/core/src/context/\_base/index.ts:396](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L396) |
| <a id="property-context"></a> `context` | `protected` | `CanvasRenderingContext2D` | `undefined` | - | [packages/core/src/context/canvas.ts:162](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L162) |
| <a id="property-currentstate"></a> `currentState` | `protected` | [`BaseState`](../interfaces/BaseState.md) | `undefined` | [`Context`](Context.md).[`currentState`](Context.md#property-currentstate) | [packages/core/src/context/\_base/index.ts:404](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L404) |
| <a id="property-element"></a> `element` | `readonly` | `HTMLCanvasElement` | `undefined` | [`Context`](Context.md).[`element`](Context.md#property-element) | [packages/core/src/context/\_base/index.ts:394](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L394) |
| <a id="property-height"></a> `height` | `public` | `number` | `undefined` | [`Context`](Context.md).[`height`](Context.md#property-height) | [packages/core/src/context/\_base/index.ts:398](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L398) |
| <a id="property-parent"></a> `parent?` | `public` | [`EventBus`](EventBus.md)\<[`ContextEventMap`](../interfaces/ContextEventMap.md)\> | `undefined` | [`Context`](Context.md).[`parent`](Context.md#property-parent) | [packages/core/src/core/event-bus.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L72) |
| <a id="property-renderdepth"></a> `renderDepth` | `protected` | `number` | `0` | [`Context`](Context.md).[`renderDepth`](Context.md#property-renderdepth) | [packages/core/src/context/\_base/index.ts:405](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L405) |
| <a id="property-renderedelements"></a> `renderedElements` | `public` | [`RenderElement`](../interfaces/RenderElement.md)[] | `undefined` | [`Context`](Context.md).[`renderedElements`](Context.md#property-renderedelements) | [packages/core/src/context/\_base/index.ts:414](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L414) |
| <a id="property-renderelement"></a> `renderElement?` | `public` | [`RenderElement`](../interfaces/RenderElement.md) | `undefined` | [`Context`](Context.md).[`renderElement`](Context.md#property-renderelement) | [packages/core/src/context/\_base/index.ts:413](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L413) |
| <a id="property-root"></a> `root` | `readonly` | `HTMLElement` | `undefined` | [`Context`](Context.md).[`root`](Context.md#property-root) | [packages/core/src/context/\_base/index.ts:393](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L393) |
| <a id="property-scaledpr"></a> `scaleDPR` | `public` | [`Scale`](../interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`Context`](Context.md).[`scaleDPR`](Context.md#property-scaledpr) | [packages/core/src/context/\_base/index.ts:401](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L401) |
| <a id="property-scalex"></a> `scaleX` | `public` | [`Scale`](../interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`Context`](Context.md).[`scaleX`](Context.md#property-scalex) | [packages/core/src/context/\_base/index.ts:399](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L399) |
| <a id="property-scaley"></a> `scaleY` | `public` | [`Scale`](../interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`Context`](Context.md).[`scaleY`](Context.md#property-scaley) | [packages/core/src/context/\_base/index.ts:400](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L400) |
| <a id="property-states"></a> `states` | `protected` | [`BaseState`](../interfaces/BaseState.md)[] | `undefined` | [`Context`](Context.md).[`states`](Context.md#property-states) | [packages/core/src/context/\_base/index.ts:403](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L403) |
| <a id="property-type"></a> `type` | `readonly` | `string` | `undefined` | [`Context`](Context.md).[`type`](Context.md#property-type) | [packages/core/src/context/\_base/index.ts:392](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L392) |
| <a id="property-width"></a> `width` | `public` | `number` | `undefined` | [`Context`](Context.md).[`width`](Context.md#property-width) | [packages/core/src/context/\_base/index.ts:397](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L397) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](Disposer.md#property-defaultkey) | `undefined` | [`Context`](Context.md).[`defaultKey`](Context.md#property-defaultkey) | [packages/core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

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

#### Inherited from

[`Context`](Context.md).[`currentRenderElement`](Context.md#currentrenderelement)

***

### direction

#### Get Signature

> **get** **direction**(): [`Direction`](../type-aliases/Direction.md)

Defined in: [packages/core/src/context/canvas.ts:194](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L194)

##### Returns

[`Direction`](../type-aliases/Direction.md)

#### Set Signature

> **set** **direction**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:198](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L198)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Direction`](../type-aliases/Direction.md) |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`direction`](Context.md#direction)

***

### fill

#### Get Signature

> **get** **fill**(): `string`

Defined in: [packages/core/src/context/canvas.ts:166](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L166)

##### Returns

`string`

#### Set Signature

> **set** **fill**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:170](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L170)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`fill`](Context.md#fill)

***

### filter

#### Get Signature

> **get** **filter**(): `string`

Defined in: [packages/core/src/context/canvas.ts:186](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L186)

##### Returns

`string`

#### Set Signature

> **set** **filter**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:190](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L190)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`filter`](Context.md#filter)

***

### font

#### Get Signature

> **get** **font**(): `string`

Defined in: [packages/core/src/context/canvas.ts:202](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L202)

##### Returns

`string`

#### Set Signature

> **set** **font**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:206](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L206)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`font`](Context.md#font)

***

### fontKerning

#### Get Signature

> **get** **fontKerning**(): [`FontKerning`](../type-aliases/FontKerning.md)

Defined in: [packages/core/src/context/canvas.ts:210](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L210)

##### Returns

[`FontKerning`](../type-aliases/FontKerning.md)

#### Set Signature

> **set** **fontKerning**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:214](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L214)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`FontKerning`](../type-aliases/FontKerning.md) |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`fontKerning`](Context.md#fontkerning)

***

### globalCompositeOperation

#### Get Signature

> **get** **globalCompositeOperation**(): `unknown`

Defined in: [packages/core/src/context/canvas.ts:226](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L226)

##### Returns

`unknown`

#### Set Signature

> **set** **globalCompositeOperation**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:230](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L230)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`globalCompositeOperation`](Context.md#globalcompositeoperation)

***

### lineCap

#### Get Signature

> **get** **lineCap**(): [`LineCap`](../type-aliases/LineCap.md)

Defined in: [packages/core/src/context/canvas.ts:234](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L234)

##### Returns

[`LineCap`](../type-aliases/LineCap.md)

#### Set Signature

> **set** **lineCap**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:238](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L238)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`LineCap`](../type-aliases/LineCap.md) |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`lineCap`](Context.md#linecap)

***

### lineDash

#### Get Signature

> **get** **lineDash**(): `number`[]

Defined in: [packages/core/src/context/canvas.ts:242](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L242)

##### Returns

`number`[]

#### Set Signature

> **set** **lineDash**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:246](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L246)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number`[] |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`lineDash`](Context.md#linedash)

***

### lineDashOffset

#### Get Signature

> **get** **lineDashOffset**(): `number`

Defined in: [packages/core/src/context/canvas.ts:250](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L250)

##### Returns

`number`

#### Set Signature

> **set** **lineDashOffset**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:254](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L254)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`lineDashOffset`](Context.md#linedashoffset)

***

### lineJoin

#### Get Signature

> **get** **lineJoin**(): [`LineJoin`](../type-aliases/LineJoin.md)

Defined in: [packages/core/src/context/canvas.ts:258](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L258)

##### Returns

[`LineJoin`](../type-aliases/LineJoin.md)

#### Set Signature

> **set** **lineJoin**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:262](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L262)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`LineJoin`](../type-aliases/LineJoin.md) |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`lineJoin`](Context.md#linejoin)

***

### lineWidth

#### Get Signature

> **get** **lineWidth**(): `number`

Defined in: [packages/core/src/context/canvas.ts:266](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L266)

##### Returns

`number`

#### Set Signature

> **set** **lineWidth**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:270](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L270)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`lineWidth`](Context.md#linewidth)

***

### miterLimit

#### Get Signature

> **get** **miterLimit**(): `number`

Defined in: [packages/core/src/context/canvas.ts:274](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L274)

##### Returns

`number`

#### Set Signature

> **set** **miterLimit**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:278](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L278)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`miterLimit`](Context.md#miterlimit)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [packages/core/src/context/canvas.ts:218](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L218)

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:222](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L222)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`opacity`](Context.md#opacity)

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

#### Inherited from

[`Context`](Context.md).[`rotation`](Context.md#rotation)

***

### shadowBlur

#### Get Signature

> **get** **shadowBlur**(): `number`

Defined in: [packages/core/src/context/canvas.ts:282](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L282)

##### Returns

`number`

#### Set Signature

> **set** **shadowBlur**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:286](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L286)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`shadowBlur`](Context.md#shadowblur)

***

### shadowColor

#### Get Signature

> **get** **shadowColor**(): `string`

Defined in: [packages/core/src/context/canvas.ts:290](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L290)

##### Returns

`string`

#### Set Signature

> **set** **shadowColor**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:294](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L294)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`shadowColor`](Context.md#shadowcolor)

***

### shadowOffsetX

#### Get Signature

> **get** **shadowOffsetX**(): `number`

Defined in: [packages/core/src/context/canvas.ts:298](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L298)

##### Returns

`number`

#### Set Signature

> **set** **shadowOffsetX**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:302](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L302)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`shadowOffsetX`](Context.md#shadowoffsetx)

***

### shadowOffsetY

#### Get Signature

> **get** **shadowOffsetY**(): `number`

Defined in: [packages/core/src/context/canvas.ts:306](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L306)

##### Returns

`number`

#### Set Signature

> **set** **shadowOffsetY**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:310](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L310)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`shadowOffsetY`](Context.md#shadowoffsety)

***

### stroke

#### Get Signature

> **get** **stroke**(): `string`

Defined in: [packages/core/src/context/canvas.ts:314](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L314)

##### Returns

`string`

#### Set Signature

> **set** **stroke**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:318](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L318)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`stroke`](Context.md#stroke)

***

### textAlign

#### Get Signature

> **get** **textAlign**(): [`TextAlignment`](../type-aliases/TextAlignment.md)

Defined in: [packages/core/src/context/canvas.ts:334](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L334)

##### Returns

[`TextAlignment`](../type-aliases/TextAlignment.md)

#### Set Signature

> **set** **textAlign**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:338](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L338)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TextAlignment`](../type-aliases/TextAlignment.md) |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`textAlign`](Context.md#textalign)

***

### textBaseline

#### Get Signature

> **get** **textBaseline**(): [`TextBaseline`](../type-aliases/TextBaseline.md)

Defined in: [packages/core/src/context/canvas.ts:342](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L342)

##### Returns

[`TextBaseline`](../type-aliases/TextBaseline.md)

#### Set Signature

> **set** **textBaseline**(`value`): `void`

Defined in: [packages/core/src/context/canvas.ts:346](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L346)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TextBaseline`](../type-aliases/TextBaseline.md) |

##### Returns

`void`

#### Overrides

[`Context`](Context.md).[`textBaseline`](Context.md#textbaseline)

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

#### Inherited from

[`Context`](Context.md).[`transformOriginX`](Context.md#transformoriginx)

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

#### Inherited from

[`Context`](Context.md).[`transformOriginY`](Context.md#transformoriginy)

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

#### Inherited from

[`Context`](Context.md).[`transformScaleX`](Context.md#transformscalex)

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

#### Inherited from

[`Context`](Context.md).[`transformScaleY`](Context.md#transformscaley)

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

#### Inherited from

[`Context`](Context.md).[`translateX`](Context.md#translatex)

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

#### Inherited from

[`Context`](Context.md).[`translateY`](Context.md#translatey)

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

#### Inherited from

[`Context`](Context.md).[`zIndex`](Context.md#zindex)

## Methods

### applyClip()

> **applyClip**(`path`, `fillRule?`): `void`

Defined in: [packages/core/src/context/canvas.ts:457](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L457)

Clips subsequent drawing operations to the given path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`CanvasPath`](CanvasPath.md) |
| `fillRule?` | [`FillRule`](../type-aliases/FillRule.md) |

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`applyClip`](Context.md#applyclip)

***

### applyFill()

> **applyFill**(`element`, `fillRule?`): `void`

Defined in: [packages/core/src/context/canvas.ts:499](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L499)

Fills the given path or text element using the current fill style.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`ContextText`](ContextText.md) \| [`CanvasPath`](CanvasPath.md) |
| `fillRule?` | [`FillRule`](../type-aliases/FillRule.md) |

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`applyFill`](Context.md#applyfill)

***

### applyStroke()

> **applyStroke**(`element`): `void`

Defined in: [packages/core/src/context/canvas.ts:511](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L511)

Strokes the given path or text element using the current stroke style.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`ContextText`](ContextText.md) \| [`CanvasPath`](CanvasPath.md) |

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`applyStroke`](Context.md#applystroke)

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

#### Inherited from

[`Context`](Context.md).[`batch`](Context.md#batch)

***

### clear()

> **clear**(): `void`

Defined in: [packages/core/src/context/canvas.ts:416](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L416)

Clears the entire rendering surface.

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`clear`](Context.md#clear)

***

### createPath()

> **createPath**(`id?`): [`CanvasPath`](CanvasPath.md)

Defined in: [packages/core/src/context/canvas.ts:453](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L453)

Creates a new path element, optionally reusing an id for SVG diffing efficiency.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id?` | `string` |

#### Returns

[`CanvasPath`](CanvasPath.md)

#### Overrides

[`Context`](Context.md).[`createPath`](Context.md#createpath)

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

#### Inherited from

[`Context`](Context.md).[`createText`](Context.md#createtext)

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:1066](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1066)

Destroys the context, removing the DOM element and disposing all resources.

#### Returns

`void`

#### Inherited from

[`Context`](Context.md).[`destroy`](Context.md#destroy)

***

### disableInteraction()

> **disableInteraction**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:1054](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1054)

Disables DOM interaction events and clears the active element set.

#### Returns

`void`

#### Inherited from

[`Context`](Context.md).[`disableInteraction`](Context.md#disableinteraction)

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

[`Context`](Context.md).[`dispose`](Context.md#dispose)

***

### drawImage()

> **drawImage**(`image`, `x`, `y`, `width?`, `height?`): `void`

Defined in: [packages/core/src/context/canvas.ts:491](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L491)

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

[`Context`](Context.md).[`drawImage`](Context.md#drawimage)

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

[`Context`](Context.md).[`emit`](Context.md#emit)

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

[`Context`](Context.md).[`emit`](Context.md#emit)

***

### enableInteraction()

> **enableInteraction**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:1026](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1026)

Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing.

#### Returns

`void`

#### Inherited from

[`Context`](Context.md).[`enableInteraction`](Context.md#enableinteraction)

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

#### Inherited from

[`Context`](Context.md).[`getDefaultState`](Context.md#getdefaultstate)

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

[`Context`](Context.md).[`has`](Context.md#has)

***

### init()

> `protected` **init**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:690](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L690)

#### Returns

`void`

#### Inherited from

[`Context`](Context.md).[`init`](Context.md#init)

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

#### Inherited from

[`Context`](Context.md).[`invalidateTrackedElements`](Context.md#invalidatetrackedelements)

***

### isPointInPath()

> **isPointInPath**(`path`, `x`, `y`, `fillRule?`): `boolean`

Defined in: [packages/core/src/context/canvas.ts:523](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L523)

Tests whether a point is inside the filled region of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`CanvasPath`](CanvasPath.md) |
| `x` | `number` |
| `y` | `number` |
| `fillRule?` | [`FillRule`](../type-aliases/FillRule.md) |

#### Returns

`boolean`

#### Overrides

[`Context`](Context.md).[`isPointInPath`](Context.md#ispointinpath)

***

### isPointInStroke()

> **isPointInStroke**(`path`, `x`, `y`): `boolean`

Defined in: [packages/core/src/context/canvas.ts:527](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L527)

Tests whether a point is on the stroked outline of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`CanvasPath`](CanvasPath.md) |
| `x` | `number` |
| `y` | `number` |

#### Returns

`boolean`

#### Overrides

[`Context`](Context.md).[`isPointInStroke`](Context.md#ispointinstroke)

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

#### Inherited from

[`Context`](Context.md).[`layer`](Context.md#layer)

***

### markRenderEnd()

> **markRenderEnd**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:764](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L764)

Signals the end of a render pass.

#### Returns

`void`

#### Inherited from

[`Context`](Context.md).[`markRenderEnd`](Context.md#markrenderend)

***

### markRenderStart()

> **markRenderStart**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:755](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L755)

Signals the start of a render pass; resets the rendered-elements list at depth 0.

#### Returns

`void`

#### Inherited from

[`Context`](Context.md).[`markRenderStart`](Context.md#markrenderstart)

***

### measureText()

> **measureText**(`text`, `font?`): `TextMetrics`

Defined in: [packages/core/src/context/canvas.ts:446](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L446)

Measures text dimensions using the context's current font or an optional override.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `font?` | `string` |

#### Returns

`TextMetrics`

#### Overrides

[`Context`](Context.md).[`measureText`](Context.md#measuretext)

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

[`Context`](Context.md).[`off`](Context.md#off)

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

[`Context`](Context.md).[`on`](Context.md#on)

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

[`Context`](Context.md).[`once`](Context.md#once)

***

### rescale()

> `protected` **rescale**(`width`, `height`): `void`

Defined in: [packages/core/src/context/canvas.ts:388](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L388)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `width` | `number` |
| `height` | `number` |

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`rescale`](Context.md#rescale)

***

### reset()

> **reset**(): `void`

Defined in: [packages/core/src/context/canvas.ts:420](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L420)

Resets the context to its initial state.

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`reset`](Context.md#reset)

***

### restore()

> **restore**(): `void`

Defined in: [packages/core/src/context/canvas.ts:412](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L412)

Restores the most recently saved state from the stack.

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`restore`](Context.md#restore)

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

[`Context`](Context.md).[`retain`](Context.md#retain)

***

### rotate()

> **rotate**(`angle`): `void`

Defined in: [packages/core/src/context/canvas.ts:424](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L424)

Applies a rotation transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `angle` | `number` |

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`rotate`](Context.md#rotate)

***

### save()

> **save**(): `void`

Defined in: [packages/core/src/context/canvas.ts:408](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L408)

Pushes the current state onto the stack and resets to defaults.

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`save`](Context.md#save)

***

### scale()

> **scale**(`x`, `y`): `void`

Defined in: [packages/core/src/context/canvas.ts:428](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L428)

Applies a scale transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`scale`](Context.md#scale)

***

### setTransform()

> **setTransform**(`a`, `b`, `c`, `d`, `e`, `f`): `void`

Defined in: [packages/core/src/context/canvas.ts:437](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L437)

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

[`Context`](Context.md).[`setTransform`](Context.md#settransform)

***

### transform()

> **transform**(`a`, `b`, `c`, `d`, `e`, `f`): `void`

Defined in: [packages/core/src/context/canvas.ts:442](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L442)

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

[`Context`](Context.md).[`transform`](Context.md#transform)

***

### translate()

> **translate**(`x`, `y`): `void`

Defined in: [packages/core/src/context/canvas.ts:432](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L432)

Applies a translation transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`Context`](Context.md).[`translate`](Context.md#translate)
