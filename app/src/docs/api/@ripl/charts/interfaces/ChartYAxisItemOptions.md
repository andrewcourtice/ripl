[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / ChartYAxisItemOptions

# Interface: ChartYAxisItemOptions\<TData\>

Defined in: [charts/src/core/options.ts:440](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L440)

Y-axis specific options extending the base axis item with a left/right position.

## Extends

- [`ChartAxisItemOptions`](ChartAxisItemOptions.md)\<`TData`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-font"></a> `font` | `string` | [`ChartAxisItemOptions`](ChartAxisItemOptions.md).[`font`](ChartAxisItemOptions.md#property-font) | [charts/src/core/options.ts:430](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L430) |
| <a id="property-fontcolor"></a> `fontColor` | `string` | [`ChartAxisItemOptions`](ChartAxisItemOptions.md).[`fontColor`](ChartAxisItemOptions.md#property-fontcolor) | [charts/src/core/options.ts:431](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L431) |
| <a id="property-format"></a> `format?` | [`AxisFormatType`](../type-aliases/AxisFormatType.md) \| (`value`) => `string` | [`ChartAxisItemOptions`](ChartAxisItemOptions.md).[`format`](ChartAxisItemOptions.md#property-format) | [charts/src/core/options.ts:436](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L436) |
| <a id="property-position"></a> `position` | `"left"` \| `"right"` | - | [charts/src/core/options.ts:441](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L441) |
| <a id="property-title"></a> `title?` | `string` | [`ChartAxisItemOptions`](ChartAxisItemOptions.md).[`title`](ChartAxisItemOptions.md#property-title) | [charts/src/core/options.ts:432](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L432) |
| <a id="property-value"></a> `value?` | keyof `TData` \| (`item`) => `any` | [`ChartAxisItemOptions`](ChartAxisItemOptions.md).[`value`](ChartAxisItemOptions.md#property-value) | [charts/src/core/options.ts:434](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L434) |
| <a id="property-visible"></a> `visible` | `boolean` | [`ChartAxisItemOptions`](ChartAxisItemOptions.md).[`visible`](ChartAxisItemOptions.md#property-visible) | [charts/src/core/options.ts:429](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L429) |
