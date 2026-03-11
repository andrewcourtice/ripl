[Documentation](../../../packages.md) / [@ripl/3d](../index.md) / Context3D

# Class: Context3D

Defined in: [3d/src/context.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L50)

3D rendering context extending the Canvas context with view/projection matrices and a face buffer for painter's algorithm sorting.

## Extends

- [`CanvasContext`](../../core/classes/CanvasContext.md)

## Constructors

### Constructor

> **new Context3D**(`target`, `options?`): `Context3D`

Defined in: [3d/src/context.ts:63](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L63)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` |
| `options?` | [`Context3DOptions`](../interfaces/Context3DOptions.md) |

#### Returns

`Context3D`

#### Overrides

[`CanvasContext`](../../core/classes/CanvasContext.md).[`constructor`](../../core/classes/CanvasContext.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-buffer"></a> `buffer` | `public` | `boolean` | `false` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`buffer`](../../core/classes/CanvasContext.md#property-buffer) | [core/src/context/\_base/index.ts:396](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L396) |
| <a id="property-context"></a> `context` | `protected` | `CanvasRenderingContext2D` | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`context`](../../core/classes/CanvasContext.md#property-context) | [core/src/context/canvas.ts:162](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L162) |
| <a id="property-currentstate"></a> `currentState` | `protected` | [`BaseState`](../../core/interfaces/BaseState.md) | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`currentState`](../../core/classes/CanvasContext.md#property-currentstate) | [core/src/context/\_base/index.ts:404](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L404) |
| <a id="property-element"></a> `element` | `readonly` | `HTMLCanvasElement` | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`element`](../../core/classes/CanvasContext.md#property-element) | [core/src/context/\_base/index.ts:394](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L394) |
| <a id="property-facebuffer"></a> `faceBuffer` | `public` | [`ProjectedFace3D`](../interfaces/ProjectedFace3D.md)[] | `[]` | - | [3d/src/context.ts:57](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L57) |
| <a id="property-height"></a> `height` | `public` | `number` | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`height`](../../core/classes/CanvasContext.md#property-height) | [core/src/context/\_base/index.ts:398](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L398) |
| <a id="property-lightdirection"></a> `lightDirection` | `public` | [`Vector3`](../type-aliases/Vector3.md) | `undefined` | - | [3d/src/context.ts:55](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L55) |
| <a id="property-lightmode"></a> `lightMode` | `public` | [`LightMode`](../type-aliases/LightMode.md) | `undefined` | - | [3d/src/context.ts:56](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L56) |
| <a id="property-parent"></a> `parent?` | `public` | [`EventBus`](../../core/classes/EventBus.md)\<[`ContextEventMap`](../../core/interfaces/ContextEventMap.md)\> | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`parent`](../../core/classes/CanvasContext.md#property-parent) | [core/src/core/event-bus.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L72) |
| <a id="property-projectionmatrix"></a> `projectionMatrix` | `public` | [`Matrix4`](../type-aliases/Matrix4.md) | `undefined` | - | [3d/src/context.ts:53](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L53) |
| <a id="property-renderdepth"></a> `renderDepth` | `protected` | `number` | `0` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`renderDepth`](../../core/classes/CanvasContext.md#property-renderdepth) | [core/src/context/\_base/index.ts:405](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L405) |
| <a id="property-renderedelements"></a> `renderedElements` | `public` | [`RenderElement`](../../core/interfaces/RenderElement.md)[] | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`renderedElements`](../../core/classes/CanvasContext.md#property-renderedelements) | [core/src/context/\_base/index.ts:414](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L414) |
| <a id="property-renderelement"></a> `renderElement?` | `public` | [`RenderElement`](../../core/interfaces/RenderElement.md) | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`renderElement`](../../core/classes/CanvasContext.md#property-renderelement) | [core/src/context/\_base/index.ts:413](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L413) |
| <a id="property-root"></a> `root` | `readonly` | `HTMLElement` | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`root`](../../core/classes/CanvasContext.md#property-root) | [core/src/context/\_base/index.ts:393](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L393) |
| <a id="property-scaledpr"></a> `scaleDPR` | `public` | [`Scale`](../../core/interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`scaleDPR`](../../core/classes/CanvasContext.md#property-scaledpr) | [core/src/context/\_base/index.ts:401](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L401) |
| <a id="property-scalex"></a> `scaleX` | `public` | [`Scale`](../../core/interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`scaleX`](../../core/classes/CanvasContext.md#property-scalex) | [core/src/context/\_base/index.ts:399](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L399) |
| <a id="property-scaley"></a> `scaleY` | `public` | [`Scale`](../../core/interfaces/Scale.md)\<`number`, `number`\> | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`scaleY`](../../core/classes/CanvasContext.md#property-scaley) | [core/src/context/\_base/index.ts:400](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L400) |
| <a id="property-states"></a> `states` | `protected` | [`BaseState`](../../core/interfaces/BaseState.md)[] | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`states`](../../core/classes/CanvasContext.md#property-states) | [core/src/context/\_base/index.ts:403](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L403) |
| <a id="property-type"></a> `type` | `readonly` | `string` | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`type`](../../core/classes/CanvasContext.md#property-type) | [core/src/context/\_base/index.ts:392](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L392) |
| <a id="property-viewmatrix"></a> `viewMatrix` | `public` | [`Matrix4`](../type-aliases/Matrix4.md) | `undefined` | - | [3d/src/context.ts:52](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L52) |
| <a id="property-viewprojectionmatrix"></a> `viewProjectionMatrix` | `public` | [`Matrix4`](../type-aliases/Matrix4.md) | `undefined` | - | [3d/src/context.ts:54](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L54) |
| <a id="property-width"></a> `width` | `public` | `number` | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`width`](../../core/classes/CanvasContext.md#property-width) | [core/src/context/\_base/index.ts:397](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L397) |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](#property-defaultkey) | `undefined` | [`CanvasContext`](../../core/classes/CanvasContext.md).[`defaultKey`](../../core/classes/CanvasContext.md#property-defaultkey) | [core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`currentRenderElement`](../../core/classes/CanvasContext.md#currentrenderelement)

***

### direction

#### Get Signature

> **get** **direction**(): [`Direction`](../../core/type-aliases/Direction.md)

Defined in: [core/src/context/canvas.ts:194](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L194)

##### Returns

[`Direction`](../../core/type-aliases/Direction.md)

#### Set Signature

> **set** **direction**(`value`): `void`

Defined in: [core/src/context/canvas.ts:198](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L198)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Direction`](../../core/type-aliases/Direction.md) |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`direction`](../../core/classes/CanvasContext.md#direction)

***

### fill

#### Get Signature

> **get** **fill**(): `string`

Defined in: [core/src/context/canvas.ts:166](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L166)

##### Returns

`string`

#### Set Signature

> **set** **fill**(`value`): `void`

Defined in: [core/src/context/canvas.ts:170](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L170)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`fill`](../../core/classes/CanvasContext.md#fill)

***

### filter

#### Get Signature

> **get** **filter**(): `string`

Defined in: [core/src/context/canvas.ts:186](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L186)

##### Returns

`string`

#### Set Signature

> **set** **filter**(`value`): `void`

Defined in: [core/src/context/canvas.ts:190](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L190)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`filter`](../../core/classes/CanvasContext.md#filter)

***

### font

#### Get Signature

> **get** **font**(): `string`

Defined in: [core/src/context/canvas.ts:202](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L202)

##### Returns

`string`

#### Set Signature

> **set** **font**(`value`): `void`

Defined in: [core/src/context/canvas.ts:206](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L206)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`font`](../../core/classes/CanvasContext.md#font)

***

### fontKerning

#### Get Signature

> **get** **fontKerning**(): [`FontKerning`](../../core/type-aliases/FontKerning.md)

Defined in: [core/src/context/canvas.ts:210](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L210)

##### Returns

[`FontKerning`](../../core/type-aliases/FontKerning.md)

#### Set Signature

> **set** **fontKerning**(`value`): `void`

Defined in: [core/src/context/canvas.ts:214](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L214)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`FontKerning`](../../core/type-aliases/FontKerning.md) |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`fontKerning`](../../core/classes/CanvasContext.md#fontkerning)

***

### globalCompositeOperation

#### Get Signature

> **get** **globalCompositeOperation**(): `unknown`

Defined in: [core/src/context/canvas.ts:226](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L226)

##### Returns

`unknown`

#### Set Signature

> **set** **globalCompositeOperation**(`value`): `void`

Defined in: [core/src/context/canvas.ts:230](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L230)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`globalCompositeOperation`](../../core/classes/CanvasContext.md#globalcompositeoperation)

***

### lineCap

#### Get Signature

> **get** **lineCap**(): [`LineCap`](../../core/type-aliases/LineCap.md)

Defined in: [core/src/context/canvas.ts:234](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L234)

##### Returns

[`LineCap`](../../core/type-aliases/LineCap.md)

#### Set Signature

> **set** **lineCap**(`value`): `void`

Defined in: [core/src/context/canvas.ts:238](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L238)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`LineCap`](../../core/type-aliases/LineCap.md) |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`lineCap`](../../core/classes/CanvasContext.md#linecap)

***

### lineDash

#### Get Signature

> **get** **lineDash**(): `number`[]

Defined in: [core/src/context/canvas.ts:242](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L242)

##### Returns

`number`[]

#### Set Signature

> **set** **lineDash**(`value`): `void`

Defined in: [core/src/context/canvas.ts:246](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L246)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number`[] |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`lineDash`](../../core/classes/CanvasContext.md#linedash)

***

### lineDashOffset

#### Get Signature

> **get** **lineDashOffset**(): `number`

Defined in: [core/src/context/canvas.ts:250](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L250)

##### Returns

`number`

#### Set Signature

> **set** **lineDashOffset**(`value`): `void`

Defined in: [core/src/context/canvas.ts:254](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L254)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`lineDashOffset`](../../core/classes/CanvasContext.md#linedashoffset)

***

### lineJoin

#### Get Signature

> **get** **lineJoin**(): [`LineJoin`](../../core/type-aliases/LineJoin.md)

Defined in: [core/src/context/canvas.ts:258](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L258)

##### Returns

[`LineJoin`](../../core/type-aliases/LineJoin.md)

#### Set Signature

> **set** **lineJoin**(`value`): `void`

Defined in: [core/src/context/canvas.ts:262](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L262)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`LineJoin`](../../core/type-aliases/LineJoin.md) |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`lineJoin`](../../core/classes/CanvasContext.md#linejoin)

***

### lineWidth

#### Get Signature

> **get** **lineWidth**(): `number`

Defined in: [core/src/context/canvas.ts:266](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L266)

##### Returns

`number`

#### Set Signature

> **set** **lineWidth**(`value`): `void`

Defined in: [core/src/context/canvas.ts:270](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L270)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`lineWidth`](../../core/classes/CanvasContext.md#linewidth)

***

### miterLimit

#### Get Signature

> **get** **miterLimit**(): `number`

Defined in: [core/src/context/canvas.ts:274](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L274)

##### Returns

`number`

#### Set Signature

> **set** **miterLimit**(`value`): `void`

Defined in: [core/src/context/canvas.ts:278](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L278)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`miterLimit`](../../core/classes/CanvasContext.md#miterlimit)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/src/context/canvas.ts:218](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L218)

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/src/context/canvas.ts:222](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L222)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`opacity`](../../core/classes/CanvasContext.md#opacity)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`rotation`](../../core/classes/CanvasContext.md#rotation)

***

### shadowBlur

#### Get Signature

> **get** **shadowBlur**(): `number`

Defined in: [core/src/context/canvas.ts:282](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L282)

##### Returns

`number`

#### Set Signature

> **set** **shadowBlur**(`value`): `void`

Defined in: [core/src/context/canvas.ts:286](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L286)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`shadowBlur`](../../core/classes/CanvasContext.md#shadowblur)

***

### shadowColor

#### Get Signature

> **get** **shadowColor**(): `string`

Defined in: [core/src/context/canvas.ts:290](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L290)

##### Returns

`string`

#### Set Signature

> **set** **shadowColor**(`value`): `void`

Defined in: [core/src/context/canvas.ts:294](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L294)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`shadowColor`](../../core/classes/CanvasContext.md#shadowcolor)

***

### shadowOffsetX

#### Get Signature

> **get** **shadowOffsetX**(): `number`

Defined in: [core/src/context/canvas.ts:298](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L298)

##### Returns

`number`

#### Set Signature

> **set** **shadowOffsetX**(`value`): `void`

Defined in: [core/src/context/canvas.ts:302](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L302)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`shadowOffsetX`](../../core/classes/CanvasContext.md#shadowoffsetx)

***

### shadowOffsetY

#### Get Signature

> **get** **shadowOffsetY**(): `number`

Defined in: [core/src/context/canvas.ts:306](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L306)

##### Returns

`number`

#### Set Signature

> **set** **shadowOffsetY**(`value`): `void`

Defined in: [core/src/context/canvas.ts:310](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L310)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`shadowOffsetY`](../../core/classes/CanvasContext.md#shadowoffsety)

***

### stroke

#### Get Signature

> **get** **stroke**(): `string`

Defined in: [core/src/context/canvas.ts:314](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L314)

##### Returns

`string`

#### Set Signature

> **set** **stroke**(`value`): `void`

Defined in: [core/src/context/canvas.ts:318](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L318)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`stroke`](../../core/classes/CanvasContext.md#stroke)

***

### textAlign

#### Get Signature

> **get** **textAlign**(): [`TextAlignment`](../../core/type-aliases/TextAlignment.md)

Defined in: [core/src/context/canvas.ts:334](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L334)

##### Returns

[`TextAlignment`](../../core/type-aliases/TextAlignment.md)

#### Set Signature

> **set** **textAlign**(`value`): `void`

Defined in: [core/src/context/canvas.ts:338](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L338)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TextAlignment`](../../core/type-aliases/TextAlignment.md) |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`textAlign`](../../core/classes/CanvasContext.md#textalign)

***

### textBaseline

#### Get Signature

> **get** **textBaseline**(): [`TextBaseline`](../../core/type-aliases/TextBaseline.md)

Defined in: [core/src/context/canvas.ts:342](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L342)

##### Returns

[`TextBaseline`](../../core/type-aliases/TextBaseline.md)

#### Set Signature

> **set** **textBaseline**(`value`): `void`

Defined in: [core/src/context/canvas.ts:346](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L346)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`TextBaseline`](../../core/type-aliases/TextBaseline.md) |

##### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`textBaseline`](../../core/classes/CanvasContext.md#textbaseline)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`transformOriginX`](../../core/classes/CanvasContext.md#transformoriginx)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`transformOriginY`](../../core/classes/CanvasContext.md#transformoriginy)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`transformScaleX`](../../core/classes/CanvasContext.md#transformscalex)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`transformScaleY`](../../core/classes/CanvasContext.md#transformscaley)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`translateX`](../../core/classes/CanvasContext.md#translatex)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`translateY`](../../core/classes/CanvasContext.md#translatey)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`zIndex`](../../core/classes/CanvasContext.md#zindex)

## Methods

### applyClip()

> **applyClip**(`path`, `fillRule?`): `void`

Defined in: [core/src/context/canvas.ts:457](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L457)

Clips subsequent drawing operations to the given path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`CanvasPath`](../../core/classes/CanvasPath.md) |
| `fillRule?` | [`FillRule`](../../core/type-aliases/FillRule.md) |

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`applyClip`](../../core/classes/CanvasContext.md#applyclip)

***

### applyFill()

> **applyFill**(`element`, `fillRule?`): `void`

Defined in: [core/src/context/canvas.ts:499](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L499)

Fills the given path or text element using the current fill style.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`ContextText`](../../core/classes/ContextText.md) \| [`CanvasPath`](../../core/classes/CanvasPath.md) |
| `fillRule?` | [`FillRule`](../../core/type-aliases/FillRule.md) |

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`applyFill`](../../core/classes/CanvasContext.md#applyfill)

***

### applyStroke()

> **applyStroke**(`element`): `void`

Defined in: [core/src/context/canvas.ts:511](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L511)

Strokes the given path or text element using the current stroke style.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`ContextText`](../../core/classes/ContextText.md) \| [`CanvasPath`](../../core/classes/CanvasPath.md) |

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`applyStroke`](../../core/classes/CanvasContext.md#applystroke)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`batch`](../../core/classes/CanvasContext.md#batch)

***

### clear()

> **clear**(): `void`

Defined in: [core/src/context/canvas.ts:416](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L416)

Clears the entire rendering surface.

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`clear`](../../core/classes/CanvasContext.md#clear)

***

### createPath()

> **createPath**(`id?`): [`CanvasPath`](../../core/classes/CanvasPath.md)

Defined in: [core/src/context/canvas.ts:453](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L453)

Creates a new path element, optionally reusing an id for SVG diffing efficiency.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id?` | `string` |

#### Returns

[`CanvasPath`](../../core/classes/CanvasPath.md)

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`createPath`](../../core/classes/CanvasContext.md#createpath)

***

### createText()

> **createText**(`options`): [`ContextText`](../../core/classes/ContextText.md)

Defined in: [core/src/context/\_base/index.ts:811](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L811)

Creates a new text element from the given options.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TextOptions`](../../core/type-aliases/TextOptions.md) |

#### Returns

[`ContextText`](../../core/classes/ContextText.md)

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`createText`](../../core/classes/CanvasContext.md#createtext)

***

### destroy()

> **destroy**(): `void`

Defined in: [core/src/context/\_base/index.ts:1066](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1066)

Destroys the context, removing the DOM element and disposing all resources.

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`destroy`](../../core/classes/CanvasContext.md#destroy)

***

### disableInteraction()

> **disableInteraction**(): `void`

Defined in: [core/src/context/\_base/index.ts:1054](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1054)

Disables DOM interaction events and clears the active element set.

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`disableInteraction`](../../core/classes/CanvasContext.md#disableinteraction)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`dispose`](../../core/classes/CanvasContext.md#dispose)

***

### drawImage()

> **drawImage**(`image`, `x`, `y`, `width?`, `height?`): `void`

Defined in: [core/src/context/canvas.ts:491](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L491)

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

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`drawImage`](../../core/classes/CanvasContext.md#drawimage)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`emit`](../../core/classes/CanvasContext.md#emit)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`emit`](../../core/classes/CanvasContext.md#emit)

***

### enableInteraction()

> **enableInteraction**(): `void`

Defined in: [core/src/context/\_base/index.ts:1026](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L1026)

Enables DOM interaction events (mouse enter, leave, move, click, drag) with element hit testing.

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`enableInteraction`](../../core/classes/CanvasContext.md#enableinteraction)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`getDefaultState`](../../core/classes/CanvasContext.md#getdefaultstate)

***

### getLightDirectionForRender()

> **getLightDirectionForRender**(): [`Vector3`](../type-aliases/Vector3.md)

Defined in: [3d/src/context.ts:136](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L136)

Returns the effective light direction for the current render, accounting for the light mode.

#### Returns

[`Vector3`](../type-aliases/Vector3.md)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`has`](../../core/classes/CanvasContext.md#has)

***

### init()

> `protected` **init**(): `void`

Defined in: [core/src/context/\_base/index.ts:690](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L690)

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`init`](../../core/classes/CanvasContext.md#init)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`invalidateTrackedElements`](../../core/classes/CanvasContext.md#invalidatetrackedelements)

***

### isPointInPath()

> **isPointInPath**(`path`, `x`, `y`, `fillRule?`): `boolean`

Defined in: [core/src/context/canvas.ts:523](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L523)

Tests whether a point is inside the filled region of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`CanvasPath`](../../core/classes/CanvasPath.md) |
| `x` | `number` |
| `y` | `number` |
| `fillRule?` | [`FillRule`](../../core/type-aliases/FillRule.md) |

#### Returns

`boolean`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`isPointInPath`](../../core/classes/CanvasContext.md#ispointinpath)

***

### isPointInStroke()

> **isPointInStroke**(`path`, `x`, `y`): `boolean`

Defined in: [core/src/context/canvas.ts:527](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L527)

Tests whether a point is on the stroked outline of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`CanvasPath`](../../core/classes/CanvasPath.md) |
| `x` | `number` |
| `y` | `number` |

#### Returns

`boolean`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`isPointInStroke`](../../core/classes/CanvasContext.md#ispointinstroke)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`layer`](../../core/classes/CanvasContext.md#layer)

***

### markRenderEnd()

> **markRenderEnd**(): `void`

Defined in: [3d/src/context.ts:163](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L163)

Signals the end of a render pass.

#### Returns

`void`

#### Overrides

[`CanvasContext`](../../core/classes/CanvasContext.md).[`markRenderEnd`](../../core/classes/CanvasContext.md#markrenderend)

***

### markRenderStart()

> **markRenderStart**(): `void`

Defined in: [3d/src/context.ts:155](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L155)

Signals the start of a render pass; resets the rendered-elements list at depth 0.

#### Returns

`void`

#### Overrides

[`CanvasContext`](../../core/classes/CanvasContext.md).[`markRenderStart`](../../core/classes/CanvasContext.md#markrenderstart)

***

### measureText()

> **measureText**(`text`, `font?`): `TextMetrics`

Defined in: [core/src/context/canvas.ts:446](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L446)

Measures text dimensions using the context's current font or an optional override.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `font?` | `string` |

#### Returns

`TextMetrics`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`measureText`](../../core/classes/CanvasContext.md#measuretext)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`off`](../../core/classes/CanvasContext.md#off)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`on`](../../core/classes/CanvasContext.md#on)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`once`](../../core/classes/CanvasContext.md#once)

***

### project()

> **project**(`point`): [`ProjectedPoint`](../type-aliases/ProjectedPoint.md)

Defined in: [3d/src/context.ts:145](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L145)

Projects a 3D world-space point to 2D screen coordinates.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `point` | [`Vector3`](../type-aliases/Vector3.md) |

#### Returns

[`ProjectedPoint`](../type-aliases/ProjectedPoint.md)

***

### rescale()

> `protected` **rescale**(`width`, `height`): `void`

Defined in: [3d/src/context.ts:84](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L84)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `width` | `number` |
| `height` | `number` |

#### Returns

`void`

#### Overrides

[`CanvasContext`](../../core/classes/CanvasContext.md).[`rescale`](../../core/classes/CanvasContext.md#rescale)

***

### reset()

> **reset**(): `void`

Defined in: [core/src/context/canvas.ts:420](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L420)

Resets the context to its initial state.

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`reset`](../../core/classes/CanvasContext.md#reset)

***

### restore()

> **restore**(): `void`

Defined in: [core/src/context/canvas.ts:412](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L412)

Restores the most recently saved state from the stack.

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`restore`](../../core/classes/CanvasContext.md#restore)

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

[`CanvasContext`](../../core/classes/CanvasContext.md).[`retain`](../../core/classes/CanvasContext.md#retain)

***

### rotate()

> **rotate**(`angle`): `void`

Defined in: [core/src/context/canvas.ts:424](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L424)

Applies a rotation transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `angle` | `number` |

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`rotate`](../../core/classes/CanvasContext.md#rotate)

***

### save()

> **save**(): `void`

Defined in: [core/src/context/canvas.ts:408](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L408)

Pushes the current state onto the stack and resets to defaults.

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`save`](../../core/classes/CanvasContext.md#save)

***

### scale()

> **scale**(`x`, `y`): `void`

Defined in: [core/src/context/canvas.ts:428](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L428)

Applies a scale transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`scale`](../../core/classes/CanvasContext.md#scale)

***

### setCamera()

> **setCamera**(`eye`, `target`, `up`): `void`

Defined in: [3d/src/context.ts:109](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L109)

Sets the view matrix from an eye position, look-at target, and up direction.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `eye` | [`Vector3`](../type-aliases/Vector3.md) |
| `target` | [`Vector3`](../type-aliases/Vector3.md) |
| `up` | [`Vector3`](../type-aliases/Vector3.md) |

#### Returns

`void`

***

### setOrthographic()

> **setOrthographic**(`left`, `right`, `bottom`, `top`, `near`, `far`): `void`

Defined in: [3d/src/context.ts:123](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L123)

Sets an orthographic projection with explicit frustum bounds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `left` | `number` |
| `right` | `number` |
| `bottom` | `number` |
| `top` | `number` |
| `near` | `number` |
| `far` | `number` |

#### Returns

`void`

***

### setPerspective()

> **setPerspective**(`fov`, `near`, `far`): `void`

Defined in: [3d/src/context.ts:115](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/context.ts#L115)

Updates the perspective projection with the given field of view, near, and far planes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fov` | `number` |
| `near` | `number` |
| `far` | `number` |

#### Returns

`void`

***

### setTransform()

> **setTransform**(`a`, `b`, `c`, `d`, `e`, `f`): `void`

Defined in: [core/src/context/canvas.ts:437](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L437)

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

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`setTransform`](../../core/classes/CanvasContext.md#settransform)

***

### transform()

> **transform**(`a`, `b`, `c`, `d`, `e`, `f`): `void`

Defined in: [core/src/context/canvas.ts:442](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L442)

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

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`transform`](../../core/classes/CanvasContext.md#transform)

***

### translate()

> **translate**(`x`, `y`): `void`

Defined in: [core/src/context/canvas.ts:432](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L432)

Applies a translation transformation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Inherited from

[`CanvasContext`](../../core/classes/CanvasContext.md).[`translate`](../../core/classes/CanvasContext.md#translate)
