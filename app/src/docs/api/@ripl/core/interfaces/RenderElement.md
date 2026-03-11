[Documentation](../../../packages.md) / [@ripl/core](../index.md) / RenderElement

# Interface: RenderElement

Defined in: [packages/core/src/context/\_base/index.ts:75](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L75)

Minimal interface for any element that can be rendered and hit-tested by a context.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-abstract"></a> `abstract` | `public` | `boolean` | [packages/core/src/context/\_base/index.ts:78](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L78) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/core/src/context/\_base/index.ts:76](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L76) |
| <a id="property-parent"></a> `parent?` | `public` | `RenderElement` | [packages/core/src/context/\_base/index.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L77) |
| <a id="property-pointerevents"></a> `pointerEvents` | `public` | [`RenderElementPointerEvents`](../type-aliases/RenderElementPointerEvents.md) | [packages/core/src/context/\_base/index.ts:79](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L79) |
| <a id="property-zindex"></a> `zIndex` | `public` | `number` | [packages/core/src/context/\_base/index.ts:80](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L80) |

## Methods

### emit()

> **emit**(`type`, `data`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:85](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L85)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `string` |
| `data` | `any` |

#### Returns

`void`

***

### getBoundingBox()?

> `optional` **getBoundingBox**(): [`Box`](../classes/Box.md)

Defined in: [packages/core/src/context/\_base/index.ts:81](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L81)

#### Returns

[`Box`](../classes/Box.md)

***

### has()

> **has**(`event`): `boolean`

Defined in: [packages/core/src/context/\_base/index.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L82)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `string` |

#### Returns

`boolean`

***

### intersectsWith()

> **intersectsWith**(`x`, `y`, `options?`): `boolean`

Defined in: [packages/core/src/context/\_base/index.ts:83](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L83)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `options?` | `Partial`\<[`RenderElementIntersectionOptions`](RenderElementIntersectionOptions.md)\> |

#### Returns

`boolean`
