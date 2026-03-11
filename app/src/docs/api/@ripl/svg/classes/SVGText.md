[Documentation](../../../packages.md) / [@ripl/svg](../index.md) / SVGText

# Class: SVGText

Defined in: [svg/src/index.ts:361](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L361)

SVG-specific text element mapping position and content to SVG `<text>` attributes.

## Extends

- [`ContextText`](../../core/classes/ContextText.md)

## Implements

- [`SVGContextElement`](../interfaces/SVGContextElement.md)

## Constructors

### Constructor

> **new SVGText**(`options`): `SVGText`

Defined in: [svg/src/index.ts:365](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L365)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TextOptions`](../../core/type-aliases/TextOptions.md) |

#### Returns

`SVGText`

#### Overrides

[`ContextText`](../../core/classes/ContextText.md).[`constructor`](../../core/classes/ContextText.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `public` | `string` | [`ContextText`](../../core/classes/ContextText.md).[`content`](../../core/classes/ContextText.md#property-content) | [core/src/context/\_base/index.ts:350](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L350) |
| <a id="property-definition"></a> `definition` | `public` | [`SVGContextElementDefinition`](../interfaces/SVGContextElementDefinition.md) | - | [svg/src/index.ts:363](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L363) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [`SVGContextElement`](../interfaces/SVGContextElement.md).[`id`](../interfaces/SVGContextElement.md#property-id) [`ContextText`](../../core/classes/ContextText.md).[`id`](../../core/classes/ContextText.md#property-id) | [core/src/context/\_base/index.ts:346](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L346) |
| <a id="property-maxwidth"></a> `maxWidth?` | `public` | `number` | [`ContextText`](../../core/classes/ContextText.md).[`maxWidth`](../../core/classes/ContextText.md#property-maxwidth) | [core/src/context/\_base/index.ts:351](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L351) |
| <a id="property-pathdata"></a> `pathData?` | `public` | `string` | [`ContextText`](../../core/classes/ContextText.md).[`pathData`](../../core/classes/ContextText.md#property-pathdata) | [core/src/context/\_base/index.ts:352](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L352) |
| <a id="property-startoffset"></a> `startOffset?` | `public` | `number` | [`ContextText`](../../core/classes/ContextText.md).[`startOffset`](../../core/classes/ContextText.md#property-startoffset) | [core/src/context/\_base/index.ts:353](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L353) |
| <a id="property-x"></a> `x` | `public` | `number` | [`ContextText`](../../core/classes/ContextText.md).[`x`](../../core/classes/ContextText.md#property-x) | [core/src/context/\_base/index.ts:348](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L348) |
| <a id="property-y"></a> `y` | `public` | `number` | [`ContextText`](../../core/classes/ContextText.md).[`y`](../../core/classes/ContextText.md#property-y) | [core/src/context/\_base/index.ts:349](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L349) |
